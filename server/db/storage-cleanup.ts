import { deleteObject } from "../storage";

/**
 * Best-effort file deletion for the DB layer. A storage failure (missing file, R2
 * hiccup, bad URL) must never break the surrounding DB delete or surface to the user —
 * so we swallow and log. Returns true only when a file was actually removed.
 */
export async function safeDeleteObject(urlOrKey: string | null | undefined): Promise<boolean> {
  if (!urlOrKey) return false;
  try {
    return await deleteObject(urlOrKey);
  } catch (error) {
    console.warn(`[storage-cleanup] failed to delete file for "${urlOrKey}":`, error);
    return false;
  }
}
