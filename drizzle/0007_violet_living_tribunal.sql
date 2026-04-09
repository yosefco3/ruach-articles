CREATE TABLE `featuredArticle` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `featuredArticle_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `articles` MODIFY COLUMN `category` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `guestPosts` MODIFY COLUMN `category` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `aboutPage` ADD `imageUrl` varchar(1024);