import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { createReadStream } from "fs";
import { getEnv } from "./_core/env";

/**
 * Cloudflare R2 S3-compatible client
 *
 * Replaces the previous Manus S3 Proxy with a direct R2 connection.
 * Environment variables used:
 *   R2_ACCESS_KEY_ID     – Cloudflare R2 API token Access Key ID
 *   R2_SECRET_ACCESS_KEY – Cloudflare R2 API token Secret Access Key
 *   R2_ENDPOINT          – e.g. https://<ACCOUNT_ID>.r2.cloudflarestorage.com
 *   R2_BUCKET            – bucket name (e.g. "ruach-files")
 *   R2_PUBLIC_URL        – public URL for reading files (e.g. https://pub-XXXX.r2.dev)
 */

function createR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: getEnv().R2_ENDPOINT,
    credentials: {
      accessKeyId: getEnv().R2_ACCESS_KEY_ID,
      secretAccessKey: getEnv().R2_SECRET_ACCESS_KEY,
    },
    // Cloudflare R2 uses path-style addressing
    forcePathStyle: true,
  });
}

// ────────────────────────────────────────
// Helpers
// ────────────────────────────────────────

export function getPublicUrl(key: string): string {
  const base = getEnv().R2_PUBLIC_URL.replace(/\/+$/, "");
  return `${base}/${key}`;
}

// ────────────────────────────────────────
// Public API
// ────────────────────────────────────────

/**
 * Upload a file from a local path to R2.
 */
export async function uploadFile(
  localFilePath: string,
  remoteKey: string,
  contentType?: string,
): Promise<string> {
  const client = createR2Client();
  const bucket = getEnv().R2_BUCKET;

  const fileStream = createReadStream(localFilePath);
  const stats = fs.statSync(localFilePath);

  const upload = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: remoteKey,
      Body: fileStream,
      ContentType: contentType || "application/octet-stream",
      ContentLength: stats.size,
    },
  });

  await upload.done();

  return getPublicUrl(remoteKey);
}

/**
 * Upload a Buffer directly to R2.
 */
export async function uploadBuffer(
  buffer: Buffer,
  remoteKey: string,
  contentType?: string,
): Promise<string> {
  const client = createR2Client();
  const bucket = getEnv().R2_BUCKET;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: remoteKey,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
    }),
  );

  return getPublicUrl(remoteKey);
}

/**
 * Get a pre-signed URL for temporary read access (useful for private files).
 */
export async function getPresignedUrl(
  remoteKey: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const client = createR2Client();
  const bucket = getEnv().R2_BUCKET;

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: remoteKey,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Download a file from R2 to a local path.
 */
export async function downloadFile(
  remoteKey: string,
  localFilePath: string,
): Promise<void> {
  const client = createR2Client();
  const bucket = getEnv().R2_BUCKET;

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: remoteKey,
    }),
  );

  if (!response.Body) {
    throw new Error(`Empty response body for key: ${remoteKey}`);
  }

  // Ensure directory exists
  const dir = path.dirname(localFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // @ts-expect-error – Body is a ReadableStream in Node
  await pipeline(response.Body as NodeJS.ReadableStream, fs.createWriteStream(localFilePath));
}

// ────────────────────────────────────────
// Legacy compatibility — re-export a simple client getter
// for use in upload middleware that expects an S3-like interface.
// ────────────────────────────────────────

export { createR2Client as createS3Client };

/**
 * Get the configured bucket name.
 */
export function getBucket(): string {
  return getEnv().R2_BUCKET;
}