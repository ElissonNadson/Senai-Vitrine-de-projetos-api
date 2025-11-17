# 🚀 Vitrine de Projetos SENAI-BA - Setup Guide

Guia completo de configuração e execução do projeto.

## ✅ Progresso da Implementação

### Steps Concluídos (1-8 de 20)

- ✅ **Step 1:** Dependências instaladas + estrutura de pastas
- ✅ **Step 2:** Schema PostgreSQL (16 tabelas) + migrations separadas
- ✅ **Step 3:** Utilitários (date-formatter, email-validator, file-upload, string)
- ✅ **Step 4:** Guards, decorators e filters
- ✅ **Step 5:** Google OAuth Strategy + JWT Strategy
- ✅ **Step 6:** auth.service.ts refatorado completamente
- ✅ **Step 7:** auth.controller.ts com endpoints OAuth
- ✅ **Step 8:** Módulo perfil (completar cadastro)

### Arquivos Criados

**Database:**
- `database/migrations/001_schema.sql` - 16 tabelas com relacionamentos
- `database/migrations/002_cursos_turmas.sql` - Cursos e turmas reais (separado)
- `database/seeds/seeds.sql` - Dados imutáveis (6 departamentos, 22 tecnologias)

**Common Utils:**
- `src/common/utils/date-formatter.util.ts` - Formatação "Há X dias"
- `src/common/utils/email-validator.util.ts` - Validação domínios SENAI
- `src/common/utils/file-upload.util.ts` - Magic numbers + Multer
- `src/common/utils/string.util.ts` - Manipulação de strings

**Guards & Decorators:**
- `src/common/guards/auth.guard.ts` - JWT validation
- `src/common/guards/roles.guard.ts` - Role-based access
- `src/common/guards/projeto-owner.guard.ts` - Ownership verification
- `src/common/decorators/roles.decorator.ts` - @Roles()
- `src/common/decorators/current-user.decorator.ts` - @CurrentUser()
- `src/common/filters/http-exception.filter.ts` - Error formatting

**Auth Module:**
- `src/modules/auth/strategies/google.strategy.ts` - Google OAuth
- `src/modules/auth/strategies/jwt.strategy.ts` - JWT validation
- `src/modules/auth/dto/auth.dto.ts` - DTOs
- `src/modules/auth/auth.service.ts` - Refatorado com OAuth
- `src/modules/auth/auth.controller.ts` - Endpoints OAuth
- `src/modules/auth/auth.module.ts` - Module configuration

**Perfil Module:**
- `src/modules/perfil/dto/perfil.dto.ts` - DTOs completar cadastro
- `src/modules/perfil/perfil.dao.ts` - Database access
- `src/modules/perfil/perfil.service.ts` - Business logic
- `src/modules/perfil/perfil.controller.ts` - Endpoints
- `src/modules/perfil/perfil.module.ts` - Module configuration

## 🔧 Setup Rápido

### 1. Instalar dependências (já feito)

```bash
npm install
```

**Dependências adicionadas:**
- `@nestjs/passport`, `passport`, `passport-google-oauth20`
- `passport-jwt`, `@types/passport-jwt`
- `multer`, `@types/multer`
- `date-fns`
- `file-type@16.5.4`

### 2. Configurar .env

Copie `.env.example` para `.env` e configure:

```env
# Google OAuth (obter em console.cloud.google.com)
GOOGLE_CLIENT_ID=seu-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=minimo-32-caracteres-aleatorios
JWT_EXPIRATION=86400

# PostgreSQL
HOST=localhost
DB_PORT=5432
DATABASE=vitrine_projetos
USERNAME=postgres
PASSWORD=sua-senha

# Outros...
UPLOAD_PATH=./uploads
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3. Criar banco e executar migrations

```bash
# Criar banco
psql -U postgres -c "CREATE DATABASE vitrine_projetos;"

# Executar migrations NA ORDEM
psql -U postgres -d vitrine_projetos -f database/migrations/001_schema.sql
psql -U postgres -d vitrine_projetos -f database/migrations/002_cursos_turmas.sql
psql -U postgres -d vitrine_projetos -f database/seeds/seeds.sql
```

**Verificar:**
```sql
-- 16 tabelas criadas
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';

-- 6 departamentos
SELECT nome, sigla FROM departamentos ORDER BY nome;

