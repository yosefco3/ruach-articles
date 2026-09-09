-- Idempotent production variant of 0017_tarot_reading.sql (Railway).
-- Run on prod BEFORE merging the tarot feature to main.
CREATE TABLE IF NOT EXISTS `tarotCardText` (
	`cardId` varchar(16) NOT NULL,
	`name` varchar(128) NOT NULL DEFAULT '',
	`summary` varchar(512) NOT NULL DEFAULT '',
	`interpretation` mediumtext NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tarotCardText_cardId` PRIMARY KEY(`cardId`)
);
CREATE TABLE IF NOT EXISTS `tarotIntro` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleHtml` mediumtext NOT NULL,
	`questionPrompt` varchar(512) NOT NULL DEFAULT 'מה השאלה שמעסיקה אותך?',
	`questionHint` varchar(512) NOT NULL DEFAULT 'השאלה אישית ואינה נשמרת בשום מקום.',
	`buttonLabel` varchar(128) NOT NULL DEFAULT 'עִרְבְּבוּ וְשִׁלְפוּ קְלָפִים',
	`aiEnabled` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tarotIntro_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `tarotAiUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`monthYear` varchar(7) NOT NULL,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tarotAiUsage_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_tarot_usage_user_month` UNIQUE(`userId`,`monthYear`)
);
