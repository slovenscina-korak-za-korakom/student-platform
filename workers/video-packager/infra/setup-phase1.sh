#!/usr/bin/env bash
# Video pipeline hardening — Phase 1 AWS setup (Steps 1, 10, 3d of
# VIDEO_PIPELINE_HARDENING_PLAN.md). Idempotent: safe to re-run.
#
#   1. SNS topic `video-pipeline-alerts` + email subscription
#   2. Metric filters + alarms on the worker, dispatcher and watcher log groups
#   3. Dispatcher Lambda `video-packager`: deploy dispatch.mjs, add
#      APP_BASE_URL + VIDEO_INGEST_SECRET env (copied from the worker task
#      definition), async retries = 0, OnFailure → SNS, sns:Publish permission
#   4. Watcher Lambda `video-task-watcher` (+ IAM role) and the EventBridge rule
#      on ECS "Task State Change" → STOPPED
#
# Requirements: aws CLI v2 logged in to account 623210504253, jq, zip.
# Usage:   ./infra/setup-phase1.sh            (from workers/video-packager)
#          DRY_RUN=1 ./infra/setup-phase1.sh  (print the plan, change nothing)
set -euo pipefail

export AWS_REGION="${AWS_REGION:-eu-central-1}"
export AWS_PAGER=""
ACCOUNT="623210504253"
ALERT_EMAIL="${ALERT_EMAIL:-sebastjan.bas@gmail.com}"
CLUSTER="video"
TASK_FAMILY="video-packager"
DISPATCHER="video-packager"
WATCHER="video-task-watcher"
WATCHER_ROLE="video-task-watcher-role"
TOPIC_NAME="video-pipeline-alerts"
TOPIC_ARN="arn:aws:sns:${AWS_REGION}:${ACCOUNT}:${TOPIC_NAME}"
RULE="video-task-stopped"
HERE="$(cd "$(dirname "$0")/.." && pwd)"

# DRY_RUN prints each mutating command (secret masked) instead of running it.
run() {
  if [[ "${DRY_RUN:-}" == 1 ]]; then
    local line="$*"
    [[ -n "${VIDEO_INGEST_SECRET:-}" ]] && line="${line//"$VIDEO_INGEST_SECRET"/***}"
    echo "DRY: $line" >&2
  else
    "$@"
  fi
}
step() { printf '\n\033[1m== %s\033[0m\n' "$*"; }

for bin in aws jq zip; do command -v "$bin" >/dev/null || { echo "missing: $bin"; exit 1; }; done
[[ "$(aws sts get-caller-identity --query Account --output text)" == "$ACCOUNT" ]] || { echo "wrong AWS account"; exit 1; }

# ── Values taken from existing infra (never printed) ──────────────────────────
TASK_DEF_JSON="$(aws ecs describe-task-definition --task-definition "$TASK_FAMILY" --query taskDefinition)"
APP_BASE_URL="$(jq -r '.containerDefinitions[0].environment[] | select(.name=="APP_BASE_URL") | .value' <<<"$TASK_DEF_JSON")"
APP_BASE_URL="${APP_BASE_URL%/}"
VIDEO_INGEST_SECRET="$(jq -r '.containerDefinitions[0].environment[] | select(.name=="VIDEO_INGEST_SECRET") | .value' <<<"$TASK_DEF_JSON")"
TASK_ROLE="$(jq -r .taskRoleArn <<<"$TASK_DEF_JSON")"
EXEC_ROLE="$(jq -r .executionRoleArn <<<"$TASK_DEF_JSON")"
DISP_CFG="$(aws lambda get-function-configuration --function-name "$DISPATCHER")"
DISP_ROLE_NAME="$(jq -r '.Role | split("/") | last' <<<"$DISP_CFG")"
DISP_RUNTIME="$(jq -r .Runtime <<<"$DISP_CFG")"
SUBNETS="$(jq -r .Environment.Variables.SUBNETS <<<"$DISP_CFG")"
SECURITY_GROUPS="$(jq -r .Environment.Variables.SECURITY_GROUPS <<<"$DISP_CFG")"
[[ -n "$APP_BASE_URL" && -n "$VIDEO_INGEST_SECRET" && -n "$SUBNETS" ]] || { echo "could not read existing config"; exit 1; }
echo "APP_BASE_URL=$APP_BASE_URL  runtime=$DISP_RUNTIME  dispatcher role=$DISP_ROLE_NAME"

