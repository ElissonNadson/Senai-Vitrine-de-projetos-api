# 📚 API de Criação de Projetos - Documentação Completa

## 🎯 Visão Geral

A API de criação de projetos foi completamente atualizada para receber **todos os campos** que o frontend coleta, organizados em **5 passos sequenciais**.

## 📋 Fluxo de Criação de Projeto

### **Passo 1: Informações Básicas**
**Endpoint:** `POST /projetos/passo1`  
**Autenticação:** Requerida (JWT)

Cria o rascunho inicial do projeto com informações básicas.

**Campos:**
```typescript
{
  "titulo": string,           // Min: 10, Max: 200 caracteres
  "descricao": string,        // Min: 50, Max: 5000 caracteres
  "categoria": string,        // Obrigatório - Ver lista de categorias abaixo
  "departamento_uuid": string // Opcional - UUID do departamento
}
```

**Categorias Válidas:**
- "Aplicativo / Site"
- "Automação de Processos"
- "Bioprodutos"
- "Chatbots e Automação Digital"
- "Dashboards e Análises de Dados"
- "Economia Circular"
- "Educação"
- "E-commerce e Marketplace"
- "Eficiência Energética"
- "Impressão 3D"
- "Impacto Social"
- "IoT"
- "Manufatura Inteligente"
- "Modelo de Negócio"
- "Sistemas de Gestão (ERP, CRM, etc.)"
- "Sustentabilidade e Meio Ambiente"
- "Tecnologias Assistivas e Acessibilidade"
- "Outro"

**Resposta:**
```json
{
  "uuid": "uuid-do-projeto",
  "mensagem": "Rascunho criado com sucesso. Prossiga para o Passo 2."
}
```

---

### **Passo 2: Informações Acadêmicas**
**Endpoint:** `POST /projetos/:uuid/passo2`  
**Autenticação:** Requerida (JWT)

Adiciona informações acadêmicas do projeto.

**Campos:**
```typescript
{
  "curso": string,              // Obrigatório - Nome do curso técnico
  "turma": string,              // Obrigatório - Código da turma
  "modalidade": string,         // Obrigatório - "Presencial" ou "Semipresencial"
  "unidade_curricular": string, // Opcional - Nome da unidade curricular
  "itinerario": boolean,        // Opcional - Participou de itinerário formativo
  "senai_lab": boolean,         // Opcional - Participou do Senai Lab/Maker
  "saga_senai": boolean         // Opcional - Participou da Saga Senai
}
```

**Resposta:**
```json
{
  "mensagem": "Informações acadêmicas atualizadas. Prossiga para o Passo 3."
}
```

---

### **Passo 3: Equipe (Autores e Orientadores)**
**Endpoint:** `POST /projetos/:uuid/passo3`  
**Autenticação:** Requerida (JWT)

Adiciona autores e orientadores ao projeto.

**Campos:**
```typescript
{
  "autores": [
    {
      "aluno_uuid": string,  // UUID do aluno na tabela alunos
      "papel": string        // "LIDER" ou "AUTOR"
    }
  ],
  "docentes_uuids": string[]  // Array de UUIDs de professores
}
```

**Validações:**
- Deve ter **exatamente 1 líder**
- Mínimo: 1 autor
- Máximo: 10 autores
- Mínimo: 1 orientador
- Máximo: 5 orientadores

**Resposta:**
```json
{
  "mensagem": "Equipe adicionada com sucesso. Prossiga para o Passo 4."
}
```

---

### **Passo 4: Fases do Projeto**
**Endpoint:** `POST /projetos/:uuid/passo4`  
**Autenticação:** Requerida (JWT)

Salva as descrições e anexos das 4 fases do projeto.

**Campos:**
```typescript
{
  "ideacao": {
    "descricao": string,      // Opcional - Descrição da fase
    "anexos": [               // Opcional - Array de anexos
      {
        "id": string,         // ID único do anexo
        "tipo": string,       // crazy8, mapa_mental, wireframe, etc.
        "nome_arquivo": string,
        "url_arquivo": string,
        "tamanho_bytes": number,
        "mime_type": string
      }
    ]
  },
  "modelagem": {
    "descricao": string,
    "anexos": [...]
  },
  "prototipagem": {
    "descricao": string,
    "anexos": [...]
  },
  "implementacao": {
    "descricao": string,
    "anexos": [...]
  }
}
```

