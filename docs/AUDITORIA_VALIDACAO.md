# 🔍 Sistema de Auditoria e Validação de Projetos

## 📋 Visão Geral

Implementamos um **sistema completo de auditoria** que registra todas as alterações feitas em projetos, além de **validação de usuários** antes de adicionar à equipe.

---

## 🎯 Funcionalidades Implementadas

### 1️⃣ **Auditoria Automática**
Toda alteração em projetos é automaticamente registrada com:
- ✅ Quem fez a alteração (usuário)
- ✅ Quando foi feita (timestamp)
- ✅ Que tipo de ação (criação, atualização, publicação, etc.)
- ✅ Dados antes da alteração
- ✅ Dados depois da alteração
- ✅ IP e User-Agent

### 2️⃣ **Validação de Equipe**
Antes de adicionar alunos e professores ao projeto:
- ✅ Valida se os UUIDs existem no banco
- ✅ Retorna informações completas dos usuários válidos
- ✅ Lista quais UUIDs são inválidos
- ✅ Impede adicionar usuários inexistentes

---

## 📊 Estrutura do Banco

### **Tabela `projetos_auditoria`**

```sql
CREATE TABLE projetos_auditoria (
  uuid UUID PRIMARY KEY,
  projeto_uuid UUID NOT NULL,
  usuario_uuid UUID NOT NULL,
  acao VARCHAR(50) NOT NULL,
  descricao TEXT,
  dados_anteriores JSONB,  -- Estado ANTES da alteração
  dados_novos JSONB,       -- Estado DEPOIS da alteração
  ip_address VARCHAR(45),
  user_agent TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);
```

### **Tipos de Ações Registradas**

| Ação | Quando Ocorre |
|------|---------------|
| `CRIACAO` | Projeto é criado (Passo 1) |
| `ATUALIZACAO_PASSO1` | Título, descrição ou categoria alterados |
| `ATUALIZACAO_PASSO2` | Informações acadêmicas alteradas |
| `ATUALIZACAO_PASSO3` | Equipe (autores/orientadores) alterada |
| `ATUALIZACAO_PASSO4` | Fases do projeto alteradas |
| `ATUALIZACAO_PASSO5` | Repositório/privacidade alterados |
| `PUBLICACAO` | Projeto publicado |
| `ARQUIVAMENTO` | Projeto arquivado |
| `EXCLUSAO` | Projeto excluído |
| `ADICAO_AUTOR` | Autor adicionado |
| `REMOCAO_AUTOR` | Autor removido |
| `ADICAO_ORIENTADOR` | Orientador adicionado |
| `REMOCAO_ORIENTADOR` | Orientador removido |
| `UPLOAD_BANNER` | Banner enviado |
| `UPLOAD_CODIGO` | Código fonte enviado |
| `UPLOAD_ANEXO_FASE` | Anexo de fase enviado |

---

## 🔧 Endpoints da API

### **1. Validar Equipe**

**Endpoint:** `POST /projetos/validar-equipe`  
**Autenticação:** Requerida (JWT)

Valida se alunos e professores existem antes de adicionar ao projeto.

**Request:**
```json
{
  "alunos_uuids": [
    "uuid-aluno-1",
    "uuid-aluno-2",
    "uuid-aluno-invalido"
  ],
  "professores_uuids": [
    "uuid-professor-1",
    "uuid-professor-invalido"
  ]
}
```

**Response:**
```json
{
  "alunos": {
    "validos": ["uuid-aluno-1", "uuid-aluno-2"],
    "invalidos": ["uuid-aluno-invalido"],
    "dados": [
      {
        "uuid": "uuid-aluno-1",
        "nome": "João Silva",
        "email": "joao@example.com",
        "avatar_url": "https://...",
        "matricula": "202301234",
        "curso_nome": "Técnico em Desenvolvimento de Sistemas",
        "curso_sigla": "TDS"
      },
      {
        "uuid": "uuid-aluno-2",
        "nome": "Maria Santos",
        "email": "maria@example.com",
        "avatar_url": "https://...",
        "matricula": "202301235",
        "curso_nome": "Técnico em Desenvolvimento de Sistemas",
        "curso_sigla": "TDS"
      }
    ]
  },
  "professores": {
    "validos": ["uuid-professor-1"],
    "invalidos": ["uuid-professor-invalido"],
    "dados": [
      {
        "uuid": "uuid-professor-1",
        "nome": "Prof. Carlos Oliveira",
        "email": "carlos@example.com",
        "avatar_url": "https://...",
        "departamento_nome": "Tecnologia da Informação"
      }
    ]
  }
}
```

