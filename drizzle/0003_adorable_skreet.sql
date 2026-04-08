CREATE TABLE `guestPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`authorName` varchar(256) NOT NULL,
	`authorEmail` varchar(320) NOT NULL,
	`body` text NOT NULL,
	`category` enum('spirituality','philosophy','healing') NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guestPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteTitle` varchar(256) NOT NULL DEFAULT 'רוּחַ',
	`heroSubtitle` varchar(512) NOT NULL DEFAULT 'רוחניות · פילוסופיה · ריפוי',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `comments` ADD `parentCommentId` int;