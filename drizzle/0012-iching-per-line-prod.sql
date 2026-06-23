-- ─────────────────────────────────────────────────────────────────────────────
-- Production migration 0012 — per-line changing lines (changingLinesNote → line1..6)
-- מיועד להרצה ידנית על ה-DB של production (Railway), בשני שלבים.
-- שלב A בטוח ואדיטיבי (האפליקציה החדשה תעבוד מיד). שלב C הרסני — רק אחרי גיבוי.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── שלב A: הוספת ששת העמודות (ADDITIVE — בטוח, מריצים ראשון) ──
-- אם עמודה כבר קיימת מ-run קודם, MySQL יחזיר שגיאה "Duplicate column" — אפשר להתעלם.
ALTER TABLE `ichingHexagramText` ADD COLUMN `line1` text NOT NULL;
ALTER TABLE `ichingHexagramText` ADD COLUMN `line2` text NOT NULL;
ALTER TABLE `ichingHexagramText` ADD COLUMN `line3` text NOT NULL;
ALTER TABLE `ichingHexagramText` ADD COLUMN `line4` text NOT NULL;
ALTER TABLE `ichingHexagramText` ADD COLUMN `line5` text NOT NULL;
ALTER TABLE `ichingHexagramText` ADD COLUMN `line6` text NOT NULL;

-- ── שלב B (אופציונלי): שימור התוכן הישן ──
-- אם ב-changingLinesNote יש טקסט, מעתיקים אותו ל-line1 כדי לא לאבד אותו
-- (האדמין יוכל לפזר אותו לקווים הנכונים אחר כך). מדלג על שורות ריקות.
UPDATE `ichingHexagramText`
  SET `line1` = `changingLinesNote`
  WHERE TRIM(`changingLinesNote`) <> '';

-- ── שלב C: הסרת העמודה הישנה (הרסני — רק אחרי שאימתת שאין מה לאבד / שגיבית) ──
ALTER TABLE `ichingHexagramText` DROP COLUMN `changingLinesNote`;
