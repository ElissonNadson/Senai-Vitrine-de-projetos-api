# Módulo de Arquivamento de Projetos

## 📋 Descrição

Módulo completo para gerenciar solicitações de arquivamento de projetos. Permite que alunos solicitem o arquivamento de seus projetos, que deve ser aprovado ou negado pelo orientador.

## 🗄️ Estrutura do Banco de Dados

### Arquivo SQL
- **Localização**: `api/database/migrations/create_projetos_arquivados.sql`
- **Tabela**: `projetos_arquivados`

### Campos da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL | Chave primária |
| `uuid` | UUID | Identificador único |
| `projeto_uuid` | UUID | FK para projetos |
| `aluno_uuid` | UUID | FK para aluno solicitante |
| `orientador_uuid` | UUID | FK para orientador responsável |
| `justificativa` | TEXT | Justificativa do aluno |
| `justificativa_negacao` | TEXT | Justificativa do orientador (se negar) |
| `status` | VARCHAR(30) | PENDENTE, APROVADO, NEGADO |
| `created_at` | TIMESTAMP | Data de criação |
| `respondido_em` | TIMESTAMP | Data da resposta do orientador |

## 🚀 Como Usar

### 1. Criar a Tabela no Banco

Execute o arquivo SQL no banco de dados:

```bash
psql -U seu_usuario -d vitrine_senai -f api/database/migrations/create_projetos_arquivados.sql
```

### 2. Endpoints Disponíveis

#### 🔹 Aluno Solicita Arquivamento

```http
POST /projetos-arquivados/solicitar
Authorization: Bearer {token}
Content-Type: application/json

{
  "projeto_uuid": "uuid-do-projeto",
  "justificativa": "Motivo para arquivar o projeto (mínimo 20 caracteres)"
}
```

**Resposta:**
```json
{
  "mensagem": "Solicitação de arquivamento enviada com sucesso",
  "solicitacao": {
    "uuid": "uuid-da-solicitacao",
    "projeto_uuid": "uuid-do-projeto",
    "justificativa": "Justificativa do aluno",
    "status": "PENDENTE",
    "created_at": "2025-12-15T..."
  }
}
```

#### 🔹 Orientador Aprova Arquivamento

```http
POST /projetos-arquivados/aprovar
Authorization: Bearer {token}
Content-Type: application/json

{
  "solicitacao_uuid": "uuid-da-solicitacao"
}
```

**Resposta:**
```json
{
  "mensagem": "Projeto arquivado com sucesso",
  "solicitacao": {
    "uuid": "uuid-da-solicitacao",
    "projeto_uuid": "uuid-do-projeto",
    "projeto_titulo": "Título do Projeto",
    "status": "APROVADO"
  }
}
```

#### 🔹 Orientador Nega Arquivamento

```http
POST /projetos-arquivados/negar
Authorization: Bearer {token}
Content-Type: application/json

{
  "solicitacao_uuid": "uuid-da-solicitacao",
  "justificativa_negacao": "Motivo da negação (mínimo 20 caracteres)"
}
```

#### 🔹 Listar Solicitações Pendentes (Orientador)

```http
GET /projetos-arquivados/pendentes
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "total": 2,
  "solicitacoes": [
    {
      "uuid": "uuid-solicitacao",
      "projeto_uuid": "uuid-projeto",
      "projeto_titulo": "Nome do Projeto",
      "aluno_nome": "Nome do Aluno",
      "aluno_email": "aluno@email.com",
      "justificativa": "Justificativa do aluno",
      "created_at": "2025-12-15T..."
    }
  ]
}
```

#### 🔹 Listar Minhas Solicitações (Aluno)

```http
GET /projetos-arquivados/minhas
Authorization: Bearer {token}
```

#### 🔹 Buscar Solicitação Específica

```http
GET /projetos-arquivados/{uuid}
Authorization: Bearer {token}
```

#### 🔹 Histórico de Solicitações de um Projeto

```http
GET /projetos-arquivados/projeto/{projetoUuid}/historico
Authorization: Bearer {token}
```

## 🔒 Validações e Segurança

### Validações Implementadas

1. ✅ **Aluno pertence ao projeto**: Verifica se o aluno faz parte do projeto antes de permitir solicitação
2. ✅ **Orientador existe**: Valida que o projeto tem um orientador associado
3. ✅ **Sem duplicatas**: Não permite múltiplas solicitações pendentes para o mesmo projeto
4. ✅ **Permissões**: Apenas o orientador responsável pode aprovar/negar
5. ✅ **Status único**: Solicitações já respondidas não podem ser alteradas
6. ✅ **Justificativas obrigatórias**: Mínimo de 20 caracteres

### Regras de Negócio

- Apenas **ALUNOS** podem solicitar arquivamento
- Apenas **PROFESSORES/ORIENTADORES** podem aprovar ou negar
- Projeto nunca é **excluído**, apenas **arquivado** (status = 'ARQUIVADO')
- Solicitações possuem 3 status: `PENDENTE`, `APROVADO`, `NEGADO`
- Quando aprovado, o status do projeto é automaticamente alterado para `ARQUIVADO`

## 📁 Estrutura de Arquivos Criados

```
api/src/modules/projetos-arquivados/
├── dto/
│   └── arquivamento.dto.ts           # DTOs de validação
├── projetos-arquivados.controller.ts # Endpoints REST
├── projetos-arquivados.service.ts    # Lógica de negócio
├── projetos-arquivados.dao.ts        # Acesso ao banco de dados
└── projetos-arquivados.module.ts     # Módulo NestJS

api/database/migrations/
└── create_projetos_arquivados.sql    # Script de criação da tabela
```

## 🔄 Fluxo Completo

1. **Aluno** cria solicitação com justificativa → Status: `PENDENTE`
2. **Sistema** valida se aluno pertence ao projeto e se existe orientador
3. **Orientador** recebe notificação e pode visualizar solicitações pendentes
4. **Orientador** decide:
   - ✅ **Aprovar**: Projeto é arquivado (status = `ARQUIVADO`)
   - ❌ **Negar**: Justificativa é registrada, projeto continua ativo
5. **Aluno** pode consultar suas solicitações e ver o status/justificativa

## ⚠️ Observações

- O módulo já está registrado no `app.module.ts`
- Transações garantem consistência dos dados
- Índices otimizam consultas no banco
- Timestamps automáticos via trigger
- Documentação inline nos endpoints

---

**Desenvolvido para**: Vitrine SENAI - Sistema de Gerenciamento de Projetos