**Validações:**
- ✅ Verifica se UUIDs de alunos existem na tabela `alunos`
- ✅ Verifica se UUIDs de professores existem na tabela `professores`
- ✅ Retorna dados completos dos usuários válidos
- ✅ Lista quais UUIDs não foram encontrados

---

### **2. Buscar Histórico de Auditoria**

**Endpoint:** `GET /projetos/:uuid/auditoria`  
**Autenticação:** Requerida (JWT)

Retorna todas as alterações feitas em um projeto.

**Parâmetros:**
- `:uuid` - UUID do projeto
- `limite` (query, opcional) - Número máximo de registros

**Exemplos:**
```bash
# Buscar todas as alterações
GET /projetos/abc-123/auditoria

# Buscar últimas 10 alterações
GET /projetos/abc-123/auditoria?limite=10
```

**Response:**
```json
[
  {
    "uuid": "log-uuid-1",
    "acao": "PUBLICACAO",
    "descricao": "Projeto publicado e agora está visível",
    "dados_anteriores": {
      "status": "RASCUNHO"
    },
    "dados_novos": {
      "status": "PUBLICADO"
    },
    "ip_address": "189.94.1.238",
    "criado_em": "2025-12-07T15:30:00.000Z",
    "usuario_nome": "João Silva",
    "usuario_email": "joao@example.com",
    "usuario_tipo": "ALUNO"
  },
  {
    "uuid": "log-uuid-2",
    "acao": "ATUALIZACAO_PASSO3",
    "descricao": "Equipe (autores e orientadores) atualizada",
    "dados_anteriores": {
      "autores": [
        {"uuid": "aluno-1", "papel": "LIDER"}
      ],
      "orientadores": []
    },
    "dados_novos": {
      "autores": [
        {"uuid": "aluno-1", "papel": "LIDER"},
        {"uuid": "aluno-2", "papel": "AUTOR"}
      ],
      "orientadores": ["professor-1"]
    },
    "ip_address": "189.94.1.238",
    "criado_em": "2025-12-07T15:25:00.000Z",
    "usuario_nome": "João Silva",
    "usuario_email": "joao@example.com",
    "usuario_tipo": "ALUNO"
  },
  {
    "uuid": "log-uuid-3",
    "acao": "CRIACAO",
    "descricao": "Projeto criado pelo aluno",
    "dados_anteriores": null,
    "dados_novos": {
      "titulo": "Sistema de Gestão de Biblioteca",
      "descricao": "Um sistema completo...",
      "categoria": "Aplicativo / Site",
      "lider_uuid": "aluno-1"
    },
    "ip_address": "189.94.1.238",
    "criado_em": "2025-12-07T15:20:00.000Z",
    "usuario_nome": "João Silva",
    "usuario_email": "joao@example.com",
    "usuario_tipo": "ALUNO"
  }
]
```

---

## 🔒 Validação no Passo 3

Ao adicionar equipe (Passo 3), o sistema agora:

### **Validações Automáticas:**

1. **Valida Alunos:**
   - Verifica se todos os UUIDs existem na tabela `alunos`
   - Rejeita requisição se algum UUID for inválido
   - Retorna mensagem: "Os seguintes alunos não foram encontrados: uuid1, uuid2"

2. **Valida Professores:**
   - Verifica se todos os UUIDs existem na tabela `professores`
   - Apenas professores cadastrados podem ser orientadores
   - Rejeita requisição se algum UUID for inválido
   - Retorna mensagem: "Os seguintes professores não foram encontrados: uuid1, uuid2"

3. **Exemplo de Erro:**
```json
{
  "success": false,
  "message": "Os seguintes alunos não foram encontrados: abc-123, def-456",
  "errorId": "error-uuid"
}
```

---

## 📝 Exemplo de Uso Completo

### **1. Validar Usuários Antes de Adicionar**

```bash
# Frontend chama este endpoint ANTES de submeter o Passo 3
curl -X POST http://localhost:3000/projetos/validar-equipe \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alunos_uuids": ["uuid-1", "uuid-2"],
    "professores_uuids": ["prof-uuid-1"]
  }'
```

**Se todos forem válidos:**
- Frontend mostra cards com fotos e nomes
- Permite prosseguir para submissão

**Se algum for inválido:**
- Frontend mostra erro: "Usuário X não encontrado"
- Impede submissão

### **2. Adicionar Equipe (Passo 3)**

