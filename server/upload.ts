import { Router, Request, Response } from "express";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { sdk } from "./_core/sdk";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_PREFIXES = [
  "image/",
  "application/pdf",
  "text/",
  "audio/",
  "video/",
  "application/msword",
  "application/vnd.openxmlformats",
  "application/vnd.ms-",
];

function isMimeAllowed(mime: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
}

const uploadRouter = Router();

uploadRouter.post("/api/upload", async (req: Request, res: Response) => {
  try {
    // Auth check: only logged-in users can upload
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      res.status(400).json({ error: "Expected multipart/form-data" });
      return;
    }

    // Collect raw body
    const chunks: Buffer[] = [];
    let totalSize = 0;
    for await (const chunk of req as any) {
      totalSize += chunk.length;
      if (totalSize > MAX_FILE_SIZE) {
        res.status(413).json({ error: "File too large (max 10MB)" });
        return;
      }
      chunks.push(Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);

    // Extract boundary
    const boundaryMatch = contentType.match(/boundary=(.+?)(?:;|$)/);
    if (!boundaryMatch) {
      res.status(400).json({ error: "No boundary found" });
      return;
    }
    const boundary = boundaryMatch[1];

    // Parse multipart
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const parts = splitBuffer(body, boundaryBuffer);

    for (const part of parts) {
      const headerEnd = part.indexOf("\r\n\r\n");
      if (headerEnd === -1) continue;

      const headerStr = part.subarray(0, headerEnd).toString("utf-8");
      const fileData = part.subarray(headerEnd + 4);

      // Remove trailing \r\n
      const cleanData = fileData.subarray(
        0,
        fileData.length >= 2 && fileData[fileData.length - 2] === 0x0d && fileData[fileData.length - 1] === 0x0a
          ? fileData.length - 2
          : fileData.length
      );

      const filenameMatch = headerStr.match(/filename="(.+?)"/);
      if (!filenameMatch || cleanData.length === 0) continue;

      const originalName = filenameMatch[1];
      const ext = originalName.includes(".") ? originalName.substring(originalName.lastIndexOf(".")) : "";
      const safeKey = `attachments/${nanoid(12)}${ext}`;

      // Detect and validate content type
      const ctMatch = headerStr.match(/Content-Type:\s*(.+?)(?:\r\n|$)/i);
      const fileMime = ctMatch ? ctMatch[1].trim() : "application/octet-stream";

      if (!isMimeAllowed(fileMime)) {
        res.status(400).json({ error: "File type not allowed" });
        return;
      }

      const { url } = await storagePut(safeKey, cleanData, fileMime);

      res.json({
        url,
        fileName: originalName,
        fileSize: cleanData.length,
        mimeType: fileMime,
      });
      return;
    }

    res.status(400).json({ error: "No file found in request" });
  } catch (error) {
    console.error("[Upload] Error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

function splitBuffer(buf: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  while (start < buf.length) {
    const idx = buf.indexOf(delimiter, start);
    if (idx === -1) {
      parts.push(buf.subarray(start));
      break;
    }
    if (idx > start) {
      parts.push(buf.subarray(start, idx));
    }
    start = idx + delimiter.length;
  }
  return parts;
}

export { uploadRouter };
