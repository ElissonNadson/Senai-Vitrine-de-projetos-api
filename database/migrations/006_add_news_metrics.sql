-- ============================================================================
-- MIGRATION: 006_add_news_metrics
-- DATA: 2025-12-12
-- DESCRIÇÃO: Adiciona campos de métricas (visualizações e curtidas) às notícias
-- ============================================================================

ALTER TABLE noticias 
ADD COLUMN IF NOT EXISTS visualizacoes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS curtidas INTEGER DEFAULT 0;

COMMENT ON COLUMN noticias.visualizacoes IS 'Contador de visualizações da notícia';
COMMENT ON COLUMN noticias.curtidas IS 'Contador de curtidas da notícia';
