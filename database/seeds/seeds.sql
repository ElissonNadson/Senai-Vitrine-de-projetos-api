-- ============================================================================
-- VITRINE DE PROJETOS SENAI-BA - SEEDS (DADOS IMUTÁVEIS DO SISTEMA)
-- Data: 2025-11-17
-- Descrição: Dados de referência do sistema (departamentos e tecnologias)
-- Nota: Este arquivo contém APENAS dados imutáveis, não incluir cursos/turmas
-- ============================================================================

-- ============================================================================
-- DEPARTAMENTOS SENAI-BA (5 departamentos principais)
-- ============================================================================

INSERT INTO departamentos (uuid, nome, sigla, descricao, cor_hex, icone, ativo) VALUES
  (gen_random_uuid(), 
   'Automação', 
   'AUTO', 
   'Sistemas automatizados, controladores, IoT e robótica industrial',
   '#10B981',
   'settings',
   TRUE),
  
  (gen_random_uuid(), 
   'Manutenção', 
   'MANUT', 
   'Manutenção industrial, sistemas elétricos e mecânicos',
   '#F59E0B',
   'wrench',
   TRUE),
  
  (gen_random_uuid(), 
   'Gestão e Tecnologia da Informação', 
   'GTI', 
   'Gestão, administração, desenvolvimento de software e tecnologia da informação',
   '#3B82F6',
   'briefcase',
   TRUE),
  
  (gen_random_uuid(), 
   'Química, Segurança e Edificações', 
   'QSE', 
   'Processos químicos, segurança do trabalho e construção civil',
   '#8B5CF6',
   'flask',
   TRUE),
  
  (gen_random_uuid(), 
   'Gratuidade', 
   'GRAT', 
   'Programas de gratuidade e projetos sociais',
   '#EC4899',
   'heart',
   TRUE);

-- ============================================================================
-- TECNOLOGIAS (22 tecnologias principais)
-- ============================================================================

-- Frameworks e Bibliotecas Frontend
INSERT INTO tecnologias (uuid, nome, categoria, cor_hex, icone, ativo) VALUES
  (gen_random_uuid(), 'React', 'Frontend', '#61DAFB', 'react', TRUE),
  (gen_random_uuid(), 'Vue.js', 'Frontend', '#4FC08D', 'vuejs', TRUE),
  (gen_random_uuid(), 'Angular', 'Frontend', '#DD0031', 'angular', TRUE),
  (gen_random_uuid(), 'Next.js', 'Frontend', '#000000', 'nextjs', TRUE);

-- Backend e Frameworks
INSERT INTO tecnologias (uuid, nome, categoria, cor_hex, icone, ativo) VALUES
  (gen_random_uuid(), 'Node.js', 'Backend', '#339933', 'nodejs', TRUE),
  (gen_random_uuid(), 'NestJS', 'Backend', '#E0234E', 'nestjs', TRUE),
  (gen_random_uuid(), 'Express', 'Backend', '#000000', 'express', TRUE),
  (gen_random_uuid(), 'Python', 'Backend', '#3776AB', 'python', TRUE),
  (gen_random_uuid(), 'Java', 'Backend', '#007396', 'java', TRUE),
  (gen_random_uuid(), 'C++', 'Backend', '#00599C', 'cplusplus', TRUE);

-- Linguagens
INSERT INTO tecnologias (uuid, nome, categoria, cor_hex, icone, ativo) VALUES
  (gen_random_uuid(), 'TypeScript', 'Linguagem', '#3178C6', 'typescript', TRUE),
  (gen_random_uuid(), 'JavaScript', 'Linguagem', '#F7DF1E', 'javascript', TRUE);

-- Bancos de Dados
INSERT INTO tecnologias (uuid, nome, categoria, cor_hex, icone, ativo) VALUES
  (gen_random_uuid(), 'PostgreSQL', 'Database', '#336791', 'postgresql', TRUE),
  (gen_random_uuid(), 'MySQL', 'Database', '#4479A1', 'mysql', TRUE),
  (gen_random_uuid(), 'MongoDB', 'Database', '#47A248', 'mongodb', TRUE),
  (gen_random_uuid(), 'Redis', 'Database', '#DC382D', 'redis', TRUE);

-- DevOps e Infraestrutura
INSERT INTO tecnologias (uuid, nome, categoria, cor_hex, icone, ativo) VALUES
  (gen_random_uuid(), 'Docker', 'DevOps', '#2496ED', 'docker', TRUE),
  (gen_random_uuid(), 'Kubernetes', 'DevOps', '#326CE5', 'kubernetes', TRUE),
  (gen_random_uuid(), 'AWS', 'Cloud', '#FF9900', 'aws', TRUE),
  (gen_random_uuid(), 'Azure', 'Cloud', '#0078D4', 'azure', TRUE);

-- IoT e Embarcados
INSERT INTO tecnologias (uuid, nome, categoria, cor_hex, icone, ativo) VALUES
  (gen_random_uuid(), 'Arduino', 'IoT', '#00979D', 'arduino', TRUE),
  (gen_random_uuid(), 'ESP32', 'IoT', '#E7352C', 'microchip', TRUE);

-- ============================================================================
-- VERIFICAÇÃO DE DADOS INSERIDOS
-- ============================================================================

-- Contar departamentos (deve retornar 5)
DO $$
DECLARE
  dept_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dept_count FROM departamentos;
  RAISE NOTICE '✓ Departamentos inseridos: %', dept_count;
  
  IF dept_count != 5 THEN
    RAISE EXCEPTION 'Erro: Esperado 5 departamentos, encontrado %', dept_count;
  END IF;
END $$;

-- Contar tecnologias (deve retornar 22)
DO $$
DECLARE
  tech_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tech_count FROM tecnologias;
  RAISE NOTICE '✓ Tecnologias inseridas: %', tech_count;
  
  IF tech_count != 22 THEN
    RAISE EXCEPTION 'Erro: Esperado 22 tecnologias, encontrado %', tech_count;
  END IF;
END $$;

-- ============================================================================
-- LISTAGEM DOS DADOS INSERIDOS (PARA CONFIRMAÇÃO)
-- ============================================================================

-- Listar departamentos
SELECT 
  nome,
  sigla,
  cor_hex,
  CASE WHEN ativo THEN '✓' ELSE '✗' END as status
FROM departamentos
ORDER BY nome;

-- Listar tecnologias por categoria
SELECT 
  categoria,
  COUNT(*) as quantidade,
  string_agg(nome, ', ' ORDER BY nome) as tecnologias
FROM tecnologias
WHERE ativo = TRUE
GROUP BY categoria
ORDER BY categoria;

-- ============================================================================
-- FIM DOS SEEDS
-- ============================================================================

-- NOTA IMPORTANTE:
-- Este arquivo é IMUTÁVEL após primeira execução
-- Novos cursos/turmas devem ser adicionados em migrations separadas
-- Exemplo: database/migrations/003_adicionar_novos_cursos.sql
-- ============================================================================
