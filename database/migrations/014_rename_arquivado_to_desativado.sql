-- Migration: Renomear status ARQUIVADO → DESATIVADO
-- Data: 2026-02-18

BEGIN;

-- 1. Remover constraint antiga
ALTER TABLE projetos DROP CONSTRAINT IF EXISTS projetos_status_check;

-- 2. Atualizar registros existentes
UPDATE projetos SET status = 'DESATIVADO' WHERE status = 'ARQUIVADO';

-- 3. Recriar constraint com novo valor
ALTER TABLE projetos ADD CONSTRAINT projetos_status_check 
  CHECK (status IN ('RASCUNHO', 'PUBLICADO', 'DESATIVADO', 'EXCLUIDO'));

COMMIT;
