import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { createReadStream, createWriteStream } from "fs";
import { env, isR2Configured } from "./_core/env";

// Re-export for backward compatibility
export { isR2Configured };

// ────────────────────────────────────────
// Local storage constants
// ────────────────────────────────────────

const LOCAL_UPLOAD_DIR =
  process.env.LOCAL_UPLOAD_DIR || path.resolve(process.cwd(), "uploads");

function ensureUploadDir(): void {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
}

function localPublicUrl(key: string): string {
  return `/uploads/${key}`;
}

// ────────────────────────────────────────
// Cloudflare R2 client (used when isR2Configured())
// ────────────────────────────────────────

function createR2Client(): S3Client {
  if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 is not configured. Call isR2Configured() first.");
  }
  return new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
    // Cloudflare R2 uses path-style addressing
    forcePathStyle: true,
  });
}

// ────────────────────────────────────────
// Public API — works with both R2 and local
// ────────────────────────────────────────

/**
 * Get the public URL for a stored file.
 */
export function getPublicUrl(key: string): string {
  if (isR2Configured()) {
    const base = env.R2_PUBLIC_URL!.replace(/\/+$/, "");
    return `${base}/${key}`;
  }
  return localPublicUrl(key);
}

/**
 * Upload a file from a local path.
 * Uses R2 when configured, otherwise saves to the local uploads directory.
 */
export async function uploadFile(
  localFilePath: string,
  remoteKey: string,
  contentType?: string,
): Promise<string> {
  // ── Local fallback ──
  if (!isR2Configured()) {
    ensureUploadDir();
    const dest = path.join(LOCAL_UPLOAD_DIR, remoteKey);
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(localFilePath, dest);
    return localPublicUrl(remoteKey);
  }

  // ── R2 upload ──
  const client = createR2Client();
  const bucket = env.R2_BUCKET!;

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
 * Upload a Buffer directly.
 * Uses R2 when configured, otherwise saves to the local uploads directory.
 */
export async function uploadBuffer(
  buffer: Buffer,
  remoteKey: string,
  contentType?: string,
): Promise<string> {
  // ── Local fallback ──
  if (!isR2Configured()) {
    ensureUploadDir();
    const dest = path.join(LOCAL_UPLOAD_DIR, remoteKey);
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.writeFileSync(dest, buffer);
    return localPublicUrl(remoteKey);
  }

  // ── R2 upload ──
  const client = createR2Client();
  const bucket = env.R2_BUCKET!;

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
 * Get a pre-signed URL for temporary read access.
 * Falls back to a direct local URL when R2 is not configured.
 */
export async function getPresignedUrl(
  remoteKey: string,
  expiresInSeconds = 3600,
): Promise<string> {
  if (!isR2Configured()) {
    return localPublicUrl(remoteKey);
  }

  const client = createR2Client();
  const bucket = env.R2_BUCKET!;

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: remoteKey,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Download a file to a local path.
 * Uses R2 when configured, otherwise copies from the local uploads directory.
 */
export async function downloadFile(
  remoteKey: string,
  localFilePath: string,
): Promise<void> {
  // ── Local fallback ──
  if (!isR2Configured()) {
    const src = path.join(LOCAL_UPLOAD_DIR, remoteKey);
    const dir = path.dirname(localFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(src, localFilePath);
    return;
  }

  // ── R2 download ──
  const client = createR2Client();
  const bucket = env.R2_BUCKET!;

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

  await pipeline(response.Body as NodeJS.ReadableStream, createWriteStream(localFilePath));
}

/**
 * Returns the active storage backend: `"r2"` or `"local"`.
 * Useful for diagnostics and admin endpoints.
 */
export function getStorageMode(): "r2" | "local" {
  return isR2Configured() ? "r2" : "local";
}
