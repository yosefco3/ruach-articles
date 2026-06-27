import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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

/**
 * Recover the storage key (e.g. "attachments/abc123.jpg") from a value stored in the DB.
 * Accepts a bare key, a local "/uploads/<key>" URL (optionally with a host prefix), or an
 * R2 "<R2_PUBLIC_URL>/<key>" URL. Returns null for external / unrecognised URLs and for
 * anything containing ".." (path-traversal guard).
 */
export function keyFromUrl(urlOrKey: string): string | null {
  if (!urlOrKey) return null;
  const s = urlOrKey.trim();
  const clean = (key: string): string | null =>
    key && !key.includes("..") ? key.replace(/^\/+/, "") : null;

  // R2 public base (only meaningful when R2 is configured)
  if (isR2Configured() && env.R2_PUBLIC_URL) {
    const base = env.R2_PUBLIC_URL.replace(/\/+$/, "");
    if (s === base) return null;
    if (s.startsWith(base + "/")) return clean(s.slice(base.length + 1));
  }

  // Local "/uploads/<key>" — handles both "/uploads/..." and "https://host/uploads/..."
  const idx = s.indexOf("/uploads/");
  if (idx !== -1) return clean(s.slice(idx + "/uploads/".length));

  // Bare key (no scheme, no leading slash) — e.g. "attachments/abc.jpg"
  if (!s.includes("://") && !s.startsWith("/")) return clean(s);

  return null;
}

/**
 * Delete a previously-uploaded file, addressed by the public URL we stored (or its key).
 * Best-effort: returns true when a file was removed, false for missing / external / unsafe
 * inputs. Local deletes are confined to LOCAL_UPLOAD_DIR; R2 deletes use DeleteObjectCommand.
 */
export async function deleteObject(urlOrKey: string): Promise<boolean> {
  const key = keyFromUrl(urlOrKey);
  if (!key) return false;

  // ── Local fallback ──
  if (!isR2Configured()) {
    const dest = path.resolve(LOCAL_UPLOAD_DIR, key);
    const root = path.resolve(LOCAL_UPLOAD_DIR);
    // Confine deletes to the upload directory.
    if (dest !== root && !dest.startsWith(root + path.sep)) return false;
    if (!fs.existsSync(dest)) return false;
    fs.unlinkSync(dest);
    return true;
  }

  // ── R2 ──
  const client = createR2Client();
  await client.send(
    new DeleteObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }),
  );
  return true;
}
