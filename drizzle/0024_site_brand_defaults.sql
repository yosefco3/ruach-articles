ALTER TABLE `siteSettings` MODIFY `siteTitle` varchar(256) NOT NULL DEFAULT 'דרך הרוח';
--> statement-breakpoint
ALTER TABLE `siteSettings` MODIFY `heroSubtitle` varchar(512) NOT NULL DEFAULT 'הנבואה הטבעית';
--> statement-breakpoint
UPDATE `siteSettings` SET `siteTitle` = 'דרך הרוח' WHERE `siteTitle` IN ('רוּחַ', 'רוח חכמה', 'רוּחַ חָכְמָה', '');
--> statement-breakpoint
UPDATE `siteSettings` SET `heroSubtitle` = 'הנבואה הטבעית' WHERE `heroSubtitle` LIKE '%פילוסופיה%' OR `heroSubtitle` LIKE '%יוסף%' OR `heroSubtitle` = '';
