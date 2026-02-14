-- Migration: Adicionar soft delete para docentes do projeto
-- Adiciona colunas para controle de histórico e remove restrição única para permitir múltiplos registros do mesmo docente (em períodos diferentes)
-- 1. Remover a constraint UNIQUE antiga que impedia histórico
ALTER TABLE public.projetos_docentes DROP CONSTRAINT IF EXISTS projetos_docentes_projeto_uuid_usuario_uuid_key;
-- 2. Adicionar colunas de controle
ALTER TABLE public.projetos_docentes
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS removido_em TIMESTAMP WITHOUT TIME ZONE;
-- 3. Adicionar índice para otimizar busca de ativos
CREATE INDEX IF NOT EXISTS idx_projetos_docentes_ativo ON public.projetos_docentes(ativo);
-- 4. Comentários
COMMENT ON COLUMN public.projetos_docentes.ativo IS 'Indica se o docente é o orientador atual (true) ou histórico (false)';
COMMENT ON COLUMN public.projetos_docentes.removido_em IS 'Data em que o docente deixou a orientação do projeto';