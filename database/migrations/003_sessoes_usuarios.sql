-- Migração: Criar tabela de sessões de usuários
-- Data: 2025-12-07
-- Descrição: Tabela para rastrear sessões ativas de usuários

CREATE TABLE IF NOT EXISTS sessoes_usuarios (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_uuid UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,  -- Hash SHA-256 do token (nunca armazenar token raw!)
  ip_address VARCHAR(45),           -- Suporta IPv4 e IPv6
  user_agent TEXT,
  navegador VARCHAR(100),
  sistema_operacional VARCHAR(100),
  dispositivo VARCHAR(50),          -- Desktop, Mobile, Tablet
  localizacao VARCHAR(255),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_acesso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
  ativo BOOLEAN DEFAULT TRUE
);

-- Índices para otimização de queries
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes_usuarios(usuario_uuid);
CREATE INDEX IF NOT EXISTS idx_sessoes_token_hash ON sessoes_usuarios(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessoes_ativo ON sessoes_usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_sessoes_expira ON sessoes_usuarios(expira_em);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_ativo ON sessoes_usuarios(usuario_uuid, ativo);

-- Comentários
COMMENT ON TABLE sessoes_usuarios IS 'Tabela para rastrear sessões ativas de usuários';
COMMENT ON COLUMN sessoes_usuarios.token_hash IS 'Hash SHA-256 do JWT token para identificação segura';
COMMENT ON COLUMN sessoes_usuarios.dispositivo IS 'Tipo de dispositivo: Desktop, Mobile, Tablet';
