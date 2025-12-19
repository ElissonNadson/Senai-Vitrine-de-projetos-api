-- 1. Modify CHECK constraint on users table to allow 'DOCENTE'
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_tipo_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_tipo_check CHECK (tipo::text = ANY (ARRAY['ADMIN'::character varying, 'ALUNO'::character varying, 'PROFESSOR'::character varying, 'DOCENTE'::character varying]::text[]));

-- 2. Update user roles
UPDATE usuarios SET tipo = 'DOCENTE' WHERE tipo = 'PROFESSOR';

-- 3. Rename tables
ALTER TABLE IF EXISTS professores RENAME TO docentes;
ALTER TABLE IF EXISTS projetos_professores RENAME TO projetos_docentes;

-- 4. Rename sequences if they exist
ALTER SEQUENCE IF EXISTS professores_id_seq RENAME TO docentes_id_seq;

-- 5. Update column comments
COMMENT ON TABLE docentes IS 'Dados específicos de docentes';
COMMENT ON TABLE projetos_docentes IS 'Orientadores dos projetos';

-- 6. Modify CHECK constraints on role/papel in projects link table
-- We check if 'projetos_docentes' (renamed from projetos_professores) has a check constraint for 'papel'
-- Typically named 'projetos_professores_papel_check'
ALTER TABLE projetos_docentes DROP CONSTRAINT IF EXISTS projetos_professores_papel_check;
ALTER TABLE projetos_docentes ADD CONSTRAINT projetos_docentes_papel_check CHECK (papel::text = ANY (ARRAY['ORIENTADOR'::character varying, 'COORIENTADOR'::character varying, 'AVALIADOR'::character varying, 'DOCENTE'::character varying]::text[]));
-- Note: schema dump generally showed 'ORIENTADOR', 'COORIENTADOR'. If we want to change 'ORIENTADOR' to 'DOCENTE' role name, we can.
-- But the request is "referencia a professor para docente". 'ORIENTADOR' is a function, 'PROFESSOR' is a job title.
-- Usually 'PROFESSOR' is the user type. 'ORIENTADOR' is the role in the project.
-- I will NOT change 'ORIENTADOR' to 'DOCENTE' in the `papel` column unless I see 'PROFESSOR' being used there.
-- The dump says: DEFAULT 'ORIENTADOR'.
-- However, I will add 'DOCENTE' just in case code tries to set it? Or maybe not needed.
-- Wait, the previous migration attempt failed on `usuarios` table.
-- Let's stick to `usuarios` update.

-- 7. Cleaning up the check constraint to REMOVE 'PROFESSOR' if we want to be strict, but keeping 'DOCENTE' is the goal.
-- To be safe, I'm keeping 'PROFESSOR' in the array for a moment or just switching it?
-- Ideally we remove 'PROFESSOR' to enforce the change.
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_tipo_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_tipo_check CHECK (tipo::text = ANY (ARRAY['ADMIN'::character varying, 'ALUNO'::character varying, 'DOCENTE'::character varying]::text[]));