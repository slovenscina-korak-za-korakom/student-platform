import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
  ListMultipartUploadsCommand,
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
  if (!_client) {
    _client = new S3Client({
      region,
      // AWS SDK v3 (≥ ~3.729) defaults to adding a CRC32 checksum to requests.
      // For a *presigned* PUT that bakes an empty-payload checksum
      // (x-amz-checksum-crc32=AAAAAA==) into the URL, so a direct browser upload
      // of the real file fails the integrity check. WHEN_REQUIRED keeps the
      // checksum off PutObject presigns, restoring plain browser PUTs.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    })
  }
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

/** Every object key under a prefix (paginated). */
export async function listKeys(prefix: string): Promise<string[]> {
  const keys: string[] = []
  let token: string | undefined
  do {
    const listed = await client().send(
      new ListObjectsV2Command({
        Bucket: videoBucket(),
        Prefix: prefix,
        ContinuationToken: token,
        MaxKeys: 1000,
      })
    )
    for (const o of listed.Contents ?? []) if (o.Key) keys.push(o.Key)
    token = listed.IsTruncated ? listed.NextContinuationToken : undefined
  } while (token)
  return keys
}

/** Batch-delete explicit object keys (chunks of 1000). Returns count deleted. */
export async function deleteObjects(keys: string[]): Promise<number> {
  let deleted = 0
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000).map((Key) => ({ Key }))
    if (chunk.length === 0) continue
    await client().send(
      new DeleteObjectsCommand({ Bucket: videoBucket(), Delete: { Objects: chunk, Quiet: true } })
    )
    deleted += chunk.length
  }
  return deleted
}

/**
 * Delete every object under a prefix (paginated list + batched delete). Used to
 * reap an asset's objects when its module item is deleted — e.g. the whole
 * `hls/<assetKey>/` ladder. Returns the number of objects deleted.
 */
export async function deletePrefix(prefix: string): Promise<number> {
  return deleteObjects(await listKeys(prefix))
}

// ── Multipart upload ─────────────────────────────────────────────────────────
// Large raw masters (> ~100 MB) are uploaded from the admin browser in parts so
// the UI can pause/resume/cancel and survive flaky networks. The browser has no
// AWS creds, so each part is a *presigned* UploadPart PUT — same pattern as the
// single-PUT path. CompleteMultipartUpload assembles the parts into one object,
// which fires the same `s3:ObjectCreated:*` event that triggers packaging, so
// everything downstream of `raw/<assetKey>/master.<ext>` is unchanged.

/** One finished part, as S3 needs it to assemble the object. */
export type CompletedPart = { PartNumber: number; ETag: string }

/** Open a multipart upload for `key`; returns the S3 UploadId. */
export async function createMultipartUpload(
  key: string,
  contentType: string
): Promise<string> {
  const res = await client().send(
    new CreateMultipartUploadCommand({ Bucket: videoBucket(), Key: key, ContentType: contentType })
  )
  if (!res.UploadId) throw new Error("S3 did not return an UploadId")
  return res.UploadId
}

/**
 * Presigned PUT URL for a single part. The checksum-off client() (see above)
 * matters here too: a baked-in part checksum would break the plain browser PUT,
 * exactly like it did for PutObject.
 */
export async function presignUploadPart(
  key: string,
  uploadId: string,
  partNumber: number,
  ttlSeconds = 3600
): Promise<string> {
  const cmd = new UploadPartCommand({
    Bucket: videoBucket(),
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  })
  return getSignedUrl(client(), cmd, { expiresIn: ttlSeconds })
}

/** Assemble the uploaded parts into the final object (order-independent input). */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: CompletedPart[]
): Promise<void> {
  const Parts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber)
  await client().send(
    new CompleteMultipartUploadCommand({
      Bucket: videoBucket(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts },
    })
  )
}

/** Cancel a multipart upload; S3 discards any parts already uploaded. */
export async function abortMultipartUpload(key: string, uploadId: string): Promise<void> {
  await client().send(
    new AbortMultipartUploadCommand({ Bucket: videoBucket(), Key: key, UploadId: uploadId })
  )
}

/**
 * Abort every in-progress multipart upload whose key starts with `prefix`.
 * Used when a new upload *replaces* an in-flight one for the same item, so the
 * superseded upload can never complete, get packaged, and fire a callback for
 * an assetKey the DB no longer holds. Returns the number aborted.
 * Needs s3:ListBucketMultipartUploads on the bucket.
 */
export async function abortMultipartUploadsUnder(prefix: string): Promise<number> {
  let aborted = 0
  let keyMarker: string | undefined
  let uploadIdMarker: string | undefined
  do {
    const res = await client().send(
      new ListMultipartUploadsCommand({
        Bucket: videoBucket(),
        Prefix: prefix,
        KeyMarker: keyMarker,
        UploadIdMarker: uploadIdMarker,
      })
    )
    for (const u of res.Uploads ?? []) {
      if (!u.Key || !u.UploadId) continue
      await abortMultipartUpload(u.Key, u.UploadId).catch(() => {})
      aborted++
    }
    keyMarker = res.IsTruncated ? res.NextKeyMarker : undefined
    uploadIdMarker = res.IsTruncated ? res.NextUploadIdMarker : undefined
  } while (keyMarker)
  return aborted
}

/**
 * The parts S3 has already stored for an in-progress upload. Used to reconcile
 * after a page reload: the browser re-selects the file but asks S3 which parts
 * are already done so it only re-uploads the rest.
 */
export async function listParts(key: string, uploadId: string): Promise<CompletedPart[]> {
  const out: CompletedPart[] = []
  let marker: string | undefined
  do {
    const res = await client().send(
      new ListPartsCommand({
        Bucket: videoBucket(),
        Key: key,
        UploadId: uploadId,
        PartNumberMarker: marker,
      })
    )
    for (const p of res.Parts ?? []) {
      if (p.PartNumber != null && p.ETag) out.push({ PartNumber: p.PartNumber, ETag: p.ETag })
    }
    marker = res.IsTruncated ? res.NextPartNumberMarker : undefined
  } while (marker)
  return out
}