# ── 1. SNS ────────────────────────────────────────────────────────────────────
step "1. SNS topic + email subscription"
run aws sns create-topic --name "$TOPIC_NAME" >/dev/null
if aws sns list-subscriptions-by-topic --topic-arn "$TOPIC_ARN" 2>/dev/null \
    | jq -e --arg e "$ALERT_EMAIL" '.Subscriptions[] | select(.Endpoint==$e)' >/dev/null; then
  echo "subscription for $ALERT_EMAIL exists"
else
  run aws sns subscribe --topic-arn "$TOPIC_ARN" --protocol email --notification-endpoint "$ALERT_EMAIL" >/dev/null
  echo ">>> Confirm the subscription email sent to $ALERT_EMAIL"
fi

# ── 2. Metric filters + alarms ────────────────────────────────────────────────
step "2. Metric filters + alarms"
alarm() { # log-group filter-name pattern metric alarm-name description
  local lg="$1" fname="$2" pattern="$3" metric="$4" aname="$5" desc="$6"
  run aws logs create-log-group --log-group-name "$lg" 2>/dev/null || true
  run aws logs put-metric-filter --log-group-name "$lg" --filter-name "$fname" \
    --filter-pattern "$pattern" \
    --metric-transformations "metricName=${metric},metricNamespace=VideoPipeline,metricValue=1,defaultValue=0"
  run aws cloudwatch put-metric-alarm --alarm-name "$aname" --alarm-description "$desc" \
    --namespace VideoPipeline --metric-name "$metric" \
    --statistic Sum --period 300 --evaluation-periods 1 --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold --treat-missing-data notBreaching \
    --alarm-actions "$TOPIC_ARN"
  echo "alarm $aname on $lg"
}
alarm /ecs/video-packager worker-failed \
  '?"[worker] FAILED" ?"complete callback failed" ?"[recoverable]" ?"No space left on device"' \
  VideoWorkerFailed video-worker-failed \
  "Packaging worker failed or its callback was rejected — see /ecs/video-packager"
alarm "/aws/lambda/${DISPATCHER}" dispatch-error \
  '?"[dispatch] ERROR" ?"Task timed out"' \
  VideoDispatchError video-dispatch-error \
  "Dispatcher could not start a packaging task — see /aws/lambda/${DISPATCHER}"
alarm "/aws/lambda/${WATCHER}" watcher-error \
  '?"[watcher] ERROR" ?"Task timed out"' \
  VideoWatcherError video-watcher-error \
  "Task watcher failed to report/retry — see /aws/lambda/${WATCHER}"
run aws logs put-retention-policy --log-group-name "/aws/lambda/${WATCHER}" --retention-in-days 90

# ── 3. Dispatcher ─────────────────────────────────────────────────────────────
step "3. Dispatcher Lambda ($DISPATCHER)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
cp "$HERE/dispatch.mjs" "$TMP/index.mjs"
(cd "$TMP" && zip -q dispatch.zip index.mjs)
run aws lambda update-function-code --function-name "$DISPATCHER" --zip-file "fileb://$TMP/dispatch.zip" >/dev/null
run aws lambda wait function-updated-v2 --function-name "$DISPATCHER"
NEW_ENV="$(jq -c --arg u "$APP_BASE_URL" --arg s "$VIDEO_INGEST_SECRET" \
  '{Variables: (.Environment.Variables + {APP_BASE_URL: $u, VIDEO_INGEST_SECRET: $s})}' <<<"$DISP_CFG")"
# In-handler retries take up to ~4 min; keep the timeout ≥ 300 s.
DISP_TIMEOUT="$(jq -r '[.Timeout, 300] | max' <<<"$DISP_CFG")"
run aws lambda update-function-configuration --function-name "$DISPATCHER" \
  --environment "$NEW_ENV" --timeout "$DISP_TIMEOUT" >/dev/null
run aws lambda wait function-updated-v2 --function-name "$DISPATCHER"
run aws iam put-role-policy --role-name "$DISP_ROLE_NAME" --policy-name video-alerts-publish \
  --policy-document "$(jq -nc --arg t "$TOPIC_ARN" '{Version:"2012-10-17",Statement:[{Effect:"Allow",Action:"sns:Publish",Resource:$t}]}')"
run aws lambda put-function-event-invoke-config --function-name "$DISPATCHER" \
  --maximum-retry-attempts 0 \
  --destination-config "{\"OnFailure\":{\"Destination\":\"$TOPIC_ARN\"}}" >/dev/null
echo "dispatcher deployed; env merged; retries=0; OnFailure → SNS"

