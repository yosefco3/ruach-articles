-- I Ching tables — consolidated, production-safe (additive, idempotent).
-- מאחד את מיגרציות 0009 (טבלאות) + 0010 (עמודות שמות) למצב הסופי.
-- בטוח להרצה חוזרת: CREATE TABLE IF NOT EXISTS לא נוגע בנתונים קיימים.

CREATE TABLE IF NOT EXISTS `ichingHexagramText` (
  `number` int NOT NULL,
  `name` varchar(128) NOT NULL DEFAULT '',
  `trigramExplanation` text NOT NULL,
  `interpretation` text NOT NULL,
  `changingLinesNote` text NOT NULL DEFAULT (''),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `ichingHexagramText_number` PRIMARY KEY(`number`)
);

CREATE TABLE IF NOT EXISTS `ichingTrigramText` (
  `trigramKey` varchar(16) NOT NULL,
  `name` varchar(64) NOT NULL DEFAULT '',
  `element` varchar(64) NOT NULL DEFAULT '',
  `attr` varchar(128) NOT NULL DEFAULT '',
  `description` text NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `ichingTrigramText_trigramKey` PRIMARY KEY(`trigramKey`)
);

CREATE TABLE IF NOT EXISTS `ichingIntro` (
  `id` int AUTO_INCREMENT NOT NULL,
  `articleHtml` text NOT NULL,
  `questionPrompt` varchar(512) NOT NULL DEFAULT 'מה ברצונך לשאול?',
  `questionHint` varchar(512) NOT NULL DEFAULT 'השאלה אישית ואינה נשמרת בשום מקום.',
  `buttonLabel` varchar(128) NOT NULL DEFAULT 'הַטֵּל אֶת הַמַּטְבְּעוֹת',
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `ichingIntro_id` PRIMARY KEY(`id`)
);
