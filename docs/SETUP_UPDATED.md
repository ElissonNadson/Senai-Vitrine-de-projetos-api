# 🚀 Vitrine de Projetos SENAI-BA - Setup Guide

Guia completo de configuração e execução do projeto MVP.

---

## ✅ Status de Implementação - MVP COMPLETO (Steps 1-20)

### Step 1-2: Base e Database ✅
- Dependências instaladas (NestJS 10, PostgreSQL driver, passport, JWT, Multer, file-type, etc)
- Schema PostgreSQL com 16 tabelas e relacionamentos completos
- Migrations separadas (schema + cursos/turmas)
- Seeds imutáveis (6 departamentos, 22 tecnologias)

### Step 3-4: Common Layer ✅
- 4 Utils (date-formatter, email-validator, file-upload, string)
- 4 Guards (auth, roles, projeto-owner, rate-limit)
- 2 Decorators (roles, current-user)
- 1 Filter (http-exception)

### Step 5-7: Autenticação OAuth ✅
- GoogleStrategy com validação de domínios (@ba.estudante.senai.br, @ba.senai.br)
- JwtStrategy com payload customizado
- auth.service.ts refatorado (auto-create users, email blocking)
- auth.controller.ts com endpoints OAuth completos
- Rate limiting aplicado (5 req/min)

### Step 8: Perfil ✅
- Completar cadastro (aluno/professor)
- Atualizar perfil
- Buscar perfil próprio
- Validações específicas por tipo
- Auditoria integrada

### Step 9-10: Módulos Acadêmicos ✅
- Cursos (CRUD, listar com contagem)
- Turmas (CRUD, relacionamento com cursos)
- Dashboard (3 visões: ALUNO, PROFESSOR, ADMIN)
- Estatísticas e contadores
- Queries otimizadas com JOINs

### Step 11-12: Projetos (4 Passos) ✅
- Criação em 4 passos (titulo → autores → orientadores/tecnologias → banner/publicar)
- Validação título único (409 Conflict)
- Sistema de autores (1 LIDER obrigatório, máx 10)
- Orientadores (máx 3) e tecnologias N:N (máx 10)
- Listagem com filtros avançados (departamento, fase, tecnologia, busca)
- Censura de emails para visitantes não autenticados
- Permissões granulares (autor, orientador, admin)
- Soft delete (muda para ARQUIVADO)
- CRUD completo

### Step 13-14: Upload e Etapas ✅
- Upload com validação **magic numbers** (previne executáveis)
- Multer + file-type integration
- Banner (5MB), Avatar (2MB), Anexos (10MB/5MB/50MB)
- Etapas do projeto (5 tipos: PLANEJAMENTO, DESENVOLVIMENTO, TESTE, DOCUMENTACAO, APRESENTACAO)
- Sistema de feedback orientador (APROVADO, REVISAR, REJEITADO)
- Workflow: EM_ANDAMENTO → PENDENTE_ORIENTADOR → CONCLUIDA/EM_REVISAO
- Anexos múltiplos por etapa (DOCUMENTO, IMAGEM, VIDEO)
- Cleanup de arquivos físicos em deletes

### Step 15-17: Progressão e Notificações ✅
- Progressão automática de fases baseada em etapas concluídas
- Regras por fase:
  - PLANEJAMENTO → EM_DESENVOLVIMENTO (2+ etapas)
  - EM_DESENVOLVIMENTO → EM_TESTE (3+ etapas)
  - EM_TESTE → AGUARDANDO_REVISAO (2+ etapas)
  - AGUARDANDO_REVISAO → CONCLUIDO (1+ etapa)
- Forçar progressão (admin/orientador only)
- Transferir liderança
- Sistema de notificações database-driven
- Eventos automáticos:
  - Nova etapa criada → notifica orientadores
  - Etapa concluída → notifica orientadores
  - Feedback recebido → notifica autores
  - Progressão de fase → notifica autores
- Contador de não lidas
- Histórico de mudanças

