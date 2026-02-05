# 🧪 Guia de Testes - API de Criação de Projetos

## 📋 Pré-requisitos

1. ✅ Migration aplicada no banco
2. ✅ API rodando (`npm run start:dev`)
3. ✅ Token JWT válido

---

## 🔐 Obter Token JWT

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu_email@example.com",
    "senha": "sua_senha"
  }'

# Resposta:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "usuario": {...}
# }

# Copie o token e use nas próximas requisições
export TOKEN="seu_token_aqui"
```

---

## 🧪 Testes Sequenciais

### ✅ Teste 1: Criar Projeto (Passo 1)

```bash
curl -X POST http://localhost:3000/projetos/passo1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Sistema de Gestão de Biblioteca Digital - Teste",
    "descricao": "Este é um projeto de teste para validar a nova API. O sistema permite gerenciar empréstimos, devoluções e catálogo de livros de uma biblioteca escolar com funcionalidades modernas.",
    "categoria": "Aplicativo / Site"
  }'
```

**Resposta Esperada:**
```json
{
  "uuid": "abc-123-def-456",
  "mensagem": "Rascunho criado com sucesso. Prossiga para o Passo 2."
}
```

**Salve o UUID do projeto:**
```bash
export PROJETO_UUID="abc-123-def-456"
```

---

### ✅ Teste 2: Informações Acadêmicas (Passo 2)

```bash
curl -X POST http://localhost:3000/projetos/$PROJETO_UUID/passo2 \
  -H "Authorization: Bearer $TOKEN" \
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

**Resposta Esperada:**
```json
{
  "mensagem": "Informações acadêmicas atualizadas. Prossiga para o Passo 3."
}
```

---

### ✅ Teste 3: Equipe (Passo 3)

**⚠️ IMPORTANTE:** Você precisa ter UUIDs válidos de alunos e professores no banco.

```bash
# Primeiro, busque UUIDs de alunos disponíveis
curl -X GET http://localhost:3000/alunos \
  -H "Authorization: Bearer $TOKEN"

# Busque UUIDs de professores
curl -X GET http://localhost:3000/professores \
  -H "Authorization: Bearer $TOKEN"

# Depois, adicione a equipe
curl -X POST http://localhost:3000/projetos/$PROJETO_UUID/passo3 \
  -H "Authorization: Bearer $TOKEN" \
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

**Resposta Esperada:**
```json
{
  "mensagem": "Equipe adicionada com sucesso. Prossiga para o Passo 4."
}
```

---

### ✅ Teste 4: Fases do Projeto (Passo 4)

```bash
curl -X POST http://localhost:3000/projetos/$PROJETO_UUID/passo4 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ideacao": {
      "descricao": "Na fase de ideação, identificamos a necessidade de digitalizar o processo de gestão de biblioteca. Realizamos brainstorming com a equipe e definimos as funcionalidades principais.",
      "anexos": [
        {
          "id": "anexo1",
          "tipo": "crazy8",
          "nome_arquivo": "crazy8-biblioteca.pdf",
          "url_arquivo": "https://storage.exemplo.com/crazy8.pdf",
          "tamanho_bytes": 1024000,
          "mime_type": "application/pdf"
        },
        {
          "id": "anexo2",
          "tipo": "mapa_mental",
          "nome_arquivo": "mapa-mental.png",
          "url_arquivo": "https://storage.exemplo.com/mapa.png",
          "tamanho_bytes": 512000,
          "mime_type": "image/png"
        }
      ]
    },
    "modelagem": {
      "descricao": "Criamos os diagramas de caso de uso, fluxogramas e wireframes das telas principais. Definimos a arquitetura do sistema e modelagem do banco de dados.",
      "anexos": [
        {
          "id": "anexo3",
          "tipo": "diagrama_caso_uso",
          "nome_arquivo": "casos-de-uso.pdf",
          "url_arquivo": "https://storage.exemplo.com/casos-uso.pdf",
          "tamanho_bytes": 800000,
          "mime_type": "application/pdf"
        }
      ]
    },
    "prototipagem": {
      "descricao": "Desenvolvemos protótipos de alta fidelidade usando Figma. Realizamos testes de usabilidade com 10 usuários e coletamos feedback.",
      "anexos": []
    },
    "implementacao": {
      "descricao": "Implementamos o sistema usando React no frontend e Node.js no backend. Realizamos testes unitários e de integração.",
      "anexos": []
    }
  }'
```

**Resposta Esperada:**
```json
{
  "mensagem": "Fases do projeto salvas com sucesso. Prossiga para o Passo 5."
}
```

---

### ✅ Teste 5: Repositório e Publicação (Passo 5)

#### Opção A: Com Link do GitHub
```bash
curl -X POST http://localhost:3000/projetos/$PROJETO_UUID/passo5 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "has_repositorio": true,
    "tipo_repositorio": "link",
    "link_repositorio": "https://github.com/usuario/biblioteca-digital",
    "codigo_visibilidade": "Público",
    "anexos_visibilidade": "Público",
    "aceitou_termos": true
  }'
```

#### Opção B: Sem Repositório
```bash
curl -X POST http://localhost:3000/projetos/$PROJETO_UUID/passo5 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "has_repositorio": false,
    "codigo_visibilidade": "Privado",
    "anexos_visibilidade": "Público",
    "aceitou_termos": true
  }'