-- 22 tecnologias
SELECT COUNT(*) FROM tecnologias;
```

### 4. Executar aplicação

```bash
npm run start:dev
```

## 🔐 Configurar Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie projeto → Ative **Google+ API**
3. Credenciais → OAuth 2.0 Client ID
4. Configure URLs de redirecionamento:
   - `http://localhost:3000/auth/google/callback`
5. Copie Client ID e Secret para `.env`

## 📋 Endpoints Disponíveis

### Auth
- `GET /auth/google` - Inicia OAuth
- `GET /auth/google/callback` - Callback
- `GET /auth/me` - Dados do usuário (requer JWT)
- `POST /auth/refresh` - Renovar token
- `POST /auth/logout` - Logout

### Perfil
- `POST /perfil/completar/aluno` - Completar cadastro aluno
- `POST /perfil/completar/professor` - Completar cadastro professor
- `PATCH /perfil` - Atualizar perfil
- `GET /perfil` - Buscar perfil

## 🎯 Próximos Steps (9-20)

### Step 9-10: Módulos Acadêmicos
- Cursos (CRUD)
- Turmas (CRUD vinculado a cursos)
- Unidades Curriculares
- Dashboard (3 visões diferentes)

### Step 11-14: Core - Projetos
- Criação em 4 etapas com transações
- Upload de banner e anexos (validação magic numbers)
- Visualização com permissões
- Etapas personalizadas

### Step 15-17: Gestão e Notificações
- Edição, exclusão, transferência (com auditoria)
- Progressão automática de fases
- Notificações síncronas

### Step 18-20: Finalização
- Integração completa de auditoria
- Configuração rate limiting específico
- Documentação completa

## 🛡️ Validações Implementadas

### Domínios Email
- ✅ Alunos: `@ba.estudante.senai.br`
- ✅ Professores: `@ba.senai.br`
- ❌ Bloqueados: Gmail, Hotmail, outros SENAI

### Upload Arquivos
- ✅ Magic numbers validation (previne executáveis)
- ✅ MIME type + extensão
- ✅ Tamanhos: 5MB (imagens), 10MB (docs)

### Campos
- **Matrícula:** 5-20 chars alfanuméricos
- **Telefone:** `(XX) XXXXX-XXXX`
- **Bio:** max 500 chars
- **URLs:** validação completa

## 📊 Estrutura Database

**16 Tabelas:**
1. usuarios - Comum a todos
2. alunos - Dados específicos
3. professores - Dados específicos
4. cursos - Cursos SENAI
5. turmas - Turmas por curso
6. unidades_curriculares - UCs do curso
7. departamentos - 6 departamentos (TI, Automação, etc)
8. projetos - Projetos principais
9. projetos_alunos - Autores (N:N)
10. projetos_professores - Orientadores (N:N)
11. etapas_projeto - Etapas customizadas
12. anexos_etapas - Arquivos das etapas
13. tecnologias - Stack (React, Node, etc)
14. projetos_tecnologias - Techs usadas (N:N)
15. historico_alteracoes - Audit trail
16. progressao_fases_log - Log de progressão
17. notificacoes - Notificações síncronas

## 🔍 Testing

### Manual (MVP)
```bash
# Login OAuth
curl http://localhost:3000/auth/google

# Obter perfil (após login)
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3000/auth/me

# Completar cadastro
curl -X POST http://localhost:3000/perfil/completar/aluno \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"matricula":"202401234","telefone":"(71) 98765-4321"}'
```

## 📝 Convenções

### Arquitetura Híbrida
- **Técnico (inglês):** `common/`, `guards/`, `decorators/`
- **Domínio (português):** `modules/alunos/`, `projetos/`

### Padrões
- **DAO Pattern:** Queries isoladas
- **Transactions:** BEGIN/COMMIT/ROLLBACK
- **Auditoria:** Em ações críticas
- **DTOs:** class-validator
- **Guards:** AuthGuard, RolesGuard, ProjetoOwnerGuard

## 🐛 Troubleshooting

**Erro: relation does not exist**
→ Execute migrations na ordem: 001 → 002 → seeds

**Erro: JWT must be provided**
→ Verifique JWT_SECRET no .env

**Erro: Google OAuth failed**
→ Verifique Client ID/Secret e callback URL

**Erro: Invalid file type**
→ Validação de magic numbers ativa (previne executáveis)

## 📞 Suporte

- **Repo:** [ElissonNadson/Senai-Vitrine-de-projetos-api](https://github.com/ElissonNadson/Senai-Vitrine-de-projetos-api)
- **Documentação:** Ver `Documentação.md` (3770 linhas)
