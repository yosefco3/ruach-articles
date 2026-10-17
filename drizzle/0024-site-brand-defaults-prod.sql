-- Idempotent production variant of 0024_site_brand_defaults.sql (Railway): pnpm run:sql
ALTER TABLE `siteSettings` MODIFY `siteTitle` varchar(256) NOT NULL DEFAULT 'דרך הרוח';

ALTER TABLE `siteSettings` MODIFY `heroSubtitle` varchar(512) NOT NULL DEFAULT 'הנבואה הטבעית';

UPDATE `siteSettings` SET `siteTitle` = 'דרך הרוח' WHERE `siteTitle` IN ('רוּחַ', 'רוח חכמה', 'רוּחַ חָכְמָה', '');

UPDATE `siteSettings` SET `heroSubtitle` = 'הנבואה הטבעית' WHERE `heroSubtitle` LIKE '%פילוסופיה%' OR `heroSubtitle` LIKE '%יוסף%' OR `heroSubtitle` = '';
