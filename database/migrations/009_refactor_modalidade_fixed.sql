-- Migration: Refactor Modalidade Schema (Fixed)
-- Description: Adds modalidade to alunos, updates values in cursos, and fixes constraints. Correct order: Drop -> Update -> Add.

-- 1. Add modalidade column to alunos
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS modalidade VARCHAR(50) DEFAULT 'Presencial';

-- 2. Drop old constraint on cursos FIRST
ALTER TABLE cursos DROP CONSTRAINT IF EXISTS cursos_modalidade_check;

-- 3. Update existing data in cursos (TÉCNICO -> Presencial)
UPDATE cursos SET modalidade = 'Presencial' WHERE modalidade = 'TÉCNICO';
UPDATE cursos SET modalidade = 'Presencial' WHERE modalidade = 'GRADUAÇÃO';
UPDATE cursos SET modalidade = 'Presencial' WHERE modalidade = 'PÓS-GRADUAÇÃO';
UPDATE cursos SET modalidade = 'Presencial' WHERE modalidade = 'QUALIFICAÇÃO';

-- 4. Add new constraint on cursos
ALTER TABLE cursos ADD CONSTRAINT cursos_modalidade_check 
CHECK (modalidade IN ('Presencial', 'Semipresencial'));

-- 5. Add constraint on alunos
ALTER TABLE alunos DROP CONSTRAINT IF EXISTS alunos_modalidade_check; -- Drop if exists to be safe
ALTER TABLE alunos ADD CONSTRAINT alunos_modalidade_check 
CHECK (modalidade IN ('Presencial', 'Semipresencial'));

-- 6. Update existing alunos to have 'Presencial' (defaults already handled by ADD COLUMN, but ensuring)
UPDATE alunos SET modalidade = 'Presencial' WHERE modalidade IS NULL;
