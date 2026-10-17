-- Idempotent production variant of 0025_newsletter_interest.sql (Railway): pnpm run:sql
SET @db := DATABASE();
SET @s := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='newsletterSubscribers' AND column_name='interest')=0, 'ALTER TABLE `newsletterSubscribers` ADD `interest` varchar(64) NOT NULL DEFAULT ''''', 'SELECT 1');
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;
