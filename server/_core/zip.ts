/**
 * כותב ZIP מינימלי במצב store (ללא דחיסה) — zero-dep, ברוח המימושים העצמאיים
 * של הפרויקט. מספיק לחלוטין לאריזת webp/png שכבר דחוסים.
 * פורמט: local file headers + central directory + EOCD (APPNOTE 4.4.x).
 */

/** טבלת CRC32 סטנדרטית (IEEE 802.3), נבנית פעם אחת. */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  /** שם הקובץ בתוך הארכיון (UTF-8, '/' כמפריד). */
  name: string;
  data: Buffer;
}

const UTF8_FLAG = 0x0800; // general purpose bit 11 — שמות ב-UTF-8

/** בונה ZIP במצב store מרשימת קבצים. deterministic — בלי timestamps אמיתיים. */
export function buildStoreZip(entries: ZipEntry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const e of entries) {
    const name = Buffer.from(e.name, "utf-8");
    const crc = crc32(e.data);
    const size = e.data.length;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // local file header signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(UTF8_FLAG, 6); // flags
    local.writeUInt16LE(0, 8); // method 0 = store
    local.writeUInt16LE(0, 10); // mod time
    local.writeUInt16LE(0x21, 12); // mod date (1980-01-01)
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(size, 18); // compressed
    local.writeUInt32LE(size, 22); // uncompressed
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28); // extra len
    locals.push(local, name, e.data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // central directory signature
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(UTF8_FLAG, 8);
    central.writeUInt16LE(0, 10); // method
    central.writeUInt16LE(0, 12); // time
    central.writeUInt16LE(0x21, 14); // date
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(size, 20);
    central.writeUInt32LE(size, 24);
    central.writeUInt16LE(name.length, 28);
    // 30..37: extra/comment/disk/attrs = 0
    central.writeUInt32LE(offset, 42); // local header offset
    centrals.push(central, name);

    offset += 30 + name.length + size;
  }

  const centralStart = offset;
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // end of central directory signature
  eocd.writeUInt16LE(entries.length, 8); // entries on this disk
  eocd.writeUInt16LE(entries.length, 10); // total entries
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralStart, 16);

  return Buffer.concat([...locals, ...centrals, eocd]);
}
