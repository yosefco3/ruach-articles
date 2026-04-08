/**
 * Fix seed data:
 * 1. Convert article body from Markdown to HTML
 * 2. Delete all test comments (from vitest runs)
 * 3. Fix About page title if it contains "עדכן"
 */
import mysql from "mysql2/promise";
import { marked } from "marked";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);

  // 1. Convert article bodies from Markdown to HTML
  console.log("Converting article bodies from Markdown to HTML...");
  const [articles] = await conn.query("SELECT id, body FROM articles");
  for (const article of articles) {
    // Check if body looks like Markdown (starts with ## or has markdown patterns)
    if (article.body.includes("## ") || article.body.includes("> ") || article.body.includes("### ")) {
      const html = await marked(article.body);
      await conn.query("UPDATE articles SET body = ? WHERE id = ?", [html, article.id]);
      console.log(`  Updated article ${article.id}`);
    } else {
      console.log(`  Article ${article.id} already looks like HTML, skipping`);
    }
  }

  // 2. Delete all test comments (English text patterns from vitest)
  console.log("\nCleaning up test comments...");
  const [deleteResult] = await conn.query(
    "DELETE FROM comments WHERE body IN ('User comment', 'Great article!', 'My comment', 'Reply to comment', 'Original comment', 'User 1 comment', 'test comment')"
  );
  console.log(`  Deleted ${deleteResult.affectedRows} test comments`);

  // 3. Fix About page title
  console.log("\nFixing About page title...");
  const [aboutRows] = await conn.query("SELECT id, title FROM aboutPage");
  if (aboutRows.length > 0 && aboutRows[0].title.includes("עדכן")) {
    await conn.query("UPDATE aboutPage SET title = ? WHERE id = ?", ["אודות", aboutRows[0].id]);
    console.log("  Fixed About page title to 'אודות'");
  } else {
    console.log("  About page title is OK");
  }

  // 4. Delete test likes too
  console.log("\nCleaning up orphaned likes...");
  const [likesResult] = await conn.query(
    "DELETE FROM likes WHERE commentId IS NOT NULL AND commentId NOT IN (SELECT id FROM comments)"
  );
  console.log(`  Deleted ${likesResult.affectedRows} orphaned likes`);

  await conn.end();
  console.log("\nDone!");
}

main().catch(console.error);
