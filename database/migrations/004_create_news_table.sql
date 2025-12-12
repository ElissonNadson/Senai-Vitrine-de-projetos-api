-- ============================================================================
-- MIGRATION: 004_create_news_table
-- DATA: 2025-12-12
-- DESCRIÇÃO: Criação da tabela de notícias para o módulo de blog/feed
-- ============================================================================

CREATE TABLE IF NOT EXISTS noticias (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  resumo TEXT,
  conteudo TEXT, -- HTML do editor rico
  banner_url TEXT,
  
  -- Informações de Evento (opcional)
  data_evento TIMESTAMP,
  local_evento VARCHAR(255),
  
  -- Metadados
  categoria VARCHAR(50) DEFAULT 'GERAL',
  slug VARCHAR(255) UNIQUE, -- Para URL amigável
  
  -- Publicação
  publicado BOOLEAN DEFAULT TRUE,
  data_publicacao TIMESTAMP DEFAULT NOW(),
  destaque BOOLEAN DEFAULT FALSE,
  
  -- Relações
  autor_uuid UUID REFERENCES usuarios(uuid),
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_noticias_data ON noticias(data_publicacao DESC);
CREATE INDEX idx_noticias_categoria ON noticias(categoria);
CREATE INDEX idx_noticias_slug ON noticias(slug);

-- Trigger de atualização
DROP TRIGGER IF EXISTS trigger_noticias_updated ON noticias;
CREATE TRIGGER trigger_noticias_updated 
  BEFORE UPDATE ON noticias 
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

COMMENT ON TABLE noticias IS 'Notícias e Eventos do portal';
