import { execFileSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { createWriteStream, mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pipeline } from "node:stream/promises"
import { pathToFileURL } from "node:url"
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"

/**
 * Packaging worker for Rung-3 encrypted-HLS video (see
 * docs/video-drm-streaming.md in the app repo).
 *
 * Runs as a one-shot ECS/Fargate task (Fargate Spot), one task per uploaded
 * master. A tiny dispatcher Lambda (`dispatch.mjs`) is still triggered by S3
 * ObjectCreated on `raw/<assetKey>/master.<ext>` and calls RunTask with the
 * target passed as BUCKET + RAW_KEY container-override env vars. Fargate is used
 * instead of Lambda because masters can be up to ~4 GB / 30 min and exceed
 * Lambda's 15-min / ephemeral-disk ceilings.
 *
 * Does: download master → generate a 16-byte AES-128 key + IV → ffmpeg into an
 * encrypted HLS ladder (2160/1080/720/480 H.264, capped to the source height so
 * we never upscale) → upload `hls/<assetKey>/...` and the key to
 * `keys/<assetKey>.key` → POST the app's /api/video/ingest/complete.
 *
 * The key URI baked into each media playlist is the literal `key`, which the
 * app's serving route resolves to /api/video/[itemId]/key (enrollment-gated).
 * The key is NEVER uploaded under `hls/` and is never presigned.
 *
 * Env: AWS_REGION, APP_BASE_URL, VIDEO_INGEST_SECRET, BUCKET, RAW_KEY,
 *      FFMPEG_PATH (default "ffmpeg"), FFPROBE_PATH (default "ffprobe").
 * The Docker image sets FFMPEG_PATH/FFPROBE_PATH to the bundled static binaries.
 */

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg"
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe"
const s3 = new S3Client({ region: process.env.AWS_REGION })

// Full ladder, highest first. The actual ladder for a given master is capped to
// its native height by `ladderFor()` so a 1080p source never gets a fake 4K rung.
// 4K H.264 at ~16 Mbps is a sane VOD target; hls.js only climbs to it in Auto
// mode when the viewer's measured bandwidth sustains it.
const RENDITIONS = [
  { w: 3840, h: 2160, vb: "16000k", ab: "192k" },
  { w: 1920, h: 1080, vb: "5000k", ab: "128k" },
  { w: 1280, h: 720, vb: "2800k", ab: "128k" },
  { w: 854, h: 480, vb: "1400k", ab: "96k" },
]

// Keep only rungs at or below the source height (+ a little slack for sources
// that are a hair under a tier, e.g. 2156p). Never upscale. If the height can't
// be probed, fall back to the ≤1080p ladder so we don't manufacture a 4K rung.
function ladderFor(srcHeight) {
  if (!srcHeight) return RENDITIONS.filter((r) => r.h <= 1080)
  const kept = RENDITIONS.filter((r) => r.h <= srcHeight * 1.05)
  return kept.length ? kept : [RENDITIONS[RENDITIONS.length - 1]]
}

// Container entrypoint (ECS/Fargate). The dispatcher Lambda runs one task per
// uploaded master, passing the target as BUCKET + RAW_KEY container overrides.
// Package one object, then exit — non-zero on failure so the task is marked
// FAILED and surfaces in the console / CloudWatch instead of looking "done".
async function main() {
  const bucket = process.env.BUCKET
  const rawKey = process.env.RAW_KEY
  if (!bucket || !rawKey) {
    console.error("BUCKET and RAW_KEY env vars are required")
    process.exit(1)
  }
  await packageOne(bucket, rawKey)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
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
    await downloadToFile(bucket, rawKey, masterPath)
    execFileSync("mkdir", ["-p", hlsDir])

    // 16-byte key + IV. key_info: line1 = URI written into playlists, line2 =
    // local key file, line3 = IV hex.
    const key = randomBytes(16)
    const iv = randomBytes(16).toString("hex")
    writeFileSync(keyPath, key)
    writeFileSync(keyInfoPath, `key\n${keyPath}\n${iv}\n`)

    const renditions = ladderFor(probeHeight(masterPath))
    console.log(`Ladder: ${renditions.map((r) => `${r.h}p`).join(", ")}`)
    runFfmpeg(masterPath, hlsDir, keyInfoPath, renditions)

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

function runFfmpeg(input, hlsDir, keyInfoPath, renditions) {
  const splits = renditions.map((_, i) => `[v${i}]`).join("")
  // force_divisible_by=2 keeps both dims even — H.264 rejects odd sizes.
  const scales = renditions.map((r, i) => `[v${i}]scale=w=${r.w}:h=${r.h}:force_original_aspect_ratio=decrease:force_divisible_by=2[v${i}out]`).join(";")
  const filter = `[0:v]split=${renditions.length}${splits};${scales}`

  const args = ["-y", "-i", input, "-filter_complex", filter]
  renditions.forEach((_, i) => args.push("-map", `[v${i}out]`, "-map", "a:0"))
  args.push("-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac")
  renditions.forEach((r, i) => args.push(`-b:v:${i}`, r.vb, `-b:a:${i}`, r.ab))
  args.push(
    "-hls_time", "6",
    "-hls_playlist_type", "vod",
    "-hls_key_info_file", keyInfoPath,
    "-hls_segment_type", "mpegts",
    "-hls_flags", "independent_segments",
    "-hls_segment_filename", join(hlsDir, "stream_%v_%03d.ts"),
    "-master_pl_name", "master.m3u8",
    "-var_stream_map", renditions.map((_, i) => `v:${i},a:${i}`).join(" "),
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

// Native height of the first video stream, used to cap the ladder. Returns
// undefined on any probe hiccup so `ladderFor()` can fall back safely.
function probeHeight(input) {
  try {
    const out = execFileSync(FFPROBE, [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=height", "-of", "default=nw=1:nk=1", input,
    ]).toString().trim()
    return parseInt(out, 10) || undefined
  } catch {
    return undefined
  }
}

function contentType(file) {
  if (file.endsWith(".m3u8")) return "application/vnd.apple.mpegurl"
  if (file.endsWith(".ts")) return "video/mp2t"
  return "application/octet-stream"
}

// Stream the master straight to disk — a ~4 GB master must never be buffered in
// memory (that OOMs the task). SDK v3's Body is a Node Readable in this runtime.
async function downloadToFile(bucket, key, destPath) {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  await pipeline(res.Body, createWriteStream(destPath))
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
