# API Documentation - Vitrine de Projetos SENAI-BA

## Índice
- [Autenticação](#autenticação)
- [Perfil](#perfil)
- [Cursos e Turmas](#cursos-e-turmas)
- [Dashboard](#dashboard)
- [Projetos](#projetos)
- [Etapas](#etapas)
- [Upload](#upload)
- [Progressão](#progressão)
- [Notificações](#notificações)
- [Rate Limiting](#rate-limiting)
- [Códigos de Status](#códigos-de-status)

---

## Autenticação

### Google OAuth

**Iniciar autenticação**
```http
GET /auth/google
```
Redireciona para o Google OAuth. Rate limit: 5 req/min

**Callback OAuth**
```http
GET /auth/google/callback
```
Processa callback do Google e retorna token JWT.

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "João Silva",
    "email": "joao@ba.estudante.senai.br",
    "tipo": "ALUNO",
    "primeiroAcesso": true
  }
}
```

**Obter usuário atual**
```http
GET /auth/me
Authorization: Bearer <token>
```

**Renovar token**
```http
POST /auth/refresh
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Logout**
```http
POST /auth/logout
Authorization: Bearer <token>
```

---

## Perfil

### Completar Cadastro

**Aluno**
```http
POST /perfil/completar/aluno
Authorization: Bearer <token>
Content-Type: application/json

{
  "matricula": "2024001234",
  "telefone": "(71) 99999-9999",
  "bio": "Estudante de TI apaixonado por programação",
  "curso_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "turma_uuid": "660e8400-e29b-41d4-a716-446655440000"
}
```

**Docente**
```http
POST /perfil/completar/docente
Authorization: Bearer <token>
Content-Type: application/json

{
  "telefone": "(71) 99999-9999",
  "bio": "Docente de desenvolvimento web",
  "departamento_uuid": "770e8400-e29b-41d4-a716-446655440000"
}
```

**Atualizar perfil**
```http
PATCH /perfil
Authorization: Bearer <token>
Content-Type: application/json

{
  "telefone": "(71) 98888-8888",
  "bio": "Nova bio",
  "links_portfolio": ["https://github.com/usuario"]
}
```

**Buscar perfil**
```http
GET /perfil
Authorization: Bearer <token>
```

---

## Cursos e Turmas

**Listar cursos**
```http
GET /cursos?incluirInativos=false
```

**Buscar curso**
```http
GET /cursos/:uuid
GET /cursos/sigla/TDS
```

**Listar turmas**
```http
GET /turmas?cursoUuid=<uuid>&incluirInativas=false
```

**Buscar turma**
```http
GET /turmas/:uuid?incluirAlunos=true
GET /turmas/codigo/TDS-2024-1
```

---

## Dashboard

**Obter dashboard**
```http
GET /dashboard
Authorization: Bearer <token>
```

**Response (Aluno):**
```json
{
  "tipo": "ALUNO",
  "aluno": {
    "nome": "João Silva",
    "matricula": "2024001234",
    "curso": "Técnico em Desenvolvimento de Sistemas",
    "turma": "TDS-2024-1"
  },
  "projetos": [...],
  "estatisticas": {
    "projetos_lider": "2",
    "projetos_autor": "3",
    "projetos_andamento": "1",
    "projetos_concluidos": "4"
  }
}
```

---

## Projetos

### Criação em 4 Passos

**Passo 1: Informações básicas**
```http
POST /projetos/passo1
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Sistema de Gestão Escolar com IA",
  "descricao": "Um sistema completo para gestão escolar utilizando inteligência artificial para análise preditiva de desempenho dos alunos...",
  "departamento_uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "mensagem": "Rascunho criado com sucesso. Prossiga para o Passo 2."
}
```

**Passo 2: Autores**
```http
POST /projetos/:uuid/passo2
Authorization: Bearer <token>
Content-Type: application/json

{
  "autores": [
    {
      "aluno_uuid": "111e4567-e89b-12d3-a456-426614174000",
      "papel": "LIDER"
    },
    {
      "aluno_uuid": "222e4567-e89b-12d3-a456-426614174000",
      "papel": "AUTOR"
    }
  ]
}
```

**Passo 3: Orientadores e tecnologias**
```http
POST /projetos/:uuid/passo3
Authorization: Bearer <token>
Content-Type: application/json

{
  "docentes_uuids": [
    "333e4567-e89b-12d3-a456-426614174000"
  ],
  "tecnologias_uuids": [
    "444e4567-e89b-12d3-a456-426614174000",
    "555e4567-e89b-12d3-a456-426614174000"
  ],
  "objetivos": "Desenvolver sistema escalável e acessível",
  "resultados_esperados": "Melhorar eficiência da gestão em 40%"
}
```

**Passo 4: Banner e publicação**
```http
POST /projetos/:uuid/passo4
Authorization: Bearer <token>
Content-Type: application/json

{
  "banner_url": "uploads/banners/banner-123456.jpg",
  "repositorio_url": "https://github.com/usuario/projeto",
  "demo_url": "https://projeto-demo.vercel.app"
}
```

### Consulta e Gestão

**Listar projetos**
```http
GET /projetos?departamento_uuid=<uuid>&fase=EM_DESENVOLVIMENTO&tecnologia_uuid=<uuid>&busca=sistema&limit=10&offset=0
```

**Buscar projeto**
```http
GET /projetos/:uuid
Authorization: Bearer <token> (opcional)
```

**Atualizar projeto**
```http
PATCH /projetos/:uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Novo título",
  "descricao": "Nova descrição"
}
```

**Deletar projeto**
```http
DELETE /projetos/:uuid
Authorization: Bearer <token>
```

---

## Etapas

**Criar etapa**
```http
POST /etapas/projeto/:projetoUuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Implementação do módulo de autenticação",
  "descricao": "Desenvolver sistema completo de autenticação com JWT e OAuth...",
  "tipo_etapa": "DESENVOLVIMENTO"
}
```

Tipos: `PLANEJAMENTO`, `DESENVOLVIMENTO`, `TESTE`, `DOCUMENTACAO`, `APRESENTACAO`

**Listar etapas**
```http
GET /etapas/projeto/:projetoUuid
Authorization: Bearer <token>
```

**Buscar etapa**
```http
GET /etapas/:uuid
Authorization: Bearer <token>
```

**Adicionar anexos**
```http
POST /etapas/:uuid/anexos
Authorization: Bearer <token>
Content-Type: application/json

{
  "anexos": [
    {
      "url": "uploads/anexos/documento-123.pdf",
      "tipo": "DOCUMENTO",
      "descricao": "Documentação técnica"
    }
  ]
}
```

**Concluir etapa**
```http
POST /etapas/:uuid/concluir
Authorization: Bearer <token>
Content-Type: application/json

{
  "observacoes": "Implementação concluída conforme planejado"
}
```

**Feedback do orientador**
```http
POST /etapas/:uuid/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "APROVADO",
  "comentario": "Excelente trabalho! Implementação bem estruturada."
}
```

Status: `APROVADO`, `REVISAR`, `REJEITADO`

**Atualizar etapa**
```http
PATCH /etapas/:uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Novo título",
  "descricao": "Nova descrição"
}
```

**Deletar etapa**
```http
DELETE /etapas/:uuid
Authorization: Bearer <token>
```

**Deletar anexo**
```http
DELETE /etapas/anexo/:anexoUuid
Authorization: Bearer <token>
```

---

## Upload

**Upload de banner**
```http
POST /upload/banner
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <arquivo.jpg>
```

**Limites:**
- Banner: 5MB (JPG, PNG, WebP)
- Avatar: 2MB (JPG, PNG, WebP)
- Documento: 10MB (PDF, DOC, DOCX)
- Imagem: 5MB (JPG, PNG, WebP)
- Vídeo: 50MB (MP4, AVI, MOV)

**Upload de avatar**
```http
POST /upload/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <avatar.jpg>
```

**Upload de anexo**
```http
POST /upload/anexo?tipo=DOCUMENTO
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <documento.pdf>
```

Tipos: `DOCUMENTO`, `IMAGEM`, `VIDEO`

**Tipos suportados**
```http
GET /upload/tipos
Authorization: Bearer <token>
```

---

## Progressão

**Verificar progressão**
```http
GET /progressao/verificar/:projetoUuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "podeProgredir": true,
  "faseAtual": "EM_DESENVOLVIMENTO",
  "proximaFase": "EM_TESTE",
  "motivo": "Todas as 3 etapa(s) concluídas"
}
```

**Executar progressão automática**
```http
POST /progressao/automatica/:projetoUuid
Authorization: Bearer <token>
```

**Forçar progressão (admin/orientador)**
```http
POST /progressao/forcar/:projetoUuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "novaFase": "CONCLUIDO"
}
```

Fases: `RASCUNHO`, `PLANEJAMENTO`, `EM_DESENVOLVIMENTO`, `EM_TESTE`, `AGUARDANDO_REVISAO`, `CONCLUIDO`, `ARQUIVADO`

**Histórico de progressões**
```http
GET /progressao/historico/:projetoUuid
Authorization: Bearer <token>
```

**Transferir liderança**
```http
POST /progressao/transferir-lideranca/:projetoUuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "novoLiderAlunoUuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Notificações

**Listar notificações**
```http
GET /notificacoes?apenasNaoLidas=true
Authorization: Bearer <token>
```

**Contar não lidas**
```http
GET /notificacoes/nao-lidas/contar
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total": 5
}
```

**Marcar como lida**
```http
POST /notificacoes/:uuid/marcar-lida
Authorization: Bearer <token>
```

**Marcar todas como lidas**
```http
POST /notificacoes/marcar-todas-lidas
Authorization: Bearer <token>
```

**Deletar notificação**
```http
DELETE /notificacoes/:uuid
Authorization: Bearer <token>
```

---

## Rate Limiting

| Endpoint | Limite | Janela |
|----------|--------|--------|
| Autenticação (`/auth/*`) | 5 requisições | 1 minuto |
| Upload (`/upload/*`) | 20 requisições | 1 minuto |
| API Geral | 100 requisições | 1 minuto |

**Response (429 Too Many Requests):**
```json
{
  "statusCode": 429,
  "mensagem": "Muitas requisições. Tente novamente mais tarde.",
  "retryAfter": 45
}
```

---

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token inválido/ausente |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Título duplicado, email já existe |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error |

**Formato de erro padrão:**
```json
{
  "statusCode": 400,
  "campo": "email",
  "mensagem": "Email deve ser do domínio @ba.estudante.senai.br"
}
```

---

## Autenticação JWT

Todas as rotas protegidas requerem header:
```
Authorization: Bearer <token>
```

Token expira em 24 horas.

Também é emitido um cookie `token` (HTTP-only). A autenticação suporta tanto o cookie `token` quanto o header `Authorization` (mantemos suporte legado ao cookie `accessToken` apenas para compatibilidade).

---

## Validações de Domínio

**Emails permitidos:**
- Alunos: `@ba.estudante.senai.br`
- Docentes: `@ba.senai.br`

**Emails bloqueados:**
- Gmail, Hotmail, Outlook, Yahoo
- Outros estados do SENAI (exceto BA)

---

## Paginação

Endpoints que suportam paginação:
```http
GET /projetos?limit=10&offset=0
```

---

## Filtros

**Projetos:**
- `departamento_uuid`: Filtra por departamento
- `fase`: Filtra por fase do projeto
- `tecnologia_uuid`: Filtra por tecnologia
- `busca`: Busca em título e descrição

**Turmas:**
- `cursoUuid`: Filtra turmas por curso
- `incluirInativas`: Inclui turmas inativas

---

## Magic Numbers Validation

Todos os uploads são validados por **magic numbers** (bytes iniciais do arquivo) para prevenir executáveis maliciosos renomeados.

**Exemplo:**
- JPG: `FF D8 FF`
- PNG: `89 50 4E 47`
- PDF: `25 50 44 46`
