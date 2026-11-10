# video-packager (AWS Fargate)

Turns an uploaded video master into a **Rung-3 AES-128 encrypted HLS** ladder.
This is the only part of the video pipeline that runs in AWS rather than the
Next.js app. The full design lives in `docs/video-drm-streaming.md`; this file
documents the worker itself — its architecture, the contract it implements, and
the AWS resources it expects to run against.

## Why Fargate, not Lambda

Masters are up to ~4 GB / 30 min of 4K. Software H.264 encoding of a
three-rendition ladder exceeds Lambda's **15-min timeout** and its small
ephemeral disk (even an 8-min 4K clip timed out). Fargate has no time cap,
configurable vCPU, and up to 200 GB ephemeral disk. It is billed **per second
while a task runs**, so it costs **$0 when idle** — there is no cluster or hosting
fee — and a 30-min encode is a few cents on **Fargate Spot**.

## Architecture

```
S3  raw/<assetKey>/master.<ext>   (ObjectCreated, prefix raw/)
 └► dispatch.mjs   — Lambda, returns in ms
      └► ecs:RunTask (Fargate Spot), passing BUCKET + RAW_KEY as overrides
 └► index.mjs      — container task (one master per task, then exits)
      download master (streamed to disk) → generate 16-byte AES key + IV
      ffmpeg → hls/<assetKey>/master.m3u8 + stream_N.m3u8 + *.ts  (encrypted)
      put key → keys/<assetKey>.key   (private; never presigned)
      ffprobe duration
      POST {APP_BASE_URL}/api/video/ingest/complete  (Bearer VIDEO_INGEST_SECRET)
```

A single S3 upload event fans out to one short-lived Fargate task. The
dispatcher does no work beyond translating the S3 event into a `RunTask` call, so
it stays well inside Lambda's limits; all heavy lifting happens in the container.

## Components

| File | Role |
|------|------|
| `index.mjs` | The packaging worker. Container entrypoint; reads `BUCKET`/`RAW_KEY` from the environment, packages one master, exits non-zero on failure so a bad run surfaces as a FAILED task rather than looking "done". |
| `dispatch.mjs` | The dispatcher Lambda. Replaces the old packaging Lambda, keeps the same S3 ObjectCreated trigger, and calls `ecs:RunTask` with the target object passed as container overrides. |
| `Dockerfile` | `linux/amd64` image bundling the static `bin/ffmpeg` and `bin/ffprobe`; sets `FFMPEG_PATH`/`FFPROBE_PATH` to them. |
| `.dockerignore` | Keeps `node_modules`, local artifacts, etc. out of the build context. |

## Output contract (app integration)

The output is byte-for-byte identical to the previous Lambda's, so **no app-side
change is required** to adopt this worker.

- The key URI written into every media playlist is the literal string `key`. The
  app's `/api/video/[itemId]/[...path]` route rewrites nothing on that line, so it
  resolves to `/api/video/[itemId]/key`, which is enrollment-gated.
- The AES key is written only to `keys/<assetKey>.key`, never under `hls/`, and is
  never presigned.
- On success the worker POSTs `{APP_BASE_URL}/api/video/ingest/complete` with a
  `Bearer VIDEO_INGEST_SECRET` header; that endpoint flips the item to `ready` and
  records the probed duration.

## Configuration

### Container task (`index.mjs`)

| Env var | Purpose |
|---------|---------|
| `BUCKET` | Source/destination bucket (passed per-run by the dispatcher). |
| `RAW_KEY` | Key of the uploaded master, e.g. `raw/courses/1/items/42/abc/master.mp4` (passed per-run). |
| `AWS_REGION` | Region of the bucket and app. |
| `APP_BASE_URL` | Base URL the ingest callback is POSTed to. |
| `VIDEO_INGEST_SECRET` | Shared secret for the callback; must match the app's value. |
| `FFMPEG_PATH` / `FFPROBE_PATH` | Binary paths; the image sets these to the bundled static builds. |