**Tipos de Anexos por Fase:**

**Ideação:**
- crazy8
- mapa_mental
- value_proposition
- customer_journey
- scamper
- mapa_empatia
- video_pitch
- persona
- outros_ideacao

**Modelagem:**
- user_stories
- diagrama_caso_uso
- diagrama_fluxo
- diagrama_classe
- mer_bd
- wireframe
- prototipo_baixa
- outros_modelagem

**Prototipagem:**
- prototipo_funcional
- mockup_alta
- teste_usabilidade
- feedback_usuarios
- video_demo
- outros_prototipagem

**Implementação:**
- screenshots
- manual_usuario
- documentacao_tecnica
- relatorio_final
- video_apresentacao
- outros_implementacao

**Resposta:**
```json
{
  "mensagem": "Fases do projeto salvas com sucesso. Prossiga para o Passo 5."
}
```

---

### **Passo 5: Repositório e Privacidade**
**Endpoint:** `POST /projetos/:uuid/passo5`  
**Autenticação:** Requerida (JWT)

Configura repositório de código, privacidade e **publica o projeto**.

**Campos:**
```typescript
{
  "has_repositorio": boolean,        // Projeto possui repositório de código?
  "tipo_repositorio": string,        // "arquivo" ou "link" (se has_repositorio = true)
  "link_repositorio": string,        // URL do GitHub/GitLab (se tipo = "link")
  "codigo_visibilidade": string,     // "Público" ou "Privado"
  "anexos_visibilidade": string,     // "Público" ou "Privado"
  "aceitou_termos": boolean          // Obrigatório - Deve ser true
}
```

**Validações:**
- `aceitou_termos` **deve ser true**
- Se `has_repositorio = true`, `tipo_repositorio` é obrigatório
- Se `tipo_repositorio = "link"`, `link_repositorio` é obrigatório

**Importante:** Este endpoint automaticamente **publica o projeto**, mudando o status de `RASCUNHO` para `PUBLICADO`.

**Resposta:**
```json
{
  "mensagem": "Projeto publicado com sucesso! Agora ele está visível para todos."
}
```

---

## 📤 Upload de Arquivos

### **Banner do Projeto**
O banner deve ser enviado via **multipart/form-data** em um endpoint separado:

**Endpoint:** `POST /projetos/:uuid/banner`  
**Content-Type:** `multipart/form-data`

```typescript
FormData {
  banner: File // Imagem (PNG, JPG, JPEG) - Max: 5MB
}
```

### **Código Fonte (ZIP)**
Se `tipo_repositorio = "arquivo"`, o ZIP do código deve ser enviado via:

**Endpoint:** `POST /projetos/:uuid/codigo`  
**Content-Type:** `multipart/form-data`

```typescript
FormData {
  codigo: File // Arquivo ZIP - Max: 50MB
}
```

### **Anexos de Fases**
Os anexos das fases devem ser enviados previamente e suas URLs incluídas no Passo 4:

**Endpoint:** `POST /projetos/:uuid/fases/:fase/anexo`  
**Content-Type:** `multipart/form-data`

```typescript
FormData {
  anexo: File,
  tipo: string // crazy8, wireframe, etc.
}
```

**Parâmetros:**
- `:uuid` - UUID do projeto
- `:fase` - Nome da fase: `ideacao`, `modelagem`, `prototipagem`, `implementacao`

---

## 🗄️ Estrutura do Banco de Dados

### **Novas Colunas na Tabela `projetos`:**
- `categoria` - VARCHAR(100)
- `curso` - VARCHAR(200)
- `turma` - VARCHAR(50)
- `modalidade` - VARCHAR(50)
- `unidade_curricular` - VARCHAR(255)
- `itinerario` - BOOLEAN
- `senai_lab` - BOOLEAN
- `saga_senai` - BOOLEAN
- `has_repositorio` - BOOLEAN
- `tipo_repositorio` - VARCHAR(20)
- `link_repositorio` - TEXT
- `codigo_visibilidade` - VARCHAR(20)
- `anexos_visibilidade` - VARCHAR(20)
- `aceitou_termos` - BOOLEAN