```bash
curl -X POST http://localhost:3000/projetos/abc-123/passo3 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "autores": [
      {"aluno_uuid": "uuid-1", "papel": "LIDER"},
      {"aluno_uuid": "uuid-2", "papel": "AUTOR"}
    ],
    "docentes_uuids": ["prof-uuid-1"]
  }'
```

**O que acontece:**
- ✅ Valida se todos os UUIDs existem
- ✅ Registra auditoria da mudança de equipe
- ✅ Salva estado anterior (quem estava na equipe antes)
- ✅ Salva estado novo (quem está na equipe agora)

### **3. Ver Histórico de Alterações**

```bash
# Ver todas as alterações do projeto
curl -X GET http://localhost:3000/projetos/abc-123/auditoria \
  -H "Authorization: Bearer TOKEN"

# Ver últimas 5 alterações
curl -X GET http://localhost:3000/projetos/abc-123/auditoria?limite=5 \
  -H "Authorization: Bearer TOKEN"
```

---

## 🗄️ Consultas Úteis

### **Ver Auditoria de um Projeto no Banco**

```sql
-- Ver todas as alterações de um projeto
SELECT 
  acao,
  descricao,
  usuario_nome,
  criado_em,
  dados_anteriores,
  dados_novos
FROM vw_projetos_auditoria
WHERE projeto_uuid = 'seu-uuid-aqui'
ORDER BY criado_em DESC;
```

### **Ver Quem Fez Mais Alterações**

```sql
SELECT 
  usuario_nome,
  COUNT(*) as total_alteracoes,
  array_agg(DISTINCT acao) as tipos_acoes
FROM vw_projetos_auditoria
GROUP BY usuario_nome
ORDER BY total_alteracoes DESC
LIMIT 10;
```

### **Ver Projetos Publicados Recentemente**

```sql
SELECT 
  projeto_titulo,
  usuario_nome,
  criado_em
FROM vw_projetos_auditoria
WHERE acao = 'PUBLICACAO'
ORDER BY criado_em DESC
LIMIT 20;
```

### **Rastrear Mudanças na Equipe**

```sql
SELECT 
  projeto_titulo,
  usuario_nome,
  dados_anteriores->>'autores' as autores_antes,
  dados_novos->>'autores' as autores_depois,
  criado_em
FROM vw_projetos_auditoria
WHERE acao = 'ATUALIZACAO_PASSO3'
ORDER BY criado_em DESC;
```

---

## ✅ Benefícios do Sistema

### **1. Rastreabilidade Total**
- Sabe exatamente quem fez cada alteração
- Histórico completo de mudanças
- Pode reverter alterações se necessário

### **2. Segurança**
- Impede adicionar usuários inexistentes
- Valida permissões antes de modificar
- Registra IP e User-Agent

### **3. Auditoria Completa**
- Estado antes e depois de cada mudança
- Timestamp preciso de cada ação
- Dados em JSON para fácil análise

### **4. Validação Proativa**
- Frontend valida antes de submeter
- Evita erros de validação no backend
- Melhor experiência do usuário

---

## 🚀 Como Aplicar

### **1. Aplicar Migration**
```bash
cd /srv/projetos/vitrine-senai/api
psql -U seu_usuario -d seu_database -f database/migrations/003_add_auditoria.sql
```

### **2. Reiniciar API**
```bash
npm run start:dev
```

### **3. Testar Endpoints**

**Validar Equipe:**
```bash
curl -X POST http://localhost:3000/projetos/validar-equipe \
  -H "Authorization: Bearer TOKEN" \
  -d '{"alunos_uuids":["uuid1"],"professores_uuids":["uuid2"]}'
```

**Ver Auditoria:**
```bash
curl -X GET http://localhost:3000/projetos/UUID_PROJETO/auditoria \
  -H "Authorization: Bearer TOKEN"
```

---

## 📊 Estatísticas

**Antes:**
- ❌ Nenhum registro de alterações
- ❌ Não validava se usuários existem
- ❌ Impossível rastrear quem fez o quê

**Depois:**
- ✅ 16 tipos de ações registradas
- ✅ Validação completa de usuários
- ✅ Rastreabilidade total de alterações
- ✅ Dados antes/depois de cada mudança
- ✅ IP e User-Agent registrados
- ✅ View otimizada para consultas

---

## 🎉 Conclusão

O sistema agora possui:
1. ✅ **Auditoria completa** de todas as alterações
2. ✅ **Validação de usuários** antes de adicionar
3. ✅ **Rastreabilidade total** de quem fez o quê
4. ✅ **Segurança** impedindo usuários inexistentes
5. ✅ **Histórico** completo com dados antes/depois
