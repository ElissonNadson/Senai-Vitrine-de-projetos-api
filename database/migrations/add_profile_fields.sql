-- Migration: Adicionar campos de redes sociais e endereço na tabela alunos
-- Data: 2025-12-04

-- Verificar e adicionar campos de redes sociais
DO $$
BEGIN
    -- Instagram URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alunos' AND column_name = 'instagram_url') THEN
        ALTER TABLE alunos ADD COLUMN instagram_url VARCHAR(255);
    END IF;

    -- TikTok URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alunos' AND column_name = 'tiktok_url') THEN
        ALTER TABLE alunos ADD COLUMN tiktok_url VARCHAR(255);
    END IF;

    -- Facebook URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alunos' AND column_name = 'facebook_url') THEN
        ALTER TABLE alunos ADD COLUMN facebook_url VARCHAR(255);
    END IF;

    -- Campos de endereço
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alunos' AND column_name = 'cep') THEN
        ALTER TABLE alunos ADD COLUMN cep VARCHAR(9);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alunos' AND column_name = 'logradouro') THEN
        ALTER TABLE alunos ADD COLUMN logradouro VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alunos' AND column_name = 'numero') THEN
        ALTER TABLE alunos ADD COLUMN numero VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alunos' AND column_name = 'complemento') THEN
        ALTER TABLE alunos ADD COLUMN complemento VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alunos' AND column_name = 'bairro') THEN
        ALTER TABLE alunos ADD COLUMN bairro VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alunos' AND column_name = 'cidade') THEN
        ALTER TABLE alunos ADD COLUMN cidade VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alunos' AND column_name = 'estado') THEN
        ALTER TABLE alunos ADD COLUMN estado VARCHAR(2);
    END IF;
END $$;

-- Fazer o mesmo para professores
DO $$
BEGIN
    -- Campos de endereço para professores
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professores' AND column_name = 'cep') THEN
        ALTER TABLE professores ADD COLUMN cep VARCHAR(9);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professores' AND column_name = 'logradouro') THEN
        ALTER TABLE professores ADD COLUMN logradouro VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professores' AND column_name = 'numero') THEN
        ALTER TABLE professores ADD COLUMN numero VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professores' AND column_name = 'complemento') THEN
        ALTER TABLE professores ADD COLUMN complemento VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professores' AND column_name = 'bairro') THEN
        ALTER TABLE professores ADD COLUMN bairro VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professores' AND column_name = 'cidade') THEN
        ALTER TABLE professores ADD COLUMN cidade VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professores' AND column_name = 'estado') THEN
        ALTER TABLE professores ADD COLUMN estado VARCHAR(2);
    END IF;
END $$;
