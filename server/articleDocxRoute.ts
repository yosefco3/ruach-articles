import { Router } from "express";
import { getArticleBySlug, getCategories } from "./db";
import { generateArticleDocx } from "./articleDocx";

export const articleDocxRouter = Router();

/**
 * GET /api/article-docx/:slug
 * Returns a .docx file for the given article slug.
 */
articleDocxRouter.get("/api/article-docx/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await getArticleBySlug(slug);

    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    if (!article.published) {
      res.status(403).json({ error: "Article is not published" });
      return;
    }

    // Resolve category display name from slug
    let categoryName: string | null = null;
    if (article.category) {
      const cats = await getCategories();
      const cat = cats.find((c) => c.slug === article.category);
      categoryName = cat?.name ?? article.category;
    }

    const docxBuffer = await generateArticleDocx({
      title: article.title,
      excerpt: article.excerpt,
      body: article.body ?? "",
      coverImageUrl: article.coverImage,
      categoryName,
      publishedDate: article.createdAt ? new Date(article.createdAt) : null,
    });

    // Sanitize filename
    const safeTitle = article.title
      .replace(/[^\w\u0590-\u05FF\u0600-\u06FF\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);
    const filename = `${safeTitle || slug}.docx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(docxBuffer);
  } catch (err) {
    console.error("[articleDocxRoute] Error generating docx:", err);
    res.status(500).json({ error: "Failed to generate document" });
  }
});
