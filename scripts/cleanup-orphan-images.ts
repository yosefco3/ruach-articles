/**
 * cleanup-orphan-images — find (and optionally delete) files in storage that nothing in
 * the database references.
 *
 *   pnpm cleanup:orphan-images            # dry-run: report only (default, safe)
 *   pnpm cleanup:orphan-images --delete   # actually delete (asks for confirmation)
 *   pnpm cleanup:orphan-images --delete --yes   # delete without the prompt
 *
 * Referenced keys are collected from EVERY text/varchar column of EVERY table (we
 * stringify each row and regex out `attachments/<key>` occurrences), so cover images,
 * inline <img> in article bodies, avatars and logos all count — an in-use file can never
 * be classified as an orphan.
 */
import "dotenv/config";
import readline from "readline";
import mysql from "mysql2/promise";
import { listKeys, deleteObject } from "../server/storage";

// Storage keys look like "attachments/<nanoid>.<ext>". Match that substring wherever it
// appears (bare key, "/uploads/..." URL, R2 URL, or inside an HTML body).
const KEY_RE = /attachments\/[A-Za-z0-9_-]+\.[A-Za-z0-9]+/g;

/** Pull every storage key referenced inside an arbitrary chunk of text. */
export function extractReferencedKeys(text: string): string[] {
  if (!text) return [];
  return text.match(KEY_RE) ?? [];
}

/** Scan every row of every table for referenced storage keys. */
async function collectReferencedKeys(): Promise<Set<string>> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const conn = await mysql.createConnection(url);
  const refs = new Set<string>();
  try {
    const [tables] = await conn.query("SHOW TABLES");
    const names = (tables as Record<string, string>[]).map((r) => Object.values(r)[0]);
    for (const table of names) {
      const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
      for (const row of rows as unknown[]) {
        for (const key of extractReferencedKeys(JSON.stringify(row))) refs.add(key);
      }
    }
  } finally {
    await conn.end();
  }
  return refs;
}

function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    }),
  );
}

async function main() {
  const args = process.argv.slice(2);
  const doDelete = args.includes("--delete");
  const skipConfirm = args.includes("--yes");

  console.log("Scanning storage and database…");
  const [stored, referenced] = await Promise.all([
    listKeys("attachments/"),
    collectReferencedKeys(),
  ]);
  const orphans = stored.filter((key) => !referenced.has(key));

  console.log(`\n  Stored files:    ${stored.length}`);
  console.log(`  Referenced keys: ${referenced.size}`);
  console.log(`  Orphaned files:  ${orphans.length}`);

  if (orphans.length === 0) {
    console.log("\nNothing to clean up. 🎉");
    return;
  }

  console.log("\nOrphans" + (orphans.length > 20 ? " (first 20)" : "") + ":");
  for (const key of orphans.slice(0, 20)) console.log("  " + key);

  if (!doDelete) {
    console.log("\nDry-run — no files were deleted. Re-run with --delete to remove them.");
    return;
  }

  if (!skipConfirm) {
    const ok = await confirm(`\nDelete these ${orphans.length} file(s)? [y/N] `);
    if (!ok) {
      console.log("Aborted — nothing deleted.");
      return;
    }
  }

  let removed = 0;
  for (const key of orphans) {
    if (await deleteObject(key)) removed++;
  }
  console.log(`\nDeleted ${removed}/${orphans.length} file(s).`);
}

// Only run when invoked directly (not when imported by the test).
if (process.argv[1] && /cleanup-orphan-images/.test(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