```

**Resposta Esperada:**
```json
{
  "mensagem": "Projeto publicado com sucesso! Agora ele está visível para todos."
}
```

---

## 🔍 Validar Projeto Criado

```bash
# Buscar projeto completo
curl -X GET http://localhost:3000/projetos/$PROJETO_UUID \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta Esperada (exemplo):**
```json
{
  "uuid": "abc-123-def-456",
  "titulo": "Sistema de Gestão de Biblioteca Digital - Teste",
  "descricao": "Este é um projeto de teste...",
  "categoria": "Aplicativo / Site",
  "curso": "Técnico em Desenvolvimento de Sistemas",
  "turma": "91133",
  "modalidade": "Presencial",
  "unidade_curricular": "Desenvolvimento de Sistemas",
  "itinerario": true,
  "senai_lab": false,
  "saga_senai": true,
  "has_repositorio": true,
  "tipo_repositorio": "link",
  "link_repositorio": "https://github.com/usuario/biblioteca-digital",
  "codigo_visibilidade": "Público",
  "anexos_visibilidade": "Público",
  "aceitou_termos": true,
  "status": "PUBLICADO",
  "autores": [...],
  "orientadores": [...],
  "fases": [
    {
      "nome_fase": "ideacao",
      "descricao": "Na fase de ideação...",
      "anexos": [...]
    },
    ...
  ]
}
```

---

## ⚠️ Testes de Validação

### Teste 1: Categoria Inválida
```bash
curl -X POST http://localhost:3000/projetos/passo1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Teste com categoria inválida",
    "descricao": "Testando validação de categoria inválida para garantir que o sistema rejeita corretamente.",
    "categoria": "Categoria Inexistente"
  }'
```

**Resposta Esperada:**
```json
{
  "success": false,
  "message": "Falha na validação dos dados.",
  "errorId": "uuid-do-erro",
  "errors": [
    "Categoria inválida"
  ]
}
```

### Teste 2: Descrição Muito Curta
```bash
curl -X POST http://localhost:3000/projetos/passo1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Teste descrição curta",
    "descricao": "Curto",
    "categoria": "IoT"
  }'
```

**Resposta Esperada:**
```json
{
  "success": false,
  "message": "Falha na validação dos dados.",
  "errorId": "uuid-do-erro",
  "errors": [
    "Descrição deve ter no mínimo 50 caracteres"
  ]
}
```

### Teste 3: Modalidade Inválida
```bash
curl -X POST http://localhost:3000/projetos/$PROJETO_UUID/passo2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "curso": "TDS",
    "turma": "91133",
    "modalidade": "Online"
  }'
```

**Resposta Esperada:**
```json
{
  "success": false,
  "message": "Falha na validação dos dados.",
  "errorId": "uuid-do-erro",
  "errors": [
    "Modalidade deve ser Presencial ou Semipresencial"
  ]
}
```

### Teste 4: Termos Não Aceitos
```bash
curl -X POST http://localhost:3000/projetos/$PROJETO_UUID/passo5 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "has_repositorio": false,
    "codigo_visibilidade": "Público",
    "anexos_visibilidade": "Público",
    "aceitou_termos": false
  }'
```

**Resposta Esperada:**
```json
{
  "success": false,
  "message": "Você deve aceitar os termos de uso para publicar o projeto",
  "errorId": "uuid-do-erro"
}
```

---

## 🗄️ Validar Banco de Dados

```sql
-- Verificar projeto criado
SELECT 
  uuid, titulo, categoria, curso, turma, modalidade,
  itinerario, senai_lab, saga_senai, 
  has_repositorio, tipo_repositorio, status
FROM projetos
WHERE titulo LIKE '%Teste%'
ORDER BY criado_em DESC
LIMIT 1;

-- Verificar fases
SELECT 
  pf.nome_fase, 
  pf.descricao,
  COUNT(pfa.uuid) as total_anexos
FROM projetos_fases pf
LEFT JOIN projetos_fases_anexos pfa ON pf.uuid = pfa.fase_uuid
WHERE pf.projeto_uuid = 'SEU_UUID_AQUI'
GROUP BY pf.uuid, pf.nome_fase, pf.descricao
ORDER BY pf.ordem;

-- Verificar autores
SELECT 
  u.nome, u.email, pa.papel
FROM projetos_alunos pa
INNER JOIN alunos a ON pa.aluno_uuid = a.uuid
INNER JOIN usuarios u ON a.usuario_uuid = u.uuid
WHERE pa.projeto_uuid = 'SEU_UUID_AQUI';

-- Verificar orientadores
SELECT 
  u.nome, u.email
FROM projetos_professores pp
INNER JOIN professores p ON pp.professor_uuid = p.uuid
INNER JOIN usuarios u ON p.usuario_uuid = u.uuid
WHERE pp.projeto_uuid = 'SEU_UUID_AQUI';
```

---

## ✅ Checklist de Testes

- [ ] Passo 1: Criar projeto com categoria
- [ ] Passo 2: Adicionar informações acadêmicas
- [ ] Passo 3: Adicionar equipe (autores + orientadores)
- [ ] Passo 4: Salvar fases com descrições e anexos
- [ ] Passo 5: Configurar repositório e publicar
- [ ] Validação: Categoria inválida
- [ ] Validação: Descrição muito curta
- [ ] Validação: Modalidade inválida
- [ ] Validação: Termos não aceitos
- [ ] Buscar projeto completo via GET
- [ ] Validar dados no banco

---

## 🎉 Conclusão

Se todos os testes passaram, a API está **100% funcional** e pronta para receber os dados do frontend!
