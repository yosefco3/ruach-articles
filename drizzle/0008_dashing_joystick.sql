ALTER TABLE `siteSettings` MODIFY COLUMN `heroSubtitle` varchar(512) NOT NULL DEFAULT 'רוחניות xb7 פילוסופיה xb7 ריפוי';--> statement-breakpoint
ALTER TABLE `articles` ADD `sortOrder` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `coverImage` varchar(1024);--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `contactEmail` varchar(320);