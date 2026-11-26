import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs"

/**
 * Dispatcher Lambda — the thin replacement for the old packaging Lambda.
 *
 * Keeps the exact same S3 trigger (ObjectCreated, prefix `raw/`). Instead of
 * encoding inline (which blew past Lambda's 15-min / disk limits on large 4K
 * masters), it launches one Fargate Spot task per master and returns quickly.
 * The heavy ffmpeg work lives in index.mjs inside the container image.
 *
 * RunTask does NOT throw when it can't start a task — it returns a `failures`
 * array (Spot capacity unavailable, vCPU quota = max 8 concurrent 8-vCPU tasks,
 * throttling, ENI/subnet/SG problems). Ignoring that made a failed launch look
 * like success and left the item "processing" forever. So:
 *   1. try FARGATE_SPOT, then on-demand FARGATE;
 *   2. if that fails, keep retrying on-demand with backoff for ~3.5 min
 *      (quota / throttling usually clears) — all inside one invocation, so the
 *      outcome is final when we give up;
 *   3. on final failure: log `[dispatch] ERROR` (CloudWatch alarm), POST
 *      /api/video/ingest/fail so the admin shows the reason, and throw → the
 *      async-invoke OnFailure destination (SNS) emails the alert. Async retries
 *      are set to 0 (setup script) because step 2 already retried; a Lambda
 *      retry after we reported `failed` would only confuse the admin UI.
 *
 * Deployed as `index.mjs` (handler `index.handler`) — see infra/setup-phase1.sh.
 * Runtime: Node 24 (ships @aws-sdk/client-ecs and fetch; no bundling).
 *
 * Env:
 *   ECS_CLUSTER          cluster name/ARN
 *   ECS_TASK_DEF         task definition family (or family:revision)
 *   CONTAINER_NAME       container name in the task def (default "packager")
 *   SUBNETS              comma-separated public subnet ids
 *   SECURITY_GROUPS      comma-separated security group ids (egress 443)
 *   APP_BASE_URL         app base URL for the failure report (optional)
 *   VIDEO_INGEST_SECRET  shared secret for the failure report (optional)
 *
 * IAM (execution role of THIS Lambda): ecs:RunTask on the task def, plus
 * iam:PassRole on the task role AND the task execution role; sns:Publish on the
 * alert topic (OnFailure destination).
 */

const ecs = new ECSClient({ region: process.env.AWS_REGION })

// Extra on-demand attempts after Spot + on-demand both failed (ms to wait first).
const RETRY_DELAYS_MS = [30_000, 60_000, 120_000]

export async function handler(event) {
  const failures = []
  for (const record of event.Records ?? []) {
    const bucket = record.s3.bucket.name
    const rawKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "))

    // Only masters. Ignore anything else that lands under raw/.
    if (!/^raw\/.+\/master\.[^.]+$/.test(rawKey)) {
      console.log(`[dispatch] skip (not a master): ${rawKey}`)
      continue
    }

    const r = await launchWithFallback(bucket, rawKey)
    if (r.ok) {
      console.log(`[dispatch] launched ${r.taskArn} on ${r.capacityProvider} for ${rawKey}`)
      continue
    }

    console.error(`[dispatch] ERROR could not start packaging for ${rawKey}: ${r.reason}`)
    await reportFailed(rawKey, `Packaging could not start: ${r.reason}`)
    failures.push(`${rawKey}: ${r.reason}`)
  }
  if (failures.length) throw new Error(`RunTask failed — ${failures.join("; ")}`)
  return { ok: true }
}

async function launchWithFallback(bucket, rawKey) {
  let r = await launch(bucket, rawKey, "FARGATE_SPOT")
  if (r.ok) return r
  console.warn(`[dispatch] Spot launch failed for ${rawKey}: ${r.reason} — retrying on-demand`)

  r = await launch(bucket, rawKey, "FARGATE")
  for (const delay of RETRY_DELAYS_MS) {
    if (r.ok) return r
    console.warn(`[dispatch] on-demand launch failed for ${rawKey}: ${r.reason} — retrying in ${delay / 1000}s`)
    await new Promise((res) => setTimeout(res, delay))
    r = await launch(bucket, rawKey, "FARGATE")
  }
  return r
}

async function launch(bucket, rawKey, capacityProvider) {
  let res
  try {
    res = await ecs.send(
      new RunTaskCommand({
        cluster: process.env.ECS_CLUSTER,
        taskDefinition: process.env.ECS_TASK_DEF,
        // Spot first (~70% cheaper); on-demand as fallback.
        capacityProviderStrategy: [{ capacityProvider, weight: 1 }],
        count: 1,
        networkConfiguration: {
          awsvpcConfiguration: {
            subnets: (process.env.SUBNETS ?? "").split(",").filter(Boolean),
            securityGroups: (process.env.SECURITY_GROUPS ?? "").split(",").filter(Boolean),
            // Public subnet + public IP so the task reaches S3 and the app with
            // no NAT gateway (a NAT would add an idle hourly cost).
            assignPublicIp: "ENABLED",
          },
        },
        overrides: {
          containerOverrides: [
            {
              name: process.env.CONTAINER_NAME || "packager",
              environment: [
                { name: "BUCKET", value: bucket },
                { name: "RAW_KEY", value: rawKey },
              ],
            },
          ],
        },
      })
    )
  } catch (err) {
    // Throttling, AccessDenied, InvalidParameter (bad subnet), …
    return { ok: false, reason: `${err?.name ?? "Error"}: ${err?.message ?? err}` }
  }
  const failures = res.failures ?? []
  if ((res.tasks ?? []).length === 1 && failures.length === 0) {
    return { ok: true, taskArn: res.tasks[0].taskArn, capacityProvider }
  }
  return {
    ok: false,
    reason: failures.map((f) => `${f.reason}${f.detail ? ` (${f.detail})` : ""}`).join("; ") || "no task started",
  }
}

async function reportFailed(rawKey, reason) {
  const base = String(process.env.APP_BASE_URL ?? "").replace(/\/+$/, "")
  const secret = process.env.VIDEO_INGEST_SECRET
  const assetKey = rawKey.match(/^raw\/(.+)\/master\.[^.]+$/)?.[1]
  if (!base || !secret || !assetKey) {
    console.warn("[dispatch] APP_BASE_URL/VIDEO_INGEST_SECRET not set — failure not reported to the app")
    return
  }
  try {
    const res = await fetch(`${base}/api/video/ingest/fail`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ assetKey, reason }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) console.error(`[dispatch] ERROR fail report ${res.status}: ${await res.text().catch(() => "")}`)
  } catch (err) {
    console.error(`[dispatch] ERROR fail report: ${err?.message ?? err}`)
  }
}
