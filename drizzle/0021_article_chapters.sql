ALTER TABLE `articles` ADD `bookId` int;
--> statement-breakpoint
ALTER TABLE `articles` ADD `chapterNo` int;
--> statement-breakpoint
ALTER TABLE `articles` ADD `chapterLabel` varchar(128) NOT NULL DEFAULT '';
