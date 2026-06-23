import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
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
