ALTER TABLE `ichingHexagramText` ADD `name` varchar(128) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `ichingTrigramText` ADD `name` varchar(64) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `ichingTrigramText` ADD `element` varchar(64) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `ichingTrigramText` ADD `attr` varchar(128) DEFAULT '' NOT NULL;