-- ─────────────────────────────────────────────────────────────────────────────
-- Production migration 0014 — I Ching AI master switch (intro.aiEnabled)
-- מיועד להרצה ידנית על ה-DB של production (Railway). אידמפוטנטי — בטוח להרצה חוזרת.
-- מוסיף עמודת boolean (כבוי כברירת מחדל) רק אם אינה קיימת.
-- ─────────────────────────────────────────────────────────────────────────────
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ichingIntro'
    AND COLUMN_NAME = 'aiEnabled'
);
SET @ddl := IF(
  @col = 0,
  'ALTER TABLE `ichingIntro` ADD `aiEnabled` boolean DEFAULT false NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
