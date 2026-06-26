# SEO & Promotion Checklist — רוח חכמה

On-page / technical SEO is handled in code (see `feature-prompts/seo-promotion/`).
This file tracks the **operational** work only the site owner can do.

## 1. Index & verify (do this first — highest impact)
- [ ] **Google Search Console** — add property for `ruachwisdom.org` (DNS TXT verify),
      submit `https://ruachwisdom.org/sitemap.xml`, then **URL Inspection → Request
      Indexing** for: the homepage, `/iching`, and the top articles.
      *This is what makes the new description + JSON-LD show up in Google sooner.*
- [ ] **Bing Webmaster Tools** — add the site (import from GSC), submit the sitemap.
- [ ] **Google Rich Results Test** — paste the homepage + an article URL; confirm
      `Organization`, `WebSite`, and `BlogPosting` are detected with no errors.
- [ ] **Facebook Sharing Debugger** — paste the homepage + an article; click
      "Scrape Again" to refresh the cached preview image/description.

## 2. Measure
- [ ] **PageSpeed Insights / Lighthouse** on homepage, an article, and `/iching`.
      Track Core Web Vitals (LCP / INP / CLS). Re-check after the immutable-asset
      caching change (step 05) lands in production.
- [ ] Confirm **Umami** analytics is recording traffic (already installed).

## 3. Content (compounding, ongoing)
- [ ] Exactly one clear `<h1>` per page; descriptive `alt` text on every image.
- [ ] Internal links between related articles, and from articles to `/iching`.
- [ ] Consistent target keywords in titles/excerpts: יהדות, פילוסופיה, רוחניות, ריפוי,
      אי צ׳ינג, רמב"ם / רמח"ל.
- [ ] Fill `SOCIAL_PROFILES` in `server/jsonld.ts` once social handles exist — this
      feeds the Organization `sameAs` array (helps Google build a knowledge panel).

## 4. Off-site (backlinks — strongest external ranking factor)
- [ ] Share each new article to relevant communities and social profiles.
- [ ] Pursue mentions/links from related Hebrew Judaism/spirituality sites.
- [ ] Submit the RSS feed (`/rss.xml`) to feed directories / enable an email digest.

---
_Status of the code-side work is tracked in `feature-prompts/seo-promotion/_PROGRESS.md`._