### **Novas Tabelas:**

**`projetos_fases`**
- Armazena descrições das 4 fases do projeto
- Campos: uuid, projeto_uuid, nome_fase, descricao, ordem

**`projetos_fases_anexos`**
- Armazena anexos de cada fase
- Campos: uuid, fase_uuid, tipo_anexo, nome_arquivo, url_arquivo, tamanho_bytes, mime_type

**`projetos_codigo`**
- Armazena arquivo ZIP do código fonte
- Campos: uuid, projeto_uuid, nome_arquivo, url_arquivo, tamanho_bytes

---

## 🔍 Buscar Projeto Completo

**Endpoint:** `GET /projetos/:uuid`  
**Autenticação:** Opcional

Retorna todas as informações do projeto, incluindo:
- Dados básicos (título, descrição, categoria)
- Informações acadêmicas
- Autores e orientadores
- Fases com anexos
- Código fonte
- Configurações de privacidade

---

## ⚠️ Notas Importantes

1. **Sequência dos Passos:** Os passos devem ser executados em ordem (1 → 2 → 3 → 4 → 5)
2. **Autenticação:** Todos os endpoints requerem JWT token
3. **Permissões:** Apenas o autor do projeto pode editá-lo
4. **Publicação:** O projeto só é publicado no Passo 5
5. **Validação:** O interceptor de erros retorna mensagens detalhadas do class-validator

---

## 🛠️ Migração do Banco

Para aplicar as alterações no banco de dados, execute:

```bash
cd /srv/projetos/vitrine-senai/api
psql -U seu_usuario -d seu_database -f database/migrations/002_add_frontend_fields.sql
```

---

## 📝 Exemplo Completo

### 1. Criar Projeto (Passo 1)
```bash
curl -X POST http://localhost:3000/projetos/passo1 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Sistema de Gestão de Biblioteca Digital",
    "descricao": "Um sistema completo para gerenciar empréstimos, devoluções e catálogo de livros de uma biblioteca escolar...",
    "categoria": "Aplicativo / Site"
  }'
```

### 2. Adicionar Informações Acadêmicas (Passo 2)
```bash
curl -X POST http://localhost:3000/projetos/UUID_DO_PROJETO/passo2 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "curso": "Técnico em Desenvolvimento de Sistemas",
    "turma": "91133",
    "modalidade": "Presencial",
    "unidade_curricular": "Desenvolvimento de Sistemas",
    "itinerario": true,
    "senai_lab": false,
    "saga_senai": true
  }'
```

### 3. Adicionar Equipe (Passo 3)
```bash
curl -X POST http://localhost:3000/projetos/UUID_DO_PROJETO/passo3 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "autores": [
      {
        "aluno_uuid": "uuid-do-aluno-1",
        "papel": "LIDER"
      },
      {
        "aluno_uuid": "uuid-do-aluno-2",
        "papel": "AUTOR"
      }
    ],
    "docentes_uuids": ["uuid-do-professor-1"]
  }'
```

### 4. Salvar Fases (Passo 4)
```bash
curl -X POST http://localhost:3000/projetos/UUID_DO_PROJETO/passo4 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ideacao": {
      "descricao": "Identificamos a necessidade de...",
      "anexos": [
        {
          "id": "anexo1",
          "tipo": "crazy8",
          "nome_arquivo": "crazy8.pdf",
          "url_arquivo": "https://storage.com/crazy8.pdf",
          "tamanho_bytes": 1024000,
          "mime_type": "application/pdf"
        }
      ]
    },
    "modelagem": {
      "descricao": "Criamos os diagramas...",
      "anexos": []
    }
  }'
```

### 5. Publicar Projeto (Passo 5)
```bash
curl -X POST http://localhost:3000/projetos/UUID_DO_PROJETO/passo5 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "has_repositorio": true,
    "tipo_repositorio": "link",
    "link_repositorio": "https://github.com/usuario/projeto",
    "codigo_visibilidade": "Público",
    "anexos_visibilidade": "Público",
    "aceitou_termos": true
  }'
```

---

## ✅ Conclusão

Agora a API está **100% sincronizada** com o frontend, recebendo todos os 30 campos coletados durante a criação de projetos!
