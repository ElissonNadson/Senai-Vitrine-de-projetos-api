-- Migration: Adicionar campo status em projetos_fases
-- Data: 2024

-- Adicionar coluna status com constraint
ALTER TABLE projetos_fases 
ADD COLUMN status VARCHAR(20) DEFAULT 'Pendente' 
CHECK (status IN ('Pendente', 'Em andamento', 'Concluído'));

-- Atualizar status existente baseado em descricao e anexos
UPDATE projetos_fases pf
SET status = CASE
  WHEN pf.descricao IS NOT NULL AND pf.descricao != '' 
       AND EXISTS (SELECT 1 FROM projetos_fases_anexos pfa WHERE pfa.fase_uuid = pf.uuid)
  THEN 'Concluído'
  WHEN (pf.descricao IS NOT NULL AND pf.descricao != '') 
       OR EXISTS (SELECT 1 FROM projetos_fases_anexos pfa WHERE pfa.fase_uuid = pf.uuid)
  THEN 'Em andamento'
  ELSE 'Pendente'
END;

-- Comentário na coluna
COMMENT ON COLUMN projetos_fases.status IS 'Status da fase: Pendente, Em andamento ou Concluído';

