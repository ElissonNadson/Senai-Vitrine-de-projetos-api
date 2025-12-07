-- ============================================================================
-- Migration: Adicionar campos do frontend de criação de projetos
-- Data: 2025-12-07
-- ============================================================================

-- Adicionar campos de informações acadêmicas e detalhes à tabela projetos
ALTER TABLE projetos
  ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
  ADD COLUMN IF NOT EXISTS curso VARCHAR(200),
  ADD COLUMN IF NOT EXISTS turma VARCHAR(50),
  ADD COLUMN IF NOT EXISTS modalidade VARCHAR(50) CHECK (modalidade IN ('Presencial', 'Semipresencial', NULL)),
  ADD COLUMN IF NOT EXISTS unidade_curricular VARCHAR(255),
  ADD COLUMN IF NOT EXISTS itinerario BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS senai_lab BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS saga_senai BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_repositorio BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tipo_repositorio VARCHAR(20) CHECK (tipo_repositorio IN ('arquivo', 'link', NULL)),
  ADD COLUMN IF NOT EXISTS link_repositorio TEXT,
  ADD COLUMN IF NOT EXISTS codigo_visibilidade VARCHAR(20) DEFAULT 'Público' CHECK (codigo_visibilidade IN ('Público', 'Privado', NULL)),
  ADD COLUMN IF NOT EXISTS anexos_visibilidade VARCHAR(20) DEFAULT 'Público' CHECK (anexos_visibilidade IN ('Público', 'Privado', NULL)),
  ADD COLUMN IF NOT EXISTS aceitou_termos BOOLEAN DEFAULT FALSE;

-- Criar índices para os novos campos mais usados em buscas
CREATE INDEX IF NOT EXISTS idx_projetos_categoria ON projetos(categoria);
CREATE INDEX IF NOT EXISTS idx_projetos_curso ON projetos(curso);
CREATE INDEX IF NOT EXISTS idx_projetos_turma ON projetos(turma);
CREATE INDEX IF NOT EXISTS idx_projetos_modalidade ON projetos(modalidade);

-- ============================================================================
-- Tabela para armazenar fases do projeto com descrições e anexos
-- ============================================================================

CREATE TABLE IF NOT EXISTS projetos_fases (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_uuid UUID NOT NULL REFERENCES projetos(uuid) ON DELETE CASCADE,
  nome_fase VARCHAR(50) NOT NULL CHECK (nome_fase IN ('ideacao', 'modelagem', 'prototipagem', 'implementacao')),
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(projeto_uuid, nome_fase)
);

CREATE INDEX idx_projetos_fases_projeto ON projetos_fases(projeto_uuid);
CREATE INDEX idx_projetos_fases_nome ON projetos_fases(nome_fase);

-- ============================================================================
-- Tabela para anexos das fases (documentos de Ideação, Modelagem, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS projetos_fases_anexos (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fase_uuid UUID NOT NULL REFERENCES projetos_fases(uuid) ON DELETE CASCADE,
  tipo_anexo VARCHAR(100), -- Ex: 'crazy8', 'mapa_mental', 'wireframe', etc.
  nome_arquivo VARCHAR(255) NOT NULL,
  url_arquivo TEXT NOT NULL,
  tamanho_bytes BIGINT,
  mime_type VARCHAR(100),
  criado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(fase_uuid, tipo_anexo, nome_arquivo)
);

CREATE INDEX idx_projetos_fases_anexos_fase ON projetos_fases_anexos(fase_uuid);
CREATE INDEX idx_projetos_fases_anexos_tipo ON projetos_fases_anexos(tipo_anexo);

-- ============================================================================
-- Tabela para armazenar código fonte (arquivos ZIP)
-- ============================================================================

CREATE TABLE IF NOT EXISTS projetos_codigo (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_uuid UUID NOT NULL REFERENCES projetos(uuid) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  url_arquivo TEXT NOT NULL,
  tamanho_bytes BIGINT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(projeto_uuid)
);

CREATE INDEX idx_projetos_codigo_projeto ON projetos_codigo(projeto_uuid);

-- ============================================================================
-- Comentários
-- ============================================================================

COMMENT ON COLUMN projetos.categoria IS 'Categoria do projeto: Aplicativo/Site, IoT, Automação, etc.';
COMMENT ON COLUMN projetos.curso IS 'Nome do curso técnico';
COMMENT ON COLUMN projetos.turma IS 'Código da turma';
COMMENT ON COLUMN projetos.modalidade IS 'Modalidade do curso: Presencial ou Semipresencial';
COMMENT ON COLUMN projetos.unidade_curricular IS 'Nome da unidade curricular';
COMMENT ON COLUMN projetos.itinerario IS 'Participou de itinerário formativo';
COMMENT ON COLUMN projetos.senai_lab IS 'Participou do Senai Lab/Maker';
COMMENT ON COLUMN projetos.saga_senai IS 'Participou da Saga Senai';
COMMENT ON COLUMN projetos.has_repositorio IS 'Projeto possui repositório de código';
COMMENT ON COLUMN projetos.tipo_repositorio IS 'Tipo: arquivo (ZIP) ou link (GitHub/GitLab)';
COMMENT ON COLUMN projetos.link_repositorio IS 'URL do repositório externo (GitHub, GitLab, etc.)';
COMMENT ON COLUMN projetos.codigo_visibilidade IS 'Visibilidade do código: Público ou Privado';
COMMENT ON COLUMN projetos.anexos_visibilidade IS 'Visibilidade dos anexos das fases: Público ou Privado';
COMMENT ON COLUMN projetos.aceitou_termos IS 'Usuário aceitou os termos de uso e privacidade';

COMMENT ON TABLE projetos_fases IS 'Armazena descrições das 4 fases do projeto';
COMMENT ON TABLE projetos_fases_anexos IS 'Anexos de cada fase (Crazy 8, Wireframes, User Stories, etc.)';
COMMENT ON TABLE projetos_codigo IS 'Arquivo ZIP com o código fonte do projeto';