`VIDEO_INGEST_SECRET` is a real secret. For defense-in-depth, store it in SSM
Parameter Store (SecureString) and inject it via the task definition's
`secrets` / `valueFrom`, granting `ssm:GetParameters` to the execution role.

### Dispatcher Lambda (`dispatch.mjs`)

| Env var | Purpose |
|---------|---------|
| `ECS_CLUSTER` | Cluster that runs the task. |
| `ECS_TASK_DEF` | Task-definition family. |
| `CONTAINER_NAME` | Container name overrides target — must match the task definition's container name. |
| `SUBNETS` | Comma-separated subnet ids (public — see Networking). |
| `SECURITY_GROUPS` | Security group id(s) allowing outbound 443. |

The Node 20 Lambda runtime already bundles `@aws-sdk/client-ecs`, so the
dispatcher needs no dependency upload.

## AWS resources it expects

- **ECR repository** holding the `linux/amd64` image (the Dockerfile bundles
  x86-64 ffmpeg, so builds must target `--platform linux/amd64`).
- **ECS Fargate cluster** — no standing cost.
- **Task definition** (`linux/X86_64`) sized for software H.264 encoding:
  8 vCPU / 16 GB is a reasonable default (16 vCPU / 32 GB for faster encodes),
  with ephemeral storage ≥ 50 GB. Its container name must match the dispatcher's
  `CONTAINER_NAME`.
- **CloudWatch log group** (e.g. `/ecs/video-packager`) wired via `awslogs`.

### IAM

- **Task execution role** — pulls the image and writes logs
  (`AmazonECSTaskExecutionRolePolicy`; plus `ssm:GetParameters` if the secret is
  injected from Parameter Store).
- **Task role** — what the worker may do to S3:
  `s3:GetObject` on `raw/*`, `s3:PutObject` on `hls/*` and `keys/*`, and
  `s3:DeleteObject` on `raw/*`.
- **Dispatcher Lambda role** — `ecs:RunTask` on the task-definition ARN and
  `iam:PassRole` for both the execution and task roles.

### Networking

The task needs outbound internet to reach S3 and the app. `dispatch.mjs` sets
`assignPublicIp: ENABLED`, so a **public subnet** (route table with an Internet
Gateway) works with **no NAT gateway** — a NAT bills ~$32/mo even idle and is
unnecessary here. Outbound 443 is the only requirement; the default security
group's allow-all egress suffices.

## Operations

- **Observability:** each run is one task; its ffmpeg output streams to the
  CloudWatch log group. A successful run logs `Packaged …` and the item flips to
  `ready` in the app.
- **Failures:** a failed task stops as FAILED/STOPPED with a non-zero exit; the
  task's **Logs** tab shows the cause. Common causes are a mismatched
  `VIDEO_INGEST_SECRET` or a subnet with no internet route.
- **Spot interruptions** are rare but possible mid-encode. The task simply fails
  and can be re-run by re-uploading or re-invoking; add a retry/DLQ later if it
  becomes a problem.

## Local testing

The container runs locally exactly as it does on Fargate — point it at a real
master in S3 with explicit credentials:

```bash
cd workers/video-packager
docker build --platform linux/amd64 -t video-packager .

docker run --rm \
  -e AWS_REGION=REGION \
  -e AWS_ACCESS_KEY_ID=... -e AWS_SECRET_ACCESS_KEY=... \
  -e APP_BASE_URL=http://host.docker.internal:3000 \
  -e VIDEO_INGEST_SECRET=... \
  -e BUCKET=BUCKET \
  -e RAW_KEY=raw/courses/1/items/42/abc/master.mp4 \
  video-packager
```

## Limitations / hardening notes

- Assumes the master has one audio stream (`a:0` is mapped into each rendition);
  detect audio-less inputs before mapping if that can occur.
- Upscales sources smaller than a rendition; drop renditions above the source
  height to avoid that.
- The AES key lives under the `keys/` prefix; moving it to SSM/Secrets Manager
  would add defense-in-depth.
