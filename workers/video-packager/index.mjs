import { execFileSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"

/**
 * Packaging worker for Rung-3 encrypted-HLS video (see
 * docs/video-drm-streaming.md in the app repo).
 *
 * Trigger: S3 ObjectCreated on `raw/<assetKey>/master.<ext>`.
 * Does: download master → generate a 16-byte AES-128 key + IV → ffmpeg into an
 * encrypted HLS ladder (1080/720/480 H.264) → upload `hls/<assetKey>/...` and
 * the key to `keys/<assetKey>.key` → POST the app's /api/video/ingest/complete.
 *
 * The key URI baked into each media playlist is the literal `key`, which the
 * app's serving route resolves to /api/video/[itemId]/key (enrollment-gated).
 * The key is NEVER uploaded under `hls/` and is never presigned.
 *
 * Env: AWS_REGION, APP_BASE_URL, VIDEO_INGEST_SECRET,
 *      FFMPEG_PATH (default "ffmpeg"), FFPROBE_PATH (default "ffprobe").
 * ffmpeg/ffprobe come from a Lambda layer (or the PATH when run locally).
 */

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg"
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe"
const s3 = new S3Client({ region: process.env.AWS_REGION })

const RENDITIONS = [
  { w: 1920, h: 1080, vb: "5000k", ab: "128k" },
  { w: 1280, h: 720, vb: "2800k", ab: "128k" },
  { w: 854, h: 480, vb: "1400k", ab: "96k" },
]

export async function handler(event) {
  for (const record of event.Records ?? []) {
    const bucket = record.s3.bucket.name
    const rawKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "))
    await packageOne(bucket, rawKey)
  }
  return { ok: true }
}

async function packageOne(bucket, rawKey) {
  // rawKey = raw/<assetKey>/master.<ext>  →  assetKey = <assetKey>
  const m = rawKey.match(/^raw\/(.+)\/master\.[^.]+$/)
  if (!m) {
    console.warn(`Skipping unexpected key: ${rawKey}`)
    return
  }
  const assetKey = m[1]
  const dir = mkdtempSync(join(tmpdir(), "pkg-"))
  const hlsDir = join(dir, "hls")
  const masterPath = join(dir, "master.src")
  const keyPath = join(dir, "enc.key")
  const keyInfoPath = join(dir, "key_info")

  try {
    writeFileSync(masterPath, await getObject(bucket, rawKey))
    execFileSync("mkdir", ["-p", hlsDir])

    // 16-byte key + IV. key_info: line1 = URI written into playlists, line2 =
    // local key file, line3 = IV hex.
    const key = randomBytes(16)
    const iv = randomBytes(16).toString("hex")
    writeFileSync(keyPath, key)
    writeFileSync(keyInfoPath, `key\n${keyPath}\n${iv}\n`)

    runFfmpeg(masterPath, hlsDir, keyInfoPath)

    // Upload every HLS artifact (playlists + .ts); the key goes elsewhere.
    for (const file of readdirSync(hlsDir)) {
      await putObject(bucket, `hls/${assetKey}/${file}`, readFileSync(join(hlsDir, file)), contentType(file))
    }
    await putObject(bucket, `keys/${assetKey}.key`, key, "application/octet-stream")

    const durationSec = probeDuration(masterPath)
    await notifyComplete(assetKey, durationSec, rawKey)
    console.log(`Packaged ${assetKey} (${durationSec}s)`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function runFfmpeg(input, hlsDir, keyInfoPath) {
  const splits = RENDITIONS.map((_, i) => `[v${i}]`).join("")
  // force_divisible_by=2 keeps both dims even — H.264 rejects odd sizes.
  const scales = RENDITIONS.map((r, i) => `[v${i}]scale=w=${r.w}:h=${r.h}:force_original_aspect_ratio=decrease:force_divisible_by=2[v${i}out]`).join(";")
  const filter = `[0:v]split=${RENDITIONS.length}${splits};${scales}`

  const args = ["-y", "-i", input, "-filter_complex", filter]
  RENDITIONS.forEach((_, i) => args.push("-map", `[v${i}out]`, "-map", "a:0"))
  args.push("-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac")
  RENDITIONS.forEach((r, i) => args.push(`-b:v:${i}`, r.vb, `-b:a:${i}`, r.ab))
  args.push(
    "-hls_time", "6",
    "-hls_playlist_type", "vod",
    "-hls_key_info_file", keyInfoPath,
    "-hls_segment_type", "mpegts",
    "-hls_flags", "independent_segments",
    "-hls_segment_filename", join(hlsDir, "stream_%v_%03d.ts"),
    "-master_pl_name", "master.m3u8",
    "-var_stream_map", RENDITIONS.map((_, i) => `v:${i},a:${i}`).join(" "),
    join(hlsDir, "stream_%v.m3u8")
  )
  execFileSync(FFMPEG, args, { stdio: "inherit" })
}

function probeDuration(input) {
  const out = execFileSync(FFPROBE, [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", input,
  ]).toString().trim()
  return Math.round(parseFloat(out)) || undefined
}

function contentType(file) {
  if (file.endsWith(".m3u8")) return "application/vnd.apple.mpegurl"
  if (file.endsWith(".ts")) return "video/mp2t"
  return "application/octet-stream"
}

async function getObject(bucket, key) {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  return Buffer.from(await res.Body.transformToByteArray())
}

async function putObject(bucket, key, body, ct) {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: ct }))
}

async function notifyComplete(assetKey, durationSec, rawKey) {
  const res = await fetch(`${process.env.APP_BASE_URL}/api/video/ingest/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VIDEO_INGEST_SECRET}`,
    },
    body: JSON.stringify({ assetKey, durationSec, rawKey }),
  })
  if (!res.ok) throw new Error(`complete callback failed: ${res.status} ${await res.text()}`)
}
