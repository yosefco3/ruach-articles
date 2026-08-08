CREATE TABLE `derechPage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content` mediumtext,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `derechPage_id` PRIMARY KEY(`id`)
);
