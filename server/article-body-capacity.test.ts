import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mysql from "mysql2/promise";

// מאמרי HTML מה-RTE עוברים את גבול ה-64KB של text; העמודות חייבות להיות mediumtext.
// (ראה drizzle/0015_mediumtext_article_body.sql)

const TEST_SLUG = "__test-body-capacity";

let connection: mysql.Connection;

beforeAll(async () => {
  connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "dev_password_2024",
    database: "ruach_dev",
  });
});

afterAll(async () => {
  await connection.query("DELETE FROM articles WHERE slug = ?", [TEST_SLUG]);
  await connection.end();
});

describe("article body capacity", () => {
  it("body/excerpt columns are mediumtext", async () => {
    const [rows] = await connection.query(
      `SELECT table_name AS t, column_name AS c, data_type AS dt
       FROM information_schema.columns
       WHERE table_schema = 'ruach_dev'
         AND ((table_name = 'articles' AND column_name IN ('body', 'excerpt'))
           OR (table_name = 'guestPosts' AND column_name = 'body'))`,
    );
    const types = Object.fromEntries((rows as any[]).map((r) => [`${r.t}.${r.c}`, r.dt]));
    expect(types).toEqual({
      "articles.body": "mediumtext",
      "articles.excerpt": "mediumtext",
      "guestPosts.body": "mediumtext",
    });
  });

  it("inserts and reads back a 100KB article body", async () => {
    const body = "<p>אבגדהוזחטי</p>".repeat(4200); // ~100KB בבתים (עברית = 2 בתים/תו ב-utf8)
    expect(Buffer.byteLength(body, "utf8")).toBeGreaterThan(100_000);

    await connection.query("DELETE FROM articles WHERE slug = ?", [TEST_SLUG]);
    await connection.query(
      `INSERT INTO articles (title, slug, body, category, authorId, published)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["בדיקת קיבולת", TEST_SLUG, body, "test", 0, false],
    );

    const [rows] = await connection.query(
      "SELECT body FROM articles WHERE slug = ?",
      [TEST_SLUG],
    );
    expect((rows as any[])[0].body).toBe(body);
  });
});
