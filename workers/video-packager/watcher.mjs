import { ECSClient, ListTasksCommand, RunTaskCommand } from "@aws-sdk/client-ecs"
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns"

/**
 * Task watcher Lambda (`video-task-watcher`) — catches packaging tasks that die
 * in ways the worker can't report itself: OOM kill, image pull / ENI errors,
 * StopTask, Spot interruption (the worker only logs on SIGTERM).
 *
 * Trigger: EventBridge rule on "ECS Task State Change", cluster `video`,
 * lastStatus STOPPED, group family:video-packager (see infra/setup-phase1.sh).
 *
 * Per stopped task:
 *   - exit code 0                         → success, ignore.
 *   - Spot interruption on attempt 1      → RunTask again on on-demand FARGATE with
 *                                           ATTEMPT=2 (never loops), info email.
 *   - anything else                       → POST /api/video/ingest/fail (no-op if
 *                                           the worker already reported it) +
 *                                           alert email.
 *
 * Deployed as `index.mjs` (handler `index.handler`), runtime Node 24.
 *
 * Env: APP_BASE_URL, VIDEO_INGEST_SECRET, ALERT_TOPIC_ARN, ECS_CLUSTER,
 *      SUBNETS, SECURITY_GROUPS, CONTAINER_NAME (default "packager").
 */

const ecs = new ECSClient({ region: process.env.AWS_REGION })
const sns = new SNSClient({ region: process.env.AWS_REGION })
const CONTAINER = process.env.CONTAINER_NAME || "packager"

export async function handler(event) {
  const d = event?.detail ?? {}
  if (d.lastStatus !== "STOPPED") return { skipped: "not stopped" }

  const container = (d.containers ?? []).find((c) => c.name === CONTAINER) ?? d.containers?.[0]
  const override = (d.overrides?.containerOverrides ?? []).find((o) => o.name === CONTAINER)
  const env = Object.fromEntries((override?.environment ?? []).map((e) => [e.name, e.value]))
  const rawKey = env.RAW_KEY
  const taskId = String(d.taskArn ?? "").split("/").pop()

  if (!rawKey) {
    console.log(`[watcher] skip ${taskId}: no RAW_KEY override`)
    return { skipped: "no RAW_KEY" }
  }
  const exitCode = container?.exitCode
  if (exitCode === 0) {
    console.log(`[watcher] ${taskId} ok (${rawKey})`)
    return { ok: true }
  }

  const reason =
    [d.stoppedReason, container?.reason, exitCode != null ? `exit ${exitCode}` : "container never ran"]
      .filter(Boolean)
      .join(" — ") || "task stopped"
  const attempt = Number(env.ATTEMPT || 1)
  const spotInterrupted = d.stopCode === "SpotInterruption" || /spot|interrupt/i.test(d.stoppedReason ?? "")
  console.warn(`[watcher] ${taskId} stopped abnormally (${rawKey}, attempt ${attempt}): ${reason}`)

  if (spotInterrupted && attempt < 2) {
    const retried = await retryOnDemand(d, env, taskId)
    if (retried.ok) {
      await alert(
        `Video packaging retried on on-demand (Spot interruption)`,
        `Task ${taskId} for ${rawKey} was interrupted (${reason}).\nRe-launched as ${retried.taskArn} on FARGATE (attempt 2).`
      )
      return { retried: retried.taskArn }
    }
    console.error(`[watcher] ERROR on-demand retry failed for ${rawKey}: ${retried.reason}`)
  }

  const assetKey = rawKey.match(/^raw\/(.+)\/master\.[^.]+$/)?.[1]
  const report = assetKey ? await reportFailed(assetKey, `Packaging task stopped: ${reason}`) : "no assetKey"
  await alert(
    `Video packaging FAILED: ${assetKey ?? rawKey}`,
    [
      `Task:     ${d.taskArn}`,
      `Raw key:  ${rawKey}`,
      `Attempt:  ${attempt}`,
      `Reason:   ${reason}`,
      `Stop code: ${d.stopCode ?? "—"}`,
      `App report: ${report}`,
      ``,
      `Logs: CloudWatch /ecs/video-packager, stream pkg/packager/${taskId}`,
    ].join("\n")
  )
  return { failed: true }
}

async function retryOnDemand(d, env, taskId) {
  // De-dupe: EventBridge can deliver an event twice.
  const startedBy = `retry-${taskId}`.slice(0, 128)
  try {
    const existing = await ecs.send(new ListTasksCommand({ cluster: d.clusterArn, startedBy }))
    if ((existing.taskArns ?? []).length) return { ok: true, taskArn: existing.taskArns[0] }

    const res = await ecs.send(
      new RunTaskCommand({
        cluster: d.clusterArn,
        taskDefinition: d.taskDefinitionArn,
        capacityProviderStrategy: [{ capacityProvider: "FARGATE", weight: 1 }],
        count: 1,
        startedBy,
        networkConfiguration: {
          awsvpcConfiguration: {
            subnets: (process.env.SUBNETS ?? "").split(",").filter(Boolean),
            securityGroups: (process.env.SECURITY_GROUPS ?? "").split(",").filter(Boolean),
            assignPublicIp: "ENABLED",
          },
        },
        overrides: {
          containerOverrides: [
            {
              name: CONTAINER,
              environment: [
                { name: "BUCKET", value: env.BUCKET },
                { name: "RAW_KEY", value: env.RAW_KEY },
                { name: "ATTEMPT", value: "2" },
              ],
            },
          ],
        },
      })
    )
    const failures = res.failures ?? []
    if ((res.tasks ?? []).length === 1 && failures.length === 0) return { ok: true, taskArn: res.tasks[0].taskArn }
    return { ok: false, reason: failures.map((f) => `${f.reason}${f.detail ? ` (${f.detail})` : ""}`).join("; ") || "no task started" }
  } catch (err) {
    return { ok: false, reason: `${err?.name ?? "Error"}: ${err?.message ?? err}` }
  }
}

async function reportFailed(assetKey, reason) {
  const base = String(process.env.APP_BASE_URL ?? "").replace(/\/+$/, "")
  try {
    const res = await fetch(`${base}/api/video/ingest/fail`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.VIDEO_INGEST_SECRET}` },
      body: JSON.stringify({ assetKey, reason }),
      signal: AbortSignal.timeout(15_000),
    })
    const text = await res.text().catch(() => "")
    if (!res.ok) console.error(`[watcher] ERROR fail report ${res.status}: ${text}`)
    return `${res.status} ${text}`.slice(0, 300)
  } catch (err) {
    console.error(`[watcher] ERROR fail report: ${err?.message ?? err}`)
    return `error: ${err?.message ?? err}`
  }
}

async function alert(subject, message) {
  if (!process.env.ALERT_TOPIC_ARN) return
  try {
    await sns.send(
      new PublishCommand({ TopicArn: process.env.ALERT_TOPIC_ARN, Subject: subject.slice(0, 99), Message: message })
    )
  } catch (err) {
    console.error(`[watcher] ERROR SNS publish: ${err?.message ?? err}`)
  }
}
