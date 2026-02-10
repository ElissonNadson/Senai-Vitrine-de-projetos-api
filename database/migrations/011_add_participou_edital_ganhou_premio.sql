-- ============================================================================
-- MIGRATION: 011_add_participou_edital_ganhou_premio
-- DATA: 2025-01-XX
-- DESCRIÇÃO: Adiciona campos participou_edital e ganhou_premio na tabela projetos
-- ============================================================================

ALTER TABLE projetos
  ADD COLUMN IF NOT EXISTS participou_edital BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ganhou_premio BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN projetos.participou_edital IS 'Indica se o projeto participou de algum edital';
COMMENT ON COLUMN projetos.ganhou_premio IS 'Indica se o projeto ganhou algum prêmio';

