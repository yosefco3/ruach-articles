-- ─────────────────────────────────────────────────────────────────────────────
-- Production migration 0015 — article bodies → mediumtext (16MB)
-- מיועד להרצה ידנית על ה-DB של production (Railway). בטוח להרצה חוזרת —
-- MODIFY לאותו סוג הוא no-op. הרחבה בלבד (text→mediumtext), אין אובדן נתונים.
-- רקע: מאמרי HTML ארוכים מה-RTE (~70KB) נכשלו מול גבול ה-64KB של text.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE `articles` MODIFY COLUMN `excerpt` mediumtext;
ALTER TABLE `articles` MODIFY COLUMN `body` mediumtext NOT NULL;
ALTER TABLE `guestPosts` MODIFY COLUMN `body` mediumtext NOT NULL;
