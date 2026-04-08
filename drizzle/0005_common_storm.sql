CREATE TABLE `aboutPage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL DEFAULT 'אודות',
	`content` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aboutPage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `guestPostApproved` boolean DEFAULT false NOT NULL;