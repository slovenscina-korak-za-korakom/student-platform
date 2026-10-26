import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/**
 * S3 access for the Rung-3 encrypted-HLS video pipeline
 * The bucket has Block Public Access ON: nothing
 * is ever public. Content segments reach the browser only via short-lived
 * presigned GET URLs; playlists and the AES key are read server-side here and
 * relayed through authed routes. The `keys/` prefix is NEVER presigned.
 *
 * Object layout under the bucket:
 *   raw/<assetKey>/master.<ext>   uploaded master (deleted after packaging)
 *   hls/<assetKey>/...            encrypted playlists + .ts segments
 *   keys/<assetKey>.key           16-byte AES-128 key (server-only)
 */

const region = process.env.AWS_REGION
const bucket = process.env.S3_VIDEO_BUCKET

let _client: S3Client | null = null
function client(): S3Client {
  if (!region) throw new Error("AWS_REGION is not set")
  if (!_client) _client = new S3Client({ region })
  return _client
}

/** The configured video bucket, or throw if misconfigured. */
export function videoBucket(): string {
  if (!bucket) throw new Error("S3_VIDEO_BUCKET is not set")
  return bucket
}

/** Presigned PUT URL for a direct browser/server upload of the raw master. */
export async function presignPut(
  key: string,
  contentType: string,
  ttlSeconds = 3600
): Promise<string> {
  const cmd = new PutObjectCommand({ Bucket: videoBucket(), Key: key, ContentType: contentType })
  return getSignedUrl(client(), cmd, { expiresIn: ttlSeconds })
}

/** Presigned GET URL for a single encrypted segment (handed to the player). */
export async function presignGet(key: string, ttlSeconds = 6 * 3600): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: videoBucket(), Key: key })
  return getSignedUrl(client(), cmd, { expiresIn: ttlSeconds })
}

/** Read an object fully into a Buffer (playlists are tiny; the key is 16 bytes). */
export async function getObject(key: string): Promise<Buffer> {
  const res = await client().send(new GetObjectCommand({ Bucket: videoBucket(), Key: key }))
  const bytes = await res.Body!.transformToByteArray()
  return Buffer.from(bytes)
}

/** Read an object as UTF-8 text (for .m3u8 playlists). */
export async function getText(key: string): Promise<string> {
  return (await getObject(key)).toString("utf8")
}

/** Best-effort delete (used to drop the raw master after packaging). */
export async function deleteObject(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: videoBucket(), Key: key }))
}
