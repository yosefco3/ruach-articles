ALTER TABLE `articles` MODIFY COLUMN `excerpt` mediumtext;--> statement-breakpoint
ALTER TABLE `articles` MODIFY COLUMN `body` mediumtext NOT NULL;--> statement-breakpoint
ALTER TABLE `guestPosts` MODIFY COLUMN `body` mediumtext NOT NULL;
