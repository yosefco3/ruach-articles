-- Idempotent production variant of 0020_books.sql (Railway).
-- Run on prod BEFORE merging the books feature to main.
CREATE TABLE IF NOT EXISTS `books` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`title` varchar(256) NOT NULL,
	`subtitle` varchar(512) NOT NULL DEFAULT '',
	`blurb` mediumtext,
	`coverImage` varchar(1024),
	`status` enum('writing','coming_soon','available') NOT NULL DEFAULT 'writing',
	`visible` boolean NOT NULL DEFAULT false,
	`publisher` varchar(256) NOT NULL DEFAULT '',
	`purchaseLinks` text,
	`tocJson` text,
	`year` int,
	`pages` int,
	`isbn` varchar(32) NOT NULL DEFAULT '',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `books_id` PRIMARY KEY(`id`),
	CONSTRAINT `books_slug_unique` UNIQUE(`slug`)
);
