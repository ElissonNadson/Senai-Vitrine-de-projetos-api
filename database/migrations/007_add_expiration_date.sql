-- ============================================================================
-- MIGRATION: 007_add_expiration_date
-- DATA: 2025-12-14
-- DESCRIÇÃO: Adiciona campo data_expiracao para agendamento de arquivamento
-- ============================================================================
ALTER TABLE noticias
ADD COLUMN IF NOT EXISTS data_expiracao TIMESTAMP;
COMMENT ON COLUMN noticias.data_expiracao IS 'Data agendada para arquivamento automático da notícia';