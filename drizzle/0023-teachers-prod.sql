-- Idempotent production variant of 0023_teachers.sql (Railway): pnpm run:sql
CREATE TABLE IF NOT EXISTS `teachers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(256) NOT NULL,
	`photo` varchar(1024),
	`tagline` varchar(512) NOT NULL DEFAULT '',
	`area` varchar(256) NOT NULL DEFAULT '',
	`formats` varchar(256) NOT NULL DEFAULT '',
	`bio` mediumtext,
	`quote` text,
	`website` varchar(1024) NOT NULL DEFAULT '',
	`publicEmail` varchar(320) NOT NULL DEFAULT '',
	`phone` varchar(64) NOT NULL DEFAULT '',
	`contactEmail` varchar(320) NOT NULL DEFAULT '',
	`userId` int,
	`isFounder` boolean NOT NULL DEFAULT false,
	`visible` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teachers_id` PRIMARY KEY(`id`),
	CONSTRAINT `teachers_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `teachers_userId_unique` UNIQUE(`userId`)
);
SET @db := DATABASE();
SET @s := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='articles' AND column_name='teacherId')=0, 'ALTER TABLE `articles` ADD `teacherId` int', 'SELECT 1');
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;
