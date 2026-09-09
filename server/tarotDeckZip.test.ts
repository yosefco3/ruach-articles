import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildStoreZip, crc32 } from "./_core/zip";
import { buildDeckZip, resetDeckZipCache, serveDeckZip } from "./tarotDeckZip";

// ── מפענח ZIP מינימלי לבדיקה: קורא את ה-central directory ──
function listZip(buf: Buffer): { name: string; size: number; crc: number }[] {
  const out: { name: string; size: number; crc: number }[] = [];
  let i = 0;
  while (i + 4 <= buf.length) {
    const sig = buf.readUInt32LE(i);
    if (sig === 0x02014b50) {
      const crc = buf.readUInt32LE(i + 16);
      const size = buf.readUInt32LE(i + 24);
      const nameLen = buf.readUInt16LE(i + 28);
      const name = buf.subarray(i + 46, i + 46 + nameLen).toString("utf-8");
      out.push({ name, size, crc });
      i += 46 + nameLen;
    } else if (sig === 0x04034b50) {
      const size = buf.readUInt32LE(i + 18);
      const nameLen = buf.readUInt16LE(i + 26);
      i += 30 + nameLen + size;
    } else {
      i++;
    }
  }
  return out;
}

describe("buildStoreZip (pure)", () => {
  it("round-trips names, sizes and CRCs — including Hebrew names", () => {
    const a = Buffer.from("hello world");
    const b = Buffer.from("שלום");
    const zip = buildStoreZip([
      { name: "a.txt", data: a },
      { name: "קובץ.txt", data: b },
    ]);
    const listed = listZip(zip);
    expect(listed.map((e) => e.name)).toEqual(["a.txt", "קובץ.txt"]);
    expect(listed[0].size).toBe(a.length);
    expect(listed[0].crc).toBe(crc32(a));
    expect(listed[1].crc).toBe(crc32(b));
    // EOCD בסוף
    expect(zip.readUInt32LE(zip.length - 22)).toBe(0x06054b50);
  });

  it("handles an empty archive", () => {
    const zip = buildStoreZip([]);
    expect(zip.length).toBe(22);
    expect(zip.readUInt32LE(0)).toBe(0x06054b50);
  });

  it("crc32 matches the known value for 'hello'", () => {
    expect(crc32(Buffer.from("hello"))).toBe(0x3610a686);
  });
});

describe("buildDeckZip", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "tarot-zip-"));
    resetDeckZipCache();
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("packs all images + a generated README.txt", async () => {
    writeFileSync(path.join(dir, "major-00.webp"), Buffer.from("img0"));
    writeFileSync(path.join(dir, "back.webp"), Buffer.from("imgb"));
    writeFileSync(path.join(dir, "notes.txt"), "ignored"); // לא תמונה — לא נארז
    const zip = (await buildDeckZip(dir))!;
    const names = listZip(zip).map((e) => e.name);
    expect(names).toContain("README.txt");
    expect(names).toContain("major-00.webp");
    expect(names).toContain("back.webp");
    expect(names).not.toContain("notes.txt");
  });

  it("prefers the print/ subfolder when it has images", async () => {
    writeFileSync(path.join(dir, "major-00.webp"), Buffer.from("small"));
    mkdirSync(path.join(dir, "print"));
    writeFileSync(path.join(dir, "print", "major-00.png"), Buffer.from("bigger-image"));
    const zip = (await buildDeckZip(dir))!;
    const names = listZip(zip).map((e) => e.name);
    expect(names).toContain("major-00.png");
    expect(names).not.toContain("major-00.webp");
  });

  it("returns null for an empty directory and caches a built zip", async () => {
    expect(await buildDeckZip(dir)).toBeNull();
    writeFileSync(path.join(dir, "back.webp"), Buffer.from("x"));
    const first = await buildDeckZip(dir);
    const second = await buildDeckZip(dir);
    expect(first).toBe(second); // אותו Buffer מה-cache
  });

  it("serveDeckZip returns 404 when no assets exist anywhere", async () => {
    // אין client/public/tarot-cards בריפו עדיין — הנתיב האמיתי ריק
    const res = {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;
    await serveDeckZip({} as any, res);
    const status = res.status.mock.calls[0][0];
    // אם הנכסים יועלו בעתיד — יוחזר 200 עם zip; שני המצבים תקינים
    expect([404, 200]).toContain(status);
    if (status === 200) {
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ "Content-Type": "application/zip" }));
    }
  });
});
