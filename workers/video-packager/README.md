# video-packager (AWS Lambda)

S3-triggered worker that turns an uploaded master into a **Rung-3 AES-128
encrypted HLS** ladder. This is the only piece of the video pipeline that lives
in AWS rather than the Next.js app. See `docs/video-drm-streaming.md` for the
full design.

## Flow

```
S3 raw/<assetKey>/master.<ext>  (ObjectCreated)
   └► this Lambda:
        download master → gen 16-byte AES key + IV
        ffmpeg → hls/<assetKey>/master.m3u8 + stream_N.m3u8 + *.ts  (encrypted)
        put key → keys/<assetKey>.key   (private; never presigned)
        ffprobe duration
        POST {APP_BASE_URL}/api/video/ingest/complete  (Bearer VIDEO_INGEST_SECRET)
```

The key URI written into every media playlist is the literal `key` — the app's
`/api/video/[itemId]/[...path]` route rewrites nothing on that line, so it
resolves to `/api/video/[itemId]/key`, which is enrollment-gated.

## Deploy (one-time, by the maintainer)

1. **S3 bucket** (`S3_VIDEO_BUCKET`): Block Public Access ON. Add a CORS rule
   allowing `GET, HEAD` + the `Range` header from the app origin (so the browser
   can fetch presigned `.ts` segments). Add a lifecycle rule expiring `raw/`
   after ~1 day.
2. **ffmpeg**: attach an ffmpeg/ffprobe Lambda **layer** (several public ones
   exist) or bundle static binaries and set `FFMPEG_PATH` / `FFPROBE_PATH`.
3. **Function**: Node 20 runtime, handler `index.handler`. `cd workers/video-packager
   && npm install` then zip the folder (incl. `node_modules`) and upload.
   Recommended: **memory 3008 MB+** (more memory = more vCPU = faster encode),
   **timeout 900 s** (the 15-min max).
4. **IAM role**: `s3:GetObject` on `raw/*`, `s3:PutObject` on `hls/*` + `keys/*`,
   `s3:DeleteObject` on `raw/*`.
5. **Env**: `AWS_REGION`, `APP_BASE_URL` (e.g. `https://slovenscinakzk.com`),
   `VIDEO_INGEST_SECRET` (same value as the app), optional `FFMPEG_PATH`/`FFPROBE_PATH`.
6. **Trigger**: S3 → this Lambda on `ObjectCreated`, prefix `raw/`.

> **If encodes exceed 15 min** (long masters / heavy settings), move this same
> code to a **Fargate task** (RunTask dispatched by a tiny S3→EventBridge rule).
> The download → ffmpeg → upload → callback contract is identical.

## Assumptions / TODO when hardening

- Assumes the master has one audio stream (`a:0` is mapped into each rendition).
  Detect audio-less inputs before mapping if that can happen.
- Upscales sources smaller than a rendition; drop renditions above the source
  height if you want to avoid that.
- Consider moving the key to SSM/Secrets Manager instead of the `keys/` prefix
  for defense-in-depth.

## Local test

```bash
cd workers/video-packager && npm install
FFMPEG_PATH=ffmpeg FFPROBE_PATH=ffprobe \
AWS_REGION=… APP_BASE_URL=http://localhost:3000 VIDEO_INGEST_SECRET=… \
node -e "import('./index.mjs').then(m=>m.handler({Records:[{s3:{bucket:{name:'BUCKET'},object:{key:'raw/courses/1/items/42/abc/master.mp4'}}}]}))"
```
