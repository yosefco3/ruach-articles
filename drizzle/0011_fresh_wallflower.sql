CREATE TABLE `ichingAiUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`monthYear` varchar(7) NOT NULL,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ichingAiUsage_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_iching_usage_user_month` UNIQUE(`userId`,`monthYear`)
);
