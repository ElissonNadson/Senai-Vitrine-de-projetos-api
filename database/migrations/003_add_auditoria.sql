-- ============================================================================
-- Migration: Sistema de Auditoria de Projetos
-- Data: 2025-12-07
-- ============================================================================

-- Tabela de auditoria para registrar todas as alterações em projetos
CREATE TABLE IF NOT EXISTS projetos_auditoria (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_uuid UUID NOT NULL REFERENCES projetos(uuid) ON DELETE CASCADE,
  usuario_uuid UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE SET NULL,
  acao VARCHAR(50) NOT NULL CHECK (acao IN (
    'CRIACAO',
    'ATUALIZACAO_PASSO1',
    'ATUALIZACAO_PASSO2',
    'ATUALIZACAO_PASSO3',
    'ATUALIZACAO_PASSO4',
    'ATUALIZACAO_PASSO5',
    'PUBLICACAO',
    'ARQUIVAMENTO',
    'EXCLUSAO',
    'ADICAO_AUTOR',
    'REMOCAO_AUTOR',
    'ADICAO_ORIENTADOR',
    'REMOCAO_ORIENTADOR',
    'UPLOAD_BANNER',
    'UPLOAD_CODIGO',
    'UPLOAD_ANEXO_FASE'
  )),
  descricao TEXT,
  dados_anteriores JSONB,  -- Estado antes da alteração
  dados_novos JSONB,       -- Estado após a alteração
  ip_address VARCHAR(45),  -- IPv4 ou IPv6
  user_agent TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_projetos_auditoria_projeto ON projetos_auditoria(projeto_uuid);
CREATE INDEX IF NOT EXISTS idx_projetos_auditoria_usuario ON projetos_auditoria(usuario_uuid);
CREATE INDEX IF NOT EXISTS idx_projetos_auditoria_acao ON projetos_auditoria(acao);
CREATE INDEX IF NOT EXISTS idx_projetos_auditoria_data ON projetos_auditoria(criado_em DESC);

-- Comentários
COMMENT ON TABLE projetos_auditoria IS 'Registra todas as alterações feitas em projetos para rastreabilidade';
COMMENT ON COLUMN projetos_auditoria.acao IS 'Tipo de ação realizada no projeto';
COMMENT ON COLUMN projetos_auditoria.dados_anteriores IS 'Estado dos dados antes da alteração (JSON)';
COMMENT ON COLUMN projetos_auditoria.dados_novos IS 'Estado dos dados após a alteração (JSON)';
COMMENT ON COLUMN projetos_auditoria.ip_address IS 'Endereço IP de onde a ação foi realizada';
COMMENT ON COLUMN projetos_auditoria.user_agent IS 'User-Agent do navegador/cliente';

-- ============================================================================
-- View para facilitar consultas de auditoria
-- ============================================================================

CREATE OR REPLACE VIEW vw_projetos_auditoria AS
SELECT 
  pa.uuid,
  pa.projeto_uuid,
  p.titulo as projeto_titulo,
  pa.usuario_uuid,
  u.nome as usuario_nome,
  u.email as usuario_email,
  u.tipo as usuario_tipo,
  pa.acao,
  pa.descricao,
  pa.dados_anteriores,
  pa.dados_novos,
  pa.ip_address,
  pa.user_agent,
  pa.criado_em
FROM projetos_auditoria pa
INNER JOIN projetos p ON pa.projeto_uuid = p.uuid
INNER JOIN usuarios u ON pa.usuario_uuid = u.uuid
ORDER BY pa.criado_em DESC;

COMMENT ON VIEW vw_projetos_auditoria IS 'View com dados completos de auditoria incluindo nomes de usuários e projetos';
