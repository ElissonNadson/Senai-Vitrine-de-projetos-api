-- Tabela para gerenciar solicitações de arquivamento de projetos
-- Alunos solicitam arquivamento, orientadores aprovam ou negam

CREATE TABLE IF NOT EXISTS projetos_arquivados (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    
    -- Relacionamentos
    projeto_uuid UUID NOT NULL REFERENCES projetos(uuid) ON DELETE CASCADE,
    aluno_uuid UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    orientador_uuid UUID NOT NULL REFERENCES usuarios(uuid) ON DELETE CASCADE,
    
    -- Justificativas
    justificativa TEXT NOT NULL, -- Justificativa do aluno para arquivar
    justificativa_negacao TEXT, -- Justificativa do orientador caso negue
    
    -- Status da solicitação
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE' CHECK (
        status IN ('PENDENTE', 'APROVADO', 'NEGADO')
    ),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    respondido_em TIMESTAMP, -- Quando o orientador respondeu
    
    -- Índices para consultas rápidas
    CONSTRAINT fk_projeto FOREIGN KEY (projeto_uuid) REFERENCES projetos(uuid),
    CONSTRAINT fk_aluno FOREIGN KEY (aluno_uuid) REFERENCES usuarios(uuid),
    CONSTRAINT fk_orientador FOREIGN KEY (orientador_uuid) REFERENCES usuarios(uuid)
);

-- Índices para melhorar performance
CREATE INDEX idx_projetos_arquivados_projeto ON projetos_arquivados(projeto_uuid);
CREATE INDEX idx_projetos_arquivados_aluno ON projetos_arquivados(aluno_uuid);
CREATE INDEX idx_projetos_arquivados_orientador ON projetos_arquivados(orientador_uuid);
CREATE INDEX idx_projetos_arquivados_status ON projetos_arquivados(status);
CREATE INDEX idx_projetos_arquivados_created_at ON projetos_arquivados(created_at DESC);

-- Comentários para documentação
COMMENT ON TABLE projetos_arquivados IS 'Gerencia solicitações de arquivamento de projetos por alunos';
COMMENT ON COLUMN projetos_arquivados.status IS 'PENDENTE: aguardando resposta, APROVADO: projeto arquivado, NEGADO: solicitação negada';
COMMENT ON COLUMN projetos_arquivados.justificativa IS 'Justificativa do aluno para arquivar o projeto';
COMMENT ON COLUMN projetos_arquivados.justificativa_negacao IS 'Justificativa do orientador caso negue a solicitação';