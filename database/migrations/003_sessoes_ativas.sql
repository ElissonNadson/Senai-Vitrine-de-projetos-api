-- =============================================
-- Migration: 003_sessoes_ativas.sql
-- Descrição: Tabela para gerenciamento de sessões ativas dos usuários
-- Data: 2024-12-06
-- =============================================

-- Tabela de sessões de usuários
CREATE TABLE IF NOT EXISTS sessoes_usuarios (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_uuid UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,  -- Hash SHA-256 do token (segurança)
    ip_address VARCHAR(45),           -- Suporta IPv4 e IPv6
    user_agent TEXT,                  -- User-Agent completo
    navegador VARCHAR(100),           -- Ex: Chrome 120
    sistema_operacional VARCHAR(100), -- Ex: Windows 11
    dispositivo VARCHAR(50),          -- Desktop, Mobile, Tablet
    localizacao VARCHAR(255),         -- Cidade/País baseado no IP
    criado_em TIMESTAMP DEFAULT NOW(),
    ultimo_acesso TIMESTAMP DEFAULT NOW(),
    expira_em TIMESTAMP NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes_usuarios(usuario_uuid);
CREATE INDEX IF NOT EXISTS idx_sessoes_token_hash ON sessoes_usuarios(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessoes_ativo ON sessoes_usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_sessoes_expira ON sessoes_usuarios(expira_em);

-- Comentários na tabela
COMMENT ON TABLE sessoes_usuarios IS 'Tabela para rastreamento de sessões ativas dos usuários';
COMMENT ON COLUMN sessoes_usuarios.token_hash IS 'Hash SHA-256 do token JWT para identificação segura';
COMMENT ON COLUMN sessoes_usuarios.ip_address IS 'Endereço IP do cliente (suporta IPv4 e IPv6)';
COMMENT ON COLUMN sessoes_usuarios.dispositivo IS 'Tipo de dispositivo: Desktop, Mobile ou Tablet';