# ── 4. Watcher Lambda + EventBridge ───────────────────────────────────────────
step "4. Watcher Lambda ($WATCHER) + EventBridge rule ($RULE)"
if ! aws iam get-role --role-name "$WATCHER_ROLE" >/dev/null 2>&1; then
  run aws iam create-role --role-name "$WATCHER_ROLE" --assume-role-policy-document \
    '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
  run aws iam attach-role-policy --role-name "$WATCHER_ROLE" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
  CREATED_ROLE=1
fi
run aws iam put-role-policy --role-name "$WATCHER_ROLE" --policy-name video-task-watcher \
  --policy-document "$(jq -nc \
    --arg td "arn:aws:ecs:${AWS_REGION}:${ACCOUNT}:task-definition/${TASK_FAMILY}:*" \
    --arg cl "arn:aws:ecs:${AWS_REGION}:${ACCOUNT}:cluster/${CLUSTER}" \
    --arg tr "$TASK_ROLE" --arg er "$EXEC_ROLE" --arg t "$TOPIC_ARN" '{
      Version: "2012-10-17",
      Statement: [
        {Effect: "Allow", Action: "ecs:RunTask", Resource: $td, Condition: {ArnEquals: {"ecs:cluster": $cl}}},
        {Effect: "Allow", Action: "ecs:ListTasks", Resource: "*", Condition: {ArnEquals: {"ecs:cluster": $cl}}},
        {Effect: "Allow", Action: "iam:PassRole", Resource: [$tr, $er]},
        {Effect: "Allow", Action: "sns:Publish", Resource: $t}
      ]}')"
[[ "${CREATED_ROLE:-}" == 1 && "${DRY_RUN:-}" != 1 ]] && { echo "waiting for IAM role propagation…"; sleep 15; }

cp "$HERE/watcher.mjs" "$TMP/index.mjs"
(cd "$TMP" && rm -f watcher.zip && zip -q watcher.zip index.mjs)
WATCHER_ENV="$(jq -nc --arg u "$APP_BASE_URL" --arg s "$VIDEO_INGEST_SECRET" --arg t "$TOPIC_ARN" \
  --arg c "$CLUSTER" --arg sn "$SUBNETS" --arg sg "$SECURITY_GROUPS" \
  '{Variables: {APP_BASE_URL: $u, VIDEO_INGEST_SECRET: $s, ALERT_TOPIC_ARN: $t, ECS_CLUSTER: $c, SUBNETS: $sn, SECURITY_GROUPS: $sg, CONTAINER_NAME: "packager"}}')"
if aws lambda get-function --function-name "$WATCHER" >/dev/null 2>&1; then
  run aws lambda update-function-code --function-name "$WATCHER" --zip-file "fileb://$TMP/watcher.zip" >/dev/null
  run aws lambda wait function-updated-v2 --function-name "$WATCHER"
  run aws lambda update-function-configuration --function-name "$WATCHER" --environment "$WATCHER_ENV" --timeout 30 >/dev/null
else
  run aws lambda create-function --function-name "$WATCHER" --runtime "$DISP_RUNTIME" \
    --handler index.handler --role "arn:aws:iam::${ACCOUNT}:role/${WATCHER_ROLE}" \
    --zip-file "fileb://$TMP/watcher.zip" --timeout 30 --memory-size 256 \
    --environment "$WATCHER_ENV" >/dev/null
fi
run aws lambda wait function-active-v2 --function-name "$WATCHER"

PATTERN="$(jq -nc --arg cl "arn:aws:ecs:${AWS_REGION}:${ACCOUNT}:cluster/${CLUSTER}" --arg g "family:${TASK_FAMILY}" '{
  source: ["aws.ecs"], "detail-type": ["ECS Task State Change"],
  detail: {clusterArn: [$cl], lastStatus: ["STOPPED"], group: [$g]}}')"
run aws events put-rule --name "$RULE" --event-pattern "$PATTERN" \
  --description "Packaging task stopped → video-task-watcher" >/dev/null
WATCHER_ARN="arn:aws:lambda:${AWS_REGION}:${ACCOUNT}:function:${WATCHER}"
run aws events put-targets --rule "$RULE" --targets "Id=watcher,Arn=${WATCHER_ARN}" >/dev/null
run aws lambda add-permission --function-name "$WATCHER" --statement-id eventbridge-task-stopped \
  --action lambda:InvokeFunction --principal events.amazonaws.com \
  --source-arn "arn:aws:events:${AWS_REGION}:${ACCOUNT}:rule/${RULE}" >/dev/null 2>&1 || echo "(invoke permission already present)"

step "Done"
echo "Next: confirm the SNS email, rebuild + push the worker image (README), then run the tests in the plan."
