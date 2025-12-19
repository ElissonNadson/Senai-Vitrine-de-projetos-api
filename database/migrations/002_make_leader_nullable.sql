-- Remove NOT NULL constraint from lider_uuid
ALTER TABLE projetos
ALTER COLUMN lider_uuid DROP NOT NULL;