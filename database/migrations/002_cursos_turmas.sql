-- ============================================================================
-- VITRINE DE PROJETOS SENAI-BA - CURSOS E TURMAS REAIS
-- Data: 2025-11-17
-- Descrição: Dados reais de cursos e turmas existentes no SENAI-BA
-- Nota: Este arquivo é SEPARADO dos seeds (dados imutáveis do sistema)
-- ============================================================================

-- ============================================================================
-- CURSOS TÉCNICOS SENAI-BA
-- ============================================================================

INSERT INTO cursos (uuid, nome, sigla, carga_horaria, modalidade, ativo) VALUES
  (gen_random_uuid(), 'Técnico em Desenvolvimento de Sistemas', 'TDS', 1200, 'TÉCNICO', TRUE),
  (gen_random_uuid(), 'Técnico em Redes de Computadores', 'TRC', 1200, 'TÉCNICO', TRUE),
  (gen_random_uuid(), 'Técnico em Automação Industrial', 'TAI', 1200, 'TÉCNICO', TRUE),
  (gen_random_uuid(), 'Técnico em Eletromecânica', 'TEM', 1500, 'TÉCNICO', TRUE),
  (gen_random_uuid(), 'Técnico em Mecatrônica', 'TME', 1200, 'TÉCNICO', TRUE),
  (gen_random_uuid(), 'Técnico em Eletrônica', 'TEL', 1200, 'TÉCNICO', TRUE),
  (gen_random_uuid(), 'Técnico em Segurança do Trabalho', 'TST', 1200, 'TÉCNICO', TRUE),
  (gen_random_uuid(), 'Técnico em Logística', 'TLO', 800, 'TÉCNICO', TRUE),
  (gen_random_uuid(), 'Técnico em Administração', 'TAD', 800, 'TÉCNICO', TRUE),
  (gen_random_uuid(), 'Técnico em Design Gráfico', 'TDG', 1200, 'TÉCNICO', TRUE);

-- ============================================================================
-- TURMAS 2024
-- ============================================================================

-- Turmas de Desenvolvimento de Sistemas 2024
INSERT INTO turmas (uuid, curso_uuid, codigo, ano, semestre, turno, data_inicio, data_fim, ativa)
SELECT 
  gen_random_uuid(),
  c.uuid,
  'TDS-2024-1M',
  2024,
  1,
  'MATUTINO',
  '2024-02-01'::DATE,
  '2025-12-20'::DATE,
  TRUE
FROM cursos c WHERE c.sigla = 'TDS';

INSERT INTO turmas (uuid, curso_uuid, codigo, ano, semestre, turno, data_inicio, data_fim, ativa)
SELECT 
  gen_random_uuid(),
  c.uuid,
  'TDS-2024-1N',
  2024,
  1,
  'NOTURNO',
  '2024-02-01'::DATE,
  '2025-12-20'::DATE,
  TRUE
FROM cursos c WHERE c.sigla = 'TDS';

-- Turmas de Redes de Computadores 2024
INSERT INTO turmas (uuid, curso_uuid, codigo, ano, semestre, turno, data_inicio, data_fim, ativa)
SELECT 
  gen_random_uuid(),
  c.uuid,
  'TRC-2024-1N',
  2024,
  1,
  'NOTURNO',
  '2024-02-01'::DATE,
  '2025-12-20'::DATE,
  TRUE
FROM cursos c WHERE c.sigla = 'TRC';

-- Turmas de Automação Industrial 2024
INSERT INTO turmas (uuid, curso_uuid, codigo, ano, semestre, turno, data_inicio, data_fim, ativa)
SELECT 
  gen_random_uuid(),
  c.uuid,
  'TAI-2024-1M',
  2024,
  1,
  'MATUTINO',
  '2024-02-01'::DATE,
  '2025-12-20'::DATE,
  TRUE
FROM cursos c WHERE c.sigla = 'TAI';

INSERT INTO turmas (uuid, curso_uuid, codigo, ano, semestre, turno, data_inicio, data_fim, ativa)
SELECT 
  gen_random_uuid(),
  c.uuid,
  'TAI-2024-1V',
  2024,
  1,
  'VESPERTINO',
  '2024-02-01'::DATE,
  '2025-12-20'::DATE,
  TRUE
FROM cursos c WHERE c.sigla = 'TAI';

-- Turmas de Eletromecânica 2024
INSERT INTO turmas (uuid, curso_uuid, codigo, ano, semestre, turno, data_inicio, data_fim, ativa)
SELECT 
  gen_random_uuid(),
  c.uuid,
  'TEM-2024-1I',
  2024,
  1,
  'INTEGRAL',
  '2024-02-01'::DATE,
  '2026-06-30'::DATE,
  TRUE
FROM cursos c WHERE c.sigla = 'TEM';

-- Turmas de Mecatrônica 2024
INSERT INTO turmas (uuid, curso_uuid, codigo, ano, semestre, turno, data_inicio, data_fim, ativa)
SELECT 
  gen_random_uuid(),
  c.uuid,
  'TME-2024-1M',
  2024,
  1,
  'MATUTINO',
  '2024-02-01'::DATE,
  '2025-12-20'::DATE,
  TRUE
FROM cursos c WHERE c.sigla = 'TME';

-- Turmas de Segurança do Trabalho 2024
INSERT INTO turmas (uuid, curso_uuid, codigo, ano, semestre, turno, data_inicio, data_fim, ativa)
SELECT 
  gen_random_uuid(),
  c.uuid,
  'TST-2024-1N',
  2024,
  1,
  'NOTURNO',
  '2024-02-01'::DATE,
  '2025-12-20'::DATE,
  TRUE
FROM cursos c WHERE c.sigla = 'TST';

-- Turmas de Logística 2024
INSERT INTO turmas (uuid, curso_uuid, codigo, ano, semestre, turno, data_inicio, data_fim, ativa)
SELECT 
  gen_random_uuid(),
  c.uuid,
  'TLO-2024-2N',
  2024,
  2,
  'NOTURNO',
  '2024-07-15'::DATE,
  '2025-06-30'::DATE,
  TRUE
FROM cursos c WHERE c.sigla = 'TLO';

-- Turmas de Design Gráfico 2024
INSERT INTO turmas (uuid, curso_uuid, codigo, ano, semestre, turno, data_inicio, data_fim, ativa)
SELECT 
  gen_random_uuid(),
  c.uuid,
  'TDG-2024-1V',
  2024,
  1,
  'VESPERTINO',
  '2024-02-01'::DATE,
  '2025-12-20'::DATE,
  TRUE
FROM cursos c WHERE c.sigla = 'TDG';

-- ============================================================================
-- TURMAS 2025 (PREVISÃO)
-- ============================================================================

-- Turmas de Desenvolvimento de Sistemas 2025
INSERT INTO turmas (uuid, curso_uuid, codigo, ano, semestre, turno, data_inicio, data_fim, ativa)
SELECT 
  gen_random_uuid(),
  c.uuid,
  'TDS-2025-1M',
  2025,
  1,
  'MATUTINO',
  '2025-02-03'::DATE,
  '2026-12-18'::DATE,
  TRUE
FROM cursos c WHERE c.sigla = 'TDS';

INSERT INTO turmas (uuid, curso_uuid, codigo, ano, semestre, turno, data_inicio, data_fim, ativa)
SELECT 
  gen_random_uuid(),
  c.uuid,
  'TDS-2025-1N',
  2025,
  1,
  'NOTURNO',
  '2025-02-03'::DATE,
  '2026-12-18'::DATE,
  TRUE
FROM cursos c WHERE c.sigla = 'TDS';

-- Turmas de Automação Industrial 2025
INSERT INTO turmas (uuid, curso_uuid, codigo, ano, semestre, turno, data_inicio, data_fim, ativa)
SELECT 
  gen_random_uuid(),
  c.uuid,
  'TAI-2025-1M',
  2025,
  1,
  'MATUTINO',
  '2025-02-03'::DATE,
  '2026-12-18'::DATE,
  TRUE
FROM cursos c WHERE c.sigla = 'TAI';

-- ============================================================================
-- NOTA: Para adicionar novos cursos/turmas no futuro
-- ============================================================================
-- Criar arquivo: database/migrations/003_adicionar_cursos_[data].sql
-- Exemplo:
-- INSERT INTO cursos (uuid, nome, sigla, carga_horaria, modalidade, ativo) VALUES
--   (gen_random_uuid(), 'Técnico em Inteligência Artificial', 'TIA', 1200, 'TÉCNICO', TRUE);
-- ============================================================================
