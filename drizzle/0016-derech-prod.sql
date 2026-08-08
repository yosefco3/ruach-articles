-- Idempotent production migration for Railway: derechPage table (see 0016_derech_page.sql).
-- Safe to run repeatedly.
CREATE TABLE IF NOT EXISTS `derechPage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content` mediumtext,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `derechPage_id` PRIMARY KEY(`id`)
);
