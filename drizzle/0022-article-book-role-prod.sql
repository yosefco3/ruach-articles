-- Idempotent production variant of 0022_article_book_role.sql (Railway): pnpm run:sql
SET @db := DATABASE();
SET @s := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='articles' AND column_name='bookRole')=0, 'ALTER TABLE `articles` ADD `bookRole` enum(''chapter'',''material'') NOT NULL DEFAULT ''chapter''', 'SELECT 1');
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;
