CREATE TABLE `ichingHexagramText` (
	`number` int NOT NULL,
	`trigramExplanation` text NOT NULL,
	`interpretation` text NOT NULL,
	`changingLinesNote` text NOT NULL DEFAULT (''),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ichingHexagramText_number` PRIMARY KEY(`number`)
);
--> statement-breakpoint
CREATE TABLE `ichingIntro` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleHtml` text NOT NULL,
	`questionPrompt` varchar(512) NOT NULL DEFAULT 'מה ברצונך לשאול?',
	`questionHint` varchar(512) NOT NULL DEFAULT 'השאלה אישית ואינה נשמרת בשום מקום.',
	`buttonLabel` varchar(128) NOT NULL DEFAULT 'הַטֵּל אֶת הַמַּטְבְּעוֹת',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ichingIntro_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ichingTrigramText` (
	`trigramKey` varchar(16) NOT NULL,
	`description` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ichingTrigramText_trigramKey` PRIMARY KEY(`trigramKey`)
);
