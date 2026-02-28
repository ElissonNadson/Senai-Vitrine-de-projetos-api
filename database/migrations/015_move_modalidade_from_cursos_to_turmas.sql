-- Migration: mover modalidade de cursos para turmas
-- Data: 2026-02-26

BEGIN;

-- 1) Adiciona modalidade em turmas (sem constraint rígida para suportar valores de planilhas)
ALTER TABLE turmas
  ADD COLUMN IF NOT EXISTS modalidade VARCHAR(100);

-- 2) Migra dados legados de cursos.modalidade para turmas.modalidade
UPDATE turmas t
SET modalidade = c.modalidade
FROM cursos c
WHERE t.curso_uuid = c.uuid
  AND t.modalidade IS NULL
  AND c.modalidade IS NOT NULL;

-- 3) Remove constraint de cursos.modalidade
ALTER TABLE cursos
  DROP CONSTRAINT IF EXISTS cursos_modalidade_check;

-- 4) Remove coluna modalidade de cursos
ALTER TABLE cursos
  DROP COLUMN IF EXISTS modalidade;

COMMIT;
