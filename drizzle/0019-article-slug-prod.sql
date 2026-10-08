-- Idempotent production data fix for Railway: give the article "מקורות הסמכות שלי"
-- a real slug. It was saved as "-" (its Hebrew title transliterated to nothing), so
-- its URL was https://ruachwisdom.org/article/- .
-- The server 301s /article/- to the new slug once this has run (shared/legacySlugs.ts).
-- Safe to run repeatedly: only touches the row while it still holds the old slug.
UPDATE `articles` SET `slug` = 'my-sources-of-authority' WHERE `slug` = '-';
