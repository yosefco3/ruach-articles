-- Idempotent production variant of 0021_article_chapters.sql (Railway): pnpm run:sql
-- MySQL 8 has no ADD COLUMN IF NOT EXISTS — guarded through information_schema. One statement per line.
SET @db := DATABASE();
SET @s := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='articles' AND column_name='bookId')=0, 'ALTER TABLE `articles` ADD `bookId` int', 'SELECT 1');
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;
SET @s := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='articles' AND column_name='chapterNo')=0, 'ALTER TABLE `articles` ADD `chapterNo` int', 'SELECT 1');
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;
SET @s := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='articles' AND column_name='chapterLabel')=0, 'ALTER TABLE `articles` ADD `chapterLabel` varchar(128) NOT NULL DEFAULT ''''', 'SELECT 1');
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;