### Step 18-20: Rate Limiting e Documentação ✅
- Rate limiting local em memória (3 guards):
  - **AuthRateLimitGuard**: 5 req/min (rotas /auth/*)
  - **UploadRateLimitGuard**: 20 req/min (rotas /upload/*)
  - **ApiRateLimitGuard**: 100 req/min (rotas gerais)
- Identificação por IP + User Agent + user.uuid se autenticado
- Response 429 com retryAfter em segundos
- Cleanup automático a cada 5 minutos
- Documentação completa da API (API_DOCUMENTATION.md)
- Setup guide atualizado (este arquivo)

---

## 📁 Arquivos Criados (60+)

### Database
- `database/migrations/001_schema.sql` - 16 tabelas
- `database/migrations/002_cursos_turmas.sql` - Dados acadêmicos
- `database/seeds/seeds.sql` - Departamentos e tecnologias

### Common Utils
- `src/common/utils/date-formatter.util.ts`
- `src/common/utils/email-validator.util.ts`
- `src/common/utils/file-upload.util.ts`
- `src/common/utils/string.util.ts`

### Common Guards
- `src/common/guards/auth.guard.ts`
- `src/common/guards/roles.guard.ts`
- `src/common/guards/projeto-owner.guard.ts`
- `src/common/guards/rate-limit.guard.ts` ✨ NOVO (3 variações)

### Common Decorators
- `src/common/decorators/roles.decorator.ts`
- `src/common/decorators/current-user.decorator.ts`

### Common Filters
- `src/common/filters/http-exception.filter.ts`

### Modules (11 módulos)

**1. Auth (refatorado com rate limiting)**
- `src/modules/auth/strategies/google.strategy.ts`
- `src/modules/auth/strategies/jwt.strategy.ts`
- `src/modules/auth/dto/auth.dto.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/auth.controller.ts` ✨ UPDATED (rate limiting)
- `src/modules/auth/auth.module.ts`

**2. Perfil**
- `src/modules/perfil/dto/perfil.dto.ts`
- `src/modules/perfil/perfil.dao.ts`
- `src/modules/perfil/perfil.service.ts`
- `src/modules/perfil/perfil.controller.ts`
- `src/modules/perfil/perfil.module.ts`

**3. Cursos**
- `src/modules/cursos/cursos.dao.ts`
- `src/modules/cursos/cursos.service.ts`
- `src/modules/cursos/cursos.controller.ts`
- `src/modules/cursos/cursos.module.ts`

**4. Turmas**
- `src/modules/turmas/turmas.dao.ts`
- `src/modules/turmas/turmas.service.ts`
- `src/modules/turmas/turmas.controller.ts`
- `src/modules/turmas/turmas.module.ts`

**5. Dashboard**
- `src/modules/dashboard/dashboard.dao.ts`
- `src/modules/dashboard/dashboard.service.ts`
- `src/modules/dashboard/dashboard.controller.ts`
- `src/modules/dashboard/dashboard.module.ts`

**6. Projetos**
- `src/modules/projetos/dto/create-projeto.dto.ts`
- `src/modules/projetos/projetos.dao.ts` (400+ linhas)
- `src/modules/projetos/projetos.service.ts` (500+ linhas)
- `src/modules/projetos/projetos.controller.ts`
- `src/modules/projetos/projetos.module.ts`

**7. Upload (com rate limiting)**
- `src/modules/upload/upload.service.ts`
- `src/modules/upload/upload.controller.ts` ✨ UPDATED (rate limiting)
- `src/modules/upload/upload.module.ts`

**8. Etapas**
- `src/modules/etapas/dto/create-etapa.dto.ts`
- `src/modules/etapas/etapas.dao.ts`
- `src/modules/etapas/etapas.service.ts` (450+ linhas)
- `src/modules/etapas/etapas.controller.ts`
- `src/modules/etapas/etapas.module.ts`

**9. Progressao**
- `src/modules/progressao/progressao.dao.ts`
- `src/modules/progressao/progressao.service.ts`
- `src/modules/progressao/progressao.controller.ts`
- `src/modules/progressao/progressao.module.ts`

**10. Notificacoes**
- `src/modules/notificacoes/dto/notificacao.dto.ts`
- `src/modules/notificacoes/notificacoes.dao.ts`
- `src/modules/notificacoes/notificacoes.service.ts`
- `src/modules/notificacoes/notificacoes.controller.ts`
- `src/modules/notificacoes/notificacoes.module.ts`

**11. Auditoria** (já existente, integrado)

### Root Files
- `.env.example` (todas variáveis necessárias)
- `API_DOCUMENTATION.md` ✨ NOVO (documentação completa)
- `SETUP_UPDATED.md` ✨ NOVO (este arquivo)

---

## 🛠️ Como Executar o Projeto

### 1. Instalar Dependências
```powershell
npm install
```

### 2. Configurar Banco de Dados PostgreSQL
```bash
# Criar banco
createdb vitrine_projetos

# Executar migrations na ordem
psql -U seu_usuario -d vitrine_projetos -f database/migrations/001_schema.sql
psql -U seu_usuario -d vitrine_projetos -f database/migrations/002_cursos_turmas.sql
psql -U seu_usuario -d vitrine_projetos -f database/seeds/seeds.sql
```

### 3. Configurar Variáveis de Ambiente
Copiar `.env.example` para `.env` e preencher:

```env
# Google OAuth (obter em https://console.cloud.google.com)
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=seu_secret_super_seguro_aqui_min_32_chars
JWT_EXPIRATION=86400

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=seu_usuario
POSTGRES_PASSWORD=sua_senha
POSTGRES_DB=vitrine_projetos

# Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE_MB=50

# CORS
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Node
NODE_ENV=development
PORT=3000
```

### 4. Criar Diretórios de Upload
```powershell
mkdir uploads\banners
mkdir uploads\avatars
mkdir uploads\anexos
```

### 5. Iniciar Servidor
```powershell
# Desenvolvimento (com hot-reload)
npm run start:dev

# Produção
npm run build
npm run start:prod
```

### 6. Testar API
1. Acessar `http://localhost:3000/auth/google`
2. Login com email `@ba.estudante.senai.br` ou `@ba.senai.br`
3. Completar cadastro:
   - **Aluno**: `POST /perfil/completar/aluno`
   - **Professor**: `POST /perfil/completar/professor`
4. Consultar documentação completa: **`API_DOCUMENTATION.md`**

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico
- **Backend**: NestJS 10, TypeScript
- **Database**: PostgreSQL 15+ (Pool direto, **sem ORM**)
- **Auth**: Google OAuth 2.0 + JWT (24h de validade)
- **Upload**: Multer + file-type (magic numbers validation)
- **Validação**: class-validator + Zod
- **Queue**: BullMQ + Redis (configurado, não usado no MVP)

### Padrões Implementados
- **DAO Pattern**: Camada de acesso a dados isolada
- **Transaction Pattern**: BEGIN/COMMIT/ROLLBACK em operações críticas
- **Auditoria**: Integrada em todas as ações importantes (LOGIN, CRIAR_PROJETO, COMPLETAR_CADASTRO, etc)
- **Rate Limiting**: Local em memória (auth, upload, api geral)
- **Hybrid Naming**: Common/ inglês, Modules/ português

### Segurança
✅ **Magic numbers validation** (previne executáveis renomeados)  
✅ **Domain validation** (apenas @ba.estudante.senai.br e @ba.senai.br)  
✅ **Email censoring** para visitantes não autenticados  
✅ **Permissões granulares** (autor, orientador, admin)  
✅ **Rate limiting** por IP + User Agent + UUID  
✅ **JWT com expiração** (24h)  
✅ **Soft delete** (ARQUIVADO)  
✅ **Transações** para consistência de dados

---

## 📡 Endpoints Disponíveis (Resumo)

### 🔐 Autenticação (rate limit: 5/min)
- `GET /auth/google` - Inicia OAuth
- `GET /auth/google/callback` - Callback OAuth
- `GET /auth/me` - Usuário atual
- `POST /auth/refresh` - Renovar token
- `POST /auth/logout` - Logout

### 👤 Perfil
- `POST /perfil/completar/aluno`
- `POST /perfil/completar/professor`
- `PATCH /perfil`
- `GET /perfil`

### 🎓 Cursos e Turmas
- `GET /cursos`
- `GET /cursos/:uuid`
- `GET /turmas?cursoUuid=...`
- `GET /turmas/:uuid`

### 📊 Dashboard
- `GET /dashboard` (3 visões automáticas)

### 📁 Projetos (4 passos)
- `POST /projetos/passo1` - Criar rascunho
- `POST /projetos/:uuid/passo2` - Adicionar autores
- `POST /projetos/:uuid/passo3` - Orientadores + tecnologias
- `POST /projetos/:uuid/passo4` - Banner + publicar
- `GET /projetos` - Listar com filtros
- `GET /projetos/:uuid`
- `PATCH /projetos/:uuid`
- `DELETE /projetos/:uuid`

### ✅ Etapas
- `POST /etapas/projeto/:projetoUuid`
- `GET /etapas/projeto/:projetoUuid`
- `GET /etapas/:uuid`
- `POST /etapas/:uuid/anexos`
- `POST /etapas/:uuid/concluir`
- `POST /etapas/:uuid/feedback`
- `PATCH /etapas/:uuid`
- `DELETE /etapas/:uuid`
- `DELETE /etapas/anexo/:anexoUuid`

### 📤 Upload (rate limit: 20/min)
- `POST /upload/banner`
- `POST /upload/avatar`
- `POST /upload/anexo?tipo=...`
- `GET /upload/tipos`

### 📈 Progressão
- `GET /progressao/verificar/:projetoUuid`
- `POST /progressao/automatica/:projetoUuid`
- `POST /progressao/forcar/:projetoUuid`
- `GET /progressao/historico/:projetoUuid`
- `POST /progressao/transferir-lideranca/:projetoUuid`

### 🔔 Notificações
- `GET /notificacoes`
- `GET /notificacoes/nao-lidas/contar`
- `POST /notificacoes/:uuid/marcar-lida`
- `POST /notificacoes/marcar-todas-lidas`
- `DELETE /notificacoes/:uuid`

**📖 Documentação completa:** `API_DOCUMENTATION.md`

---

## 🚀 Fluxo Completo de Uso

### 1. Cadastro e Autenticação
1. Usuário acessa `/auth/google`
2. Google OAuth valida email (@ba.estudante.senai.br ou @ba.senai.br)
3. Sistema cria usuário automaticamente com tipo baseado no domínio
4. Retorna JWT (24h de validade)
5. Usuário completa cadastro (`/perfil/completar/aluno` ou `/perfil/completar/professor`)

### 2. Criação de Projeto (4 Passos)
1. **Passo 1**: Aluno cria rascunho (título único, descrição, departamento) → Auto-adicionado como LIDER
2. **Passo 2**: Define autores (1 LIDER obrigatório, máx 10 autores)
3. **Passo 3**: Adiciona orientadores (máx 3) e tecnologias (máx 10), objetivos, resultados esperados
4. **Passo 4**: Faz upload do banner e publica → Status muda de RASCUNHO para PLANEJAMENTO

### 3. Desenvolvimento do Projeto
1. Autores/orientadores criam **etapas** (5 tipos: PLANEJAMENTO, DESENVOLVIMENTO, TESTE, DOCUMENTACAO, APRESENTACAO)
2. Autor adiciona **anexos** (documentos, imagens, vídeos) com magic number validation
3. Autor **conclui** etapa → Status: PENDENTE_ORIENTADOR → Orientadores recebem notificação
4. Orientador dá **feedback** (APROVADO/REVISAR/REJEITADO) → Autores recebem notificação
5. Se APROVADO → Status: CONCLUIDA

### 4. Progressão Automática
Sistema verifica condições após cada etapa concluída:
- **PLANEJAMENTO** → **EM_DESENVOLVIMENTO**: 2+ etapas concluídas, 0 pendentes
- **EM_DESENVOLVIMENTO** → **EM_TESTE**: 3+ etapas concluídas, 0 pendentes
- **EM_TESTE** → **AGUARDANDO_REVISAO**: 2+ etapas concluídas, 0 pendentes
- **AGUARDANDO_REVISAO** → **CONCLUIDO**: 1+ etapa concluída, 0 pendentes

### 5. Notificações
- **Autores** recebem quando orientador dá feedback
- **Autores** recebem quando projeto progride de fase
- **Orientadores** recebem quando nova etapa é criada
- **Orientadores** recebem quando etapa é concluída

---

## 🔧 Troubleshooting

### ❌ Erro: "Cannot find module 'file-type'"
```powershell
npm install file-type@16.5.4
```

### ❌ Erro: "Cannot find module '@nestjs/platform-express'"
```powershell
npm install @nestjs/platform-express
```

### ❌ Erro: "Cannot find module 'passport-google-oauth20'"
```powershell
npm install passport-google-oauth20 @types/passport-google-oauth20
npm install passport-jwt @types/passport-jwt
```

### ❌ Erro: JWT Strategy não funciona
Verificar se `JWT_SECRET` está definido no `.env` (mínimo 32 caracteres)

### ❌ Erro: Google OAuth redireciona mas não retorna token
1. Verificar se `GOOGLE_CALLBACK_URL` no `.env` corresponde ao configurado no Google Console
2. Verificar se domínios autorizados incluem `http://localhost:3000`
3. Verificar se `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão corretos

### ❌ Erro: Upload falha
1. Verificar se diretórios existem:
   ```powershell
   mkdir uploads\banners, uploads\avatars, uploads\anexos
   ```
2. Verificar permissões de escrita no diretório
3. Verificar tamanho do arquivo (limites: Banner 5MB, Avatar 2MB, Documento 10MB, Imagem 5MB, Video 50MB)
4. Verificar se arquivo não é executável (magic numbers validation)

### ❌ Erro: Rate limit 429 Too Many Requests
Aguardar tempo especificado em `retryAfter` (segundos). Limites:
- Auth: 5 req/min
- Upload: 20 req/min
- API Geral: 100 req/min

### ❌ Erro: 409 Conflict - Título duplicado
Escolher título único para o projeto (case-insensitive)

### ❌ Erro: Database connection failed
1. Verificar credenciais PostgreSQL no `.env`
2. Verificar se serviço PostgreSQL está rodando:
   ```powershell
   Get-Service -Name postgresql*
   ```
3. Testar conexão:
   ```bash
   psql -U seu_usuario -d vitrine_projetos
   ```

### ❌ Erro: Email não autorizado
Apenas emails `@ba.estudante.senai.br` e `@ba.senai.br` são permitidos. Outros estados do SENAI e provedores públicos (Gmail, Hotmail, etc) são bloqueados.

---

## 📊 Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| **200** | Sucesso |
| **201** | Criado com sucesso |
| **400** | Bad Request - Dados inválidos |
| **401** | Unauthorized - Token inválido/ausente |
| **403** | Forbidden - Sem permissão |
| **404** | Not Found - Recurso não encontrado |
| **409** | Conflict - Título duplicado, email já existe |
| **429** | Too Many Requests - Rate limit excedido |
| **500** | Internal Server Error |

---

## 🎉 MVP Finalizado

Todos os 20 steps foram completados com sucesso! O sistema está pronto para:

✅ Autenticação OAuth com Google  
✅ Cadastro de alunos e professores  
✅ Criação de projetos em 4 passos  
✅ Upload de arquivos com validação de segurança  
✅ Gestão de etapas com feedback de orientadores  
✅ Progressão automática de fases  
✅ Sistema de notificações  
✅ Rate limiting para segurança  
✅ Dashboard personalizado por tipo de usuário  
✅ Auditoria completa  

**Próximos passos sugeridos:**
1. Testes de integração completos
2. Deploy em ambiente de staging
3. Documentação Swagger/OpenAPI (opcional)
4. Monitoramento e logs (Sentry, DataDog)
5. Backup automatizado do PostgreSQL
6. Implementação de WebSockets para notificações em tempo real (futuro)

---

**Developed with ❤️ by SENAI-BA Team**
