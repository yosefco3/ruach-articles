-- Idempotent production data fix for Railway: tarot button label nikud.
-- The imperative of עִרְבֵּב (pi'el) is עַרְבְּבוּ (patach); עִרְבְּבוּ (hirik) is the past tense.
-- Safe to run repeatedly. Only touches the row if it still holds the old default.
ALTER TABLE `tarotIntro` ALTER COLUMN `buttonLabel` SET DEFAULT 'עַרְבְּבוּ וְשִׁלְפוּ קְלָפִים';
UPDATE `tarotIntro` SET `buttonLabel` = 'עַרְבְּבוּ וְשִׁלְפוּ קְלָפִים' WHERE `buttonLabel` = 'עִרְבְּבוּ וְשִׁלְפוּ קְלָפִים';
