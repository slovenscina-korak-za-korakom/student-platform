import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs"

/**
 * Dispatcher Lambda — the thin replacement for the old packaging Lambda.
 *
 * Keeps the exact same S3 trigger (ObjectCreated, prefix `raw/`). Instead of
 * encoding inline (which blew past Lambda's 15-min / disk limits on large 4K
 * masters), it launches one Fargate Spot task per master and returns in ms. The
 * heavy ffmpeg work lives in index.mjs inside the container image.
 *
 * Runtime: Node 20 (the AWS-provided @aws-sdk/client-ecs ships with it — no
 * bundling; paste this straight into the console editor).
 *
 * Env:
 *   ECS_CLUSTER       cluster name/ARN
 *   ECS_TASK_DEF      task definition family (or family:revision)
 *   CONTAINER_NAME    container name in the task def (default "packager")
 *   SUBNETS           comma-separated public subnet ids
 *   SECURITY_GROUPS   comma-separated security group ids (egress 443)
 *
 * IAM (execution role of THIS Lambda): ecs:RunTask on the task def, plus
 * iam:PassRole on the task role AND the task execution role.
 */

const ecs = new ECSClient({ region: process.env.AWS_REGION })

export async function handler(event) {
  for (const record of event.Records ?? []) {
    const bucket = record.s3.bucket.name
    const rawKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "))

    // Only masters. Ignore anything else that lands under raw/.
    if (!/^raw\/.+\/master\.[^.]+$/.test(rawKey)) {
      console.log(`[dispatch] skip (not a master): ${rawKey}`)
      continue
    }

    await ecs.send(
      new RunTaskCommand({
        cluster: process.env.ECS_CLUSTER,
        taskDefinition: process.env.ECS_TASK_DEF,
        // Fargate Spot — ~70% cheaper; a rare interruption just re-runs.
        capacityProviderStrategy: [{ capacityProvider: "FARGATE_SPOT", weight: 1 }],
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
    console.log(`[dispatch] launched task for ${rawKey}`)
  }
  return { ok: true }
}
