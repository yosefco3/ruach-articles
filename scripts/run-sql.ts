/**
 * run-sql — execute a .sql file against DATABASE_URL, statement by statement.
 * For the idempotent *-prod.sql migrations:  railway run -- pnpm run:sql drizzle/0020-books-prod.sql
 * Prints only statement counts — never the connection string.
 */
import fs from "fs";
import mysql from "mysql2/promise";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("usage: run:sql <file.sql>");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const sql = fs.readFileSync(file, "utf8").replace(/--> statement-breakpoint/g, ";");
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter(Boolean);
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    let n = 0;
    for (const st of statements) { await conn.query(st); n++; }
    console.log(`${file}: ${n} statement(s) applied`);
  } finally {
    await conn.end();
  }
}
main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
