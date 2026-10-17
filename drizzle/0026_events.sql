CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` mediumtext,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NULL,
	`location` varchar(256) NOT NULL DEFAULT '',
	`isOnline` boolean NOT NULL DEFAULT false,
	`registrationUrl` varchar(1024) NOT NULL DEFAULT '',
	`price` varchar(64) NOT NULL DEFAULT '',
	`teacherId` int,
	`bookId` int,
	`coverImage` varchar(1024),
	`published` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`),
	CONSTRAINT `events_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `eventsVisible` boolean NOT NULL DEFAULT false;
