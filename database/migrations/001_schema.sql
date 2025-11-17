-- ============================================================================
-- VITRINE DE PROJETOS SENAI-BA - SCHEMA DATABASE
-- Data: 2025-11-17
-- Descrição: Estrutura completa de 16 tabelas para MVP
-- ============================================================================

-- Extension para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABELAS DE USUÁRIOS E AUTENTICAÇÃO
-- ============================================================================

-- Tabela principal de usuários (comum para alunos, professores e admin)
CREATE TABLE usuarios (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  google_id VARCHAR(255) NOT NULL UNIQUE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ALUNO', 'PROFESSOR', 'ADMIN')),
  primeiro_acesso BOOLEAN DEFAULT TRUE,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_google_id ON usuarios(google_id);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);

-- Tabela de alunos (dados específicos)
CREATE TABLE alunos (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_uuid UUID NOT NULL UNIQUE REFERENCES usuarios(uuid) ON DELETE CASCADE,
  matricula VARCHAR(20) UNIQUE,
  curso_uuid UUID,
  turma_uuid UUID,
  telefone VARCHAR(20),
  bio TEXT,
  linkedin_url VARCHAR(255),
  github_url VARCHAR(255),
  portfolio_url VARCHAR(255),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alunos_usuario ON alunos(usuario_uuid);
CREATE INDEX idx_alunos_matricula ON alunos(matricula);
CREATE INDEX idx_alunos_curso ON alunos(curso_uuid);
CREATE INDEX idx_alunos_turma ON alunos(turma_uuid);

-- Tabela de professores (dados específicos)
CREATE TABLE professores (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_uuid UUID NOT NULL UNIQUE REFERENCES usuarios(uuid) ON DELETE CASCADE,
  matricula VARCHAR(20) UNIQUE,
  departamento_uuid UUID,
  especialidade VARCHAR(255),
  telefone VARCHAR(20),
  bio TEXT,
  linkedin_url VARCHAR(255),
  lattes_url VARCHAR(255),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_professores_usuario ON professores(usuario_uuid);
CREATE INDEX idx_professores_matricula ON professores(matricula);
CREATE INDEX idx_professores_departamento ON professores(departamento_uuid);

-- ============================================================================
-- TABELAS DE ESTRUTURA ACADÊMICA
-- ============================================================================

-- Tabela de cursos
CREATE TABLE cursos (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  sigla VARCHAR(20),
  carga_horaria INTEGER,
  modalidade VARCHAR(50) CHECK (modalidade IN ('TÉCNICO', 'GRADUAÇÃO', 'PÓS-GRADUAÇÃO', 'QUALIFICAÇÃO')),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cursos_nome ON cursos(nome);
CREATE INDEX idx_cursos_ativo ON cursos(ativo);

-- Tabela de turmas
CREATE TABLE turmas (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_uuid UUID NOT NULL REFERENCES cursos(uuid) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  ano INTEGER NOT NULL,
  semestre INTEGER CHECK (semestre IN (1, 2)),
  turno VARCHAR(20) CHECK (turno IN ('MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL')),
  data_inicio DATE,
  data_fim DATE,
  ativa BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(curso_uuid, codigo, ano, semestre)
);

CREATE INDEX idx_turmas_curso ON turmas(curso_uuid);
CREATE INDEX idx_turmas_ativa ON turmas(ativa);

-- Tabela de unidades curriculares
CREATE TABLE unidades_curriculares (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_uuid UUID NOT NULL REFERENCES cursos(uuid) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50),
  carga_horaria INTEGER,
  periodo INTEGER,
  ementa TEXT,
  ativa BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_unidades_curso ON unidades_curriculares(curso_uuid);
CREATE INDEX idx_unidades_periodo ON unidades_curriculares(periodo);

-- Tabela de departamentos
CREATE TABLE departamentos (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  sigla VARCHAR(20) UNIQUE,
  descricao TEXT,
  cor_hex VARCHAR(7),
  icone VARCHAR(50),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_departamentos_nome ON departamentos(nome);
CREATE INDEX idx_departamentos_ativo ON departamentos(ativo);

-- ============================================================================
-- TABELAS DE PROJETOS
-- ============================================================================

-- Tabela principal de projetos
CREATE TABLE projetos (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  descricao_curta VARCHAR(500),
  banner_url TEXT,
  fase_atual VARCHAR(50) DEFAULT 'IDEACAO' CHECK (fase_atual IN ('IDEACAO', 'MODELAGEM', 'PROTOTIPAGEM', 'IMPLEMENTACAO')),
  status VARCHAR(20) DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO', 'PUBLICADO', 'ARQUIVADO')),
  lider_uuid UUID NOT NULL REFERENCES usuarios(uuid),
  departamento_uuid UUID REFERENCES departamentos(uuid),
  visibilidade VARCHAR(20) DEFAULT 'PUBLICO' CHECK (visibilidade IN ('PUBLICO', 'PRIVADO', 'RESTRITO')),
  curtidas_count INTEGER DEFAULT 0,
  visualizacoes_count INTEGER DEFAULT 0,
  arquivado BOOLEAN DEFAULT FALSE,
  data_publicacao TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  CONSTRAINT titulo_unico UNIQUE(titulo)
);

CREATE INDEX idx_projetos_lider ON projetos(lider_uuid);
CREATE INDEX idx_projetos_departamento ON projetos(departamento_uuid);
CREATE INDEX idx_projetos_fase ON projetos(fase_atual);
CREATE INDEX idx_projetos_status ON projetos(status);
CREATE INDEX idx_projetos_titulo ON projetos(titulo);

-- Tabela de relação projeto-aluno (autores)
CREATE TABLE projetos_alunos (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_uuid UUID NOT NULL REFERENCES projetos(uuid) ON DELETE CASCADE,
  aluno_uuid UUID NOT NULL REFERENCES alunos(uuid) ON DELETE CASCADE,
  papel VARCHAR(20) DEFAULT 'AUTOR' CHECK (papel IN ('LIDER', 'AUTOR', 'COLABORADOR')),
  adicionado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(projeto_uuid, aluno_uuid)
);

CREATE INDEX idx_projetos_alunos_projeto ON projetos_alunos(projeto_uuid);
CREATE INDEX idx_projetos_alunos_aluno ON projetos_alunos(aluno_uuid);

-- Tabela de relação projeto-professor (orientadores)
CREATE TABLE projetos_professores (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_uuid UUID NOT NULL REFERENCES projetos(uuid) ON DELETE CASCADE,
  professor_uuid UUID NOT NULL REFERENCES professores(uuid) ON DELETE CASCADE,
  papel VARCHAR(20) DEFAULT 'ORIENTADOR' CHECK (papel IN ('ORIENTADOR', 'COORIENTADOR', 'AVALIADOR')),
  adicionado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(projeto_uuid, professor_uuid)
);

CREATE INDEX idx_projetos_professores_projeto ON projetos_professores(projeto_uuid);
CREATE INDEX idx_projetos_professores_professor ON projetos_professores(professor_uuid);

-- Tabela de etapas do projeto (fases personalizadas)
CREATE TABLE etapas_projeto (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_uuid UUID NOT NULL REFERENCES projetos(uuid) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA')),
  data_inicio DATE,
  data_fim DATE,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(projeto_uuid, ordem)
);

CREATE INDEX idx_etapas_projeto ON etapas_projeto(projeto_uuid);
CREATE INDEX idx_etapas_ordem ON etapas_projeto(ordem);

-- Tabela de anexos das etapas
CREATE TABLE anexos_etapas (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etapa_uuid UUID NOT NULL REFERENCES etapas_projeto(uuid) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  arquivo_url TEXT NOT NULL,
  tipo_arquivo VARCHAR(100),
  tamanho_bytes BIGINT,
  upload_por_uuid UUID REFERENCES usuarios(uuid),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_anexos_etapa ON anexos_etapas(etapa_uuid);
CREATE INDEX idx_anexos_upload_por ON anexos_etapas(upload_por_uuid);

-- Tabela de tecnologias
CREATE TABLE tecnologias (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  categoria VARCHAR(50),
  cor_hex VARCHAR(7),
  icone VARCHAR(50),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tecnologias_nome ON tecnologias(nome);
CREATE INDEX idx_tecnologias_categoria ON tecnologias(categoria);

-- Tabela de relação projeto-tecnologia
CREATE TABLE projetos_tecnologias (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_uuid UUID NOT NULL REFERENCES projetos(uuid) ON DELETE CASCADE,
  tecnologia_uuid UUID NOT NULL REFERENCES tecnologias(uuid) ON DELETE CASCADE,
  adicionado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(projeto_uuid, tecnologia_uuid)
);

CREATE INDEX idx_projetos_tecnologias_projeto ON projetos_tecnologias(projeto_uuid);
CREATE INDEX idx_projetos_tecnologias_tecnologia ON projetos_tecnologias(tecnologia_uuid);

-- ============================================================================
-- TABELAS DE AUDITORIA E HISTÓRICO
-- ============================================================================

-- Tabela de histórico de alterações
CREATE TABLE historico_alteracoes (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_uuid UUID NOT NULL REFERENCES projetos(uuid) ON DELETE CASCADE,
  usuario_uuid UUID NOT NULL REFERENCES usuarios(uuid),
  campo_alterado VARCHAR(100),
  valor_anterior TEXT,
  valor_novo TEXT,
  acao VARCHAR(50),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_historico_projeto ON historico_alteracoes(projeto_uuid);
CREATE INDEX idx_historico_usuario ON historico_alteracoes(usuario_uuid);
CREATE INDEX idx_historico_data ON historico_alteracoes(criado_em DESC);

-- Tabela de log de progressão de fases
CREATE TABLE progressao_fases_log (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_uuid UUID NOT NULL REFERENCES projetos(uuid) ON DELETE CASCADE,
  fase_anterior VARCHAR(50),
  fase_nova VARCHAR(50) NOT NULL,
  tipo_mudanca VARCHAR(20) DEFAULT 'AUTOMATICA' CHECK (tipo_mudanca IN ('AUTOMATICA', 'MANUAL')),
  motivo TEXT,
  mudado_por_uuid UUID REFERENCES usuarios(uuid),
  data_mudanca TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_progressao_projeto ON progressao_fases_log(projeto_uuid);
CREATE INDEX idx_progressao_data ON progressao_fases_log(data_mudanca DESC);

-- ============================================================================
-- TABELAS DE NOTIFICAÇÕES
-- ============================================================================

-- Tabela de notificações
CREATE TABLE notificacoes (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_uuid UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  link VARCHAR(255),
  lida BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_uuid);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX idx_notificacoes_data ON notificacoes(criado_em DESC);

-- ============================================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tabelas relevantes
CREATE TRIGGER trigger_usuarios_updated 
  BEFORE UPDATE ON usuarios 
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_alunos_updated 
  BEFORE UPDATE ON alunos 
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_professores_updated 
  BEFORE UPDATE ON professores 
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_projetos_updated 
  BEFORE UPDATE ON projetos 
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_etapas_updated 
  BEFORE UPDATE ON etapas_projeto 
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

-- ============================================================================
-- COMENTÁRIOS NAS TABELAS (DOCUMENTAÇÃO)
-- ============================================================================

COMMENT ON TABLE usuarios IS 'Usuários do sistema (alunos, professores, admin)';
COMMENT ON TABLE alunos IS 'Dados específicos de alunos';
COMMENT ON TABLE professores IS 'Dados específicos de professores';
COMMENT ON TABLE cursos IS 'Cursos oferecidos pelo SENAI';
COMMENT ON TABLE turmas IS 'Turmas ativas e finalizadas';
COMMENT ON TABLE departamentos IS 'Departamentos SENAI (TI, Automação, etc)';
COMMENT ON TABLE projetos IS 'Projetos da vitrine';
COMMENT ON TABLE projetos_alunos IS 'Autores dos projetos';
COMMENT ON TABLE projetos_professores IS 'Orientadores dos projetos';
COMMENT ON TABLE etapas_projeto IS 'Etapas personalizadas de cada projeto';
COMMENT ON TABLE anexos_etapas IS 'Arquivos anexados às etapas';
COMMENT ON TABLE tecnologias IS 'Stack tecnológica (React, Node, etc)';
COMMENT ON TABLE projetos_tecnologias IS 'Tecnologias usadas em cada projeto';
COMMENT ON TABLE historico_alteracoes IS 'Histórico de mudanças nos projetos';
COMMENT ON TABLE progressao_fases_log IS 'Log de progressão automática/manual de fases';
COMMENT ON TABLE notificacoes IS 'Notificações síncronas para usuários';

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================
