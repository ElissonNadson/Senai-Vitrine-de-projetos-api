================================================================================
VITRINE DE PROJETOS SENAI-BA - PARTE 1
AUTENTICAÇÃO, CADASTRO E GESTÃO DE PROJETOS
================================================================================
Data: 2025-11-09
Autor: @ElissonNadson

CONTEÚDO DESTA PARTE:
1. Autenticação (Google OAuth)
2. Cadastro e Completar Perfil
3. Dashboard
4. Criar Novo Projeto (4 passos completos)
5. Ver Detalhes do Projeto
6. Editar Projeto
7. Excluir Projeto
8. Transferir/Herdar Projeto
9. Meus Projetos10. Sistema de Progressão de Fases


================================================================================


================================================================================
1. AUTENTICAÇÃO - LOGIN COM GOOGLE OAUTH
================================================================================

FLUXO COMPLETO:
---------------
1. Usuário acessa a landing page
2. Clica em "Entrar com Google SENAI"
3. Sistema redireciona para página de autenticação do Google
4. Usuário escolhe conta Google e autoriza acesso (email, nome, foto)
5. Google retorna callback com código de autorização
6. Backend troca código por access_token do Google
7. Backend busca dados do usuário na API do Google
8. Backend valida domínio do email
9. Se email válido (@ba.estudante.senai.br ou @ba.senai.br):
   a) Busca usuário no banco de dados pelo email
   b) Se não existir: cria usuário automaticamente
   c) Detecta tipo baseado no domínio do email
   d) Gera token JWT com dados do usuário
   e) Retorna dados completos + token
10. Frontend armazena token no localStorage
11. Se primeiro acesso (primeiroAcesso = true): redireciona para completar cadastro
12. Se não: redireciona para dashboard

DOMÍNIOS PERMITIDOS:
--------------------
ALUNOS:
- @ba.estudante.senai.br → Tipo: ALUNO
  Exemplo: joao.silva@ba.estudante.senai.br

PROFESSORES/ADMIN:
- @ba.senai.br → Tipo: PROFESSOR
  Exemplo: prof.carlos@ba.senai.br
  Nota: Admin pode promover professor para ADMIN depois

DOMÍNIOS BLOQUEADOS:
- Gmail, Hotmail, Outlook, Yahoo (emails pessoais)
- Emails de outros estados do SENAI (ex: @senai.sp.br)
- Qualquer outro domínio corporativo ou educacional

ESTRUTURA DO TOKEN JWT:
-----------------------
{
  "uuid": "user-uuid-123-456-789",
  "email": "joao@ba.estudante.senai.br",
  "tipo": "ALUNO",
  "nome": "João Silva",
  "googleId": "google-123456789",
  "primeiroAcesso": false,
  "iat": 1699521234,
  "exp": 1699607634
}

Tempo de expiração: 24 horas (86400 segundos)
Algoritmo: HS256
Secret: Variável de ambiente (JWT_SECRET)

ENDPOINTS DE AUTENTICAÇÃO:
---------------------------

1. GET /auth/google
Descrição: Inicia o fluxo OAuth, redireciona para Google
Autenticação: Não requer
Query params: Nenhum
Resposta: Redirect 302 para Google OAuth

2. GET /auth/google/callback
Descrição: Google retorna aqui após autenticação bem-sucedida
Query params:
  - code: string (código de autorização do Google)
  - state: string (para validação CSRF)
Autenticação: Não requer
Resposta sucesso (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "uuid": "user-uuid-123",
    "nome": "João Silva",
    "email": "joao@ba.estudante.senai.br",
    "tipo": "ALUNO",
    "avatarUrl": "https://lh3.googleusercontent.com/...",
    "primeiroAcesso": false
  }
}

3. POST /auth/logout
Descrição: Invalida token (opcional, frontend pode só remover localStorage)
Headers: Authorization: Bearer {token}
Body: Nenhum
Resposta (200):
{
  "mensagem": "Logout realizado com sucesso"
}

4. GET /auth/me
Descrição: Retorna dados completos do usuário logado
Headers: Authorization: Bearer {token}
Resposta (200):
{
  "uuid": "...",
  "nome": "João Silva",
  "email": "joao@ba.estudante.senai.br",
  "tipo": "ALUNO",
  "avatarUrl": "...",
  "primeiroAcesso": false,
  "aluno": {
    "uuid": "...",
    "matricula": "202401234",
    "curso": "Desenvolvimento de Sistemas",
    "turma": "DS-2024-1A",
    "telefone": "(71) 98765-4321"
  }
}

5. POST /auth/refresh
Descrição: Renova token JWT antes de expirar
Body:
{
  "token": "token-antigo..."
}
Resposta (200):
{
  "token": "novo-token...",
  "expiresIn": 86400
}

ERROS POSSÍVEIS:
----------------

Status 403 - Domínio não permitido:
{
  "statusCode": 403,
  "error": "Forbidden",
  "mensagem": "Apenas emails institucionais do SENAI-BA são permitidos. Use @ba.estudante.senai.br (alunos) ou @ba.senai.br (professores).",
  "emailFornecido": "joao@gmail.com"
}

Status 403 - Usuário bloqueado:
{
  "statusCode": 403,
  "error": "Forbidden",
  "mensagem": "Sua conta está bloqueada. Entre em contato com a secretaria.",
  "contatoSuporte": "suporte@ba.senai.br"
}

Status 401 - Falha no Google:
{
  "statusCode": 401,
  "error": "Unauthorized",
  "mensagem": "Não foi possível autenticar com o Google. Tente novamente.",
  "detalhes": "Invalid authorization code"
}

Status 500 - Erro no servidor:
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "mensagem": "Erro ao processar autenticação. Tente novamente mais tarde."
}

Status 401 - Token expirado:
{
  "statusCode": 401,
  "error": "Unauthorized",
  "mensagem": "Sua sessão expirou. Faça login novamente.",
  "codigo": "TOKEN_EXPIRED"
}

Status 401 - Token inválido:
{
  "statusCode": 401,
  "error": "Unauthorized",
  "mensagem": "Token de autenticação inválido.",
  "codigo": "TOKEN_INVALID"
}

Status 401 - Credenciais inválidas:
{
  "statusCode": 401,
  "error": "Unauthorized",
  "mensagem": "Credenciais inválidas fornecidas pelo Google."
}

Status 400 - Código ausente:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Código de autorização não fornecido"
}


================================================================================
2. COMPLETAR CADASTRO (PRIMEIRO ACESSO)
================================================================================

QUANDO ACONTECE:
----------------
- Logo após primeiro login com Google OAuth
- Usuário foi criado automaticamente no banco
- Faltam dados obrigatórios para uso completo do sistema
- Campo "primeiroAcesso" no token = true

FORMULÁRIO PARA ALUNOS:
-----------------------

Seção: Dados Pessoais

Nome completo: [Input texto]
  - Já preenchido com dados do Google
  - Pode ser editado
  - Max: 255 caracteres

Email institucional: [Input texto desabilitado]
  - Já preenchido com email do Google
  - NÃO pode ser editado
  - Exibe ícone de "verificado"

Matrícula*: [Input texto]
  - Placeholder: "Ex: 202401234"
  - Formato: números, pode ter letras
  - Min: 5 caracteres
  - Max: 20 caracteres
  - Validação de duplicidade em tempo real

Telefone*: [Input com máscara]
  - Máscara: (XX) XXXXX-XXXX
  - Validação de formato
  - Placeholder: "(71) 98765-4321"


Seção: Informações Acadêmicas

Curso*: [Select]
  - Endpoint: GET /cursos
  - Opções carregadas do banco
  - Exemplo: Desenvolvimento de Sistemas, Redes, Eletromecânica

Turma*: [Select dinâmico]
  - Endpoint: GET /turmas?cursoUuid={uuid}
  - Carrega após selecionar curso
  - Desabilitado enquanto curso não for selecionado
  - Exemplo: DS-2024-1A, DS-2024-1B


Seção: Links e Redes (Opcional)

LinkedIn: [Input URL]
  - Placeholder: "https://linkedin.com/in/seu-perfil"
  - Validação de URL válida
  - Não obrigatório

GitHub: [Input URL]
  - Placeholder: "https://github.com/seu-usuario"
  - Validação de URL válida
  - Não obrigatório

Portfólio: [Input URL]
  - Placeholder: "https://seu-portfolio.com"
  - Validação de URL válida
  - Não obrigatório

Bio/Sobre mim: [Textarea]
  - Placeholder: "Conte um pouco sobre você..."
  - Max: 500 caracteres
  - Contador de caracteres exibido
  - Não obrigatório


Botões:
[Salvar e Continuar] - Primário, destaque


FORMULÁRIO PARA PROFESSORES:
-----------------------------

Seção: Dados Pessoais

Nome completo: [Input texto]
  - Já preenchido do Google
  - Editável

Email institucional: [Input texto desabilitado]
  - Fixo, não editável

Matrícula*: [Input texto]
  - Placeholder: "Ex: PROF2024001"
  - Formato livre
  - Validação de duplicidade

Telefone*: [Input com máscara]
  - (XX) XXXXX-XXXX


Seção: Informações Profissionais

Especialidade*: [Input texto]
  - Placeholder: "Ex: Programação Web, Robótica, IoT"
  - Max: 255 caracteres
  - Pode inserir múltiplas especialidades separadas por vírgula

Departamento*: [Select]
  - Opções:
    * Tecnologia da Informação
    * Automação Industrial
    * Eletromecânica
    * Gestão
    * Design
    * Manufatura Avançada
    * Outro


Seção: Links Acadêmicos e Redes (Opcional)

Currículo Lattes: [Input URL]
  - Placeholder: "http://lattes.cnpq.br/..."
  - Validação de URL

LinkedIn: [Input URL]

Área de pesquisa: [Textarea]
  - Placeholder: "Suas áreas de pesquisa e interesse"
  - Max: 500 caracteres

Bio: [Textarea]
  - Max: 500 caracteres


ENDPOINT:
---------
PATCH /perfil/completar

Headers:
Authorization: Bearer {token}

Body para ALUNO:
{
  "matricula": "202401234",
  "cursoUuid": "curso-uuid-123",
  "turmaUuid": "turma-uuid-456",
  "telefone": "(71) 98765-4321",
  "linkedin": "https://linkedin.com/in/joaosilva",
  "github": "https://github.com/joaosilva",
  "portfolio": "https://joaosilva.dev",
  "bio": "Estudante de Desenvolvimento de Sistemas apaixonado por tecnologia..."
}

Body para PROFESSOR:
{
  "matricula": "PROF2024001",
  "especialidade": "Programação Web, IoT, Inteligência Artificial",
  "departamentoUuid": "depto-uuid-789",
  "telefone": "(71) 91234-5678",
  "lattes": "http://lattes.cnpq.br/1234567890123456",
  "linkedin": "https://linkedin.com/in/profcarlos",
  "areaPesquisa": "Inteligência Artificial aplicada a IoT",
  "bio": "Professor com 10 anos de experiência em desenvolvimento de sistemas..."
}

Resposta sucesso (200):
{
  "mensagem": "Cadastro completado com sucesso!",
  "usuario": {
    "uuid": "user-uuid-123",
    "nome": "João Silva",
    "email": "joao@ba.estudante.senai.br",
    "tipo": "ALUNO",
    "avatarUrl": "...",
    "primeiroAcesso": false,
    "aluno": {
      "uuid": "aluno-uuid-456",
      "matricula": "202401234",
      "curso": "Desenvolvimento de Sistemas",
      "turma": "DS-2024-1A",
      "telefone": "(71) 98765-4321",
      "linkedin": "...",
      "github": "...",
      "portfolio": "..."
    }
  }
}

O QUE O BACKEND FAZ:
--------------------
1. Valida token JWT e extrai usuário
2. Verifica se usuário tem "primeiroAcesso" = true
3. Valida todos os campos obrigatórios
4. Valida formato de telefone (regex)
5. Valida formato de URLs (se fornecidas)
6. Valida se matrícula já não está em uso
7. Valida se curso existe
8. Valida se turma existe e pertence ao curso
9. Se ALUNO:
   - Cria registro na tabela "alunos"
   - Vincula com curso e turma selecionados
   - Salva links opcionais
10. Se PROFESSOR:
   - Cria registro na tabela "professores"
   - Vincula com departamento
   - Salva currículo Lattes e área de pesquisa
11. Atualiza registro do usuário:
   - primeiroAcesso = false
   - Atualiza nome se foi editado
12. Cria notificação de boas-vindas:
   - "Bem-vindo à Vitrine de Projetos SENAI!"
13. Registra ação no log de auditoria
14. Retorna dados completos do usuário atualizado

VALIDAÇÕES E ERROS POSSÍVEIS:
------------------------------

Status 400 - Matrícula já existe:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Esta matrícula já está cadastrada no sistema",
  "campo": "matricula",
  "valor": "202401234"
}

Status 400 - Campos obrigatórios vazios:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Preencha todos os campos obrigatórios",
  "camposFaltando": ["matricula", "curso", "turma", "telefone"]
}

Status 400 - Telefone inválido:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Telefone inválido. Use o formato (XX) XXXXX-XXXX",
  "campo": "telefone",
  "valorFornecido": "71987654321"
}

Status 404 - Curso não encontrado:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Curso selecionado não existe",
  "cursoUuid": "curso-invalido-123"
}

Status 400 - Turma inválida:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Turma selecionada não pertence ao curso informado",
  "turma": "DS-2024-1A",
  "curso": "Redes de Computadores"
}

Status 404 - Departamento não encontrado:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Departamento selecionado não existe"
}

Status 409 - Dados duplicados:
{
  "statusCode": 409,
  "error": "Conflict",
  "mensagem": "Já existe um cadastro com esses dados",
  "campo": "matricula"
}

Status 401 - Token inválido:
{
  "statusCode": 401,
  "error": "Unauthorized",
  "mensagem": "Token de autenticação inválido ou expirado"
}

Status 400 - Usuário já completou cadastro:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Cadastro já foi completado anteriormente",
  "primeiroAcesso": false
}

Status 400 - URL inválida:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "URL inválida fornecida",
  "campo": "linkedin",
  "valor": "linkedin.com/joao"
}

Status 400 - Bio muito longa:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Bio não pode exceder 500 caracteres",
  "tamanhoAtual": 650,
  "tamanhoMaximo": 500
}

Status 400 - Matrícula muito curta:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Matrícula deve ter no mínimo 5 caracteres"
}

Status 400 - Nome muito curto:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Nome deve ter no mínimo 3 caracteres"
}

Status 500 - Erro ao salvar:
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "mensagem": "Erro ao completar cadastro. Tente novamente."
}


================================================================================
3. DASHBOARD (PÁGINA INICIAL PERSONALIZADA)
================================================================================

CONCEITO:
---------
Dashboard é a primeira página após login bem-sucedido.
Exibe estatísticas, projetos e atalhos personalizados por tipo de usuário.
Layout baseado na imagem fornecida com cards de fases e grid de projetos.

LAYOUT GERAL (Estrutura Visual):
---------------------------------

[HEADER]
  Logo | Busca global | Notificações | Avatar

[CARDS DE FASES - 4 cards horizontais em linha]
┌───────┬─────────────              ┬─────────────┬─────────────┐
│  Ideação    │  Modelagem  │Prototipagem │Implementação│
│     (1)         │     (2)              │     (1)     │     (1)     │
│   Fase 1    │   Fase 2          │   Fase 3    │   Fase 4    │
└───────┴─────────────┴─────────────┴─────────────┘

[FILTROS E AÇÕES]
[Filtros ▼] [Buscar projetos...        ] [+ Novo Projeto]

[LISTAGEM]
Mostrando 5 de 5 projetos

[GRID DE CARDS DE PROJETOS - 2-3 colunas]
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ [Banner]     │  │ [Banner]     │  │ [Banner]     │
│ Título       │  │ Título       │  │ Título       │
│ Fase atual   │  │ Fase atual   │  │ Fase atual   │
│ Equipe       │  │ Equipe       │  │ Equipe       │
│ Orientador   │  │ Orientador   │  │ Orientador   │
│ Visualizações│  │ Visualizações│  │ Visualizações│
└──────────────┘  └──────────────┘  └──────────────┘

[PAGINAÇÃO]
← 1 2 3 ... 10 →


DASHBOARD PARA ALUNOS:
----------------------

Cards de Fases (4 cards coloridos):

Card 1 - Ideação (fundo amarelo/dourado):
  Ícone: Lâmpada
  Número grande: 1 (quantidade de projetos nesta fase)
  Título: "Ideação"
  Descrição: "Fase inicial de concepção do projeto"
  Badge inferior: "Fase 1"

Card 2 - Modelagem (fundo azul):
  Ícone: Documento/Planta
  Número grande: 2
  Título: "Modelagem"
  Descrição: "Definição de processos, recursos e documentação"
  Badge inferior: "Fase 2"

Card 3 - Prototipagem (fundo roxo):
  Ícone: Ferramenta/Engrenagem
  Número grande: 1
  Título: "Prototipagem"
  Descrição: "Desenvolvimento e testes do protótipo funcional"
  Badge inferior: "Fase 3"

Card 4 - Implementação (fundo verde):
  Ícone: Foguete
  Número grande: 1
  Título: "Implementação"
  Descrição: "Aplicação da solução em contexto real ou simulado"
  Badge inferior: "Fase 4"


Seção de Filtros e Busca:
  - Dropdown "Filtros": Curso, Categoria, Ano, Status
  - Input de busca: "Buscar projetos ou tarefas..."
  - Botão destaque: "+ Novo Projeto" (cor primária, ícone de +)


Seção de Projetos:
  Título: "Mostrando X de Y projetos"
  
  Grid responsivo (2-3 colunas dependendo da tela)
  
  Cada card de projeto contém:
  - Banner (imagem de capa do projeto)
  - Badge da fase atual (ex: "Fase 2" em azul)
  - Título do projeto (2 linhas max, truncado com ...)
  - Descrição curta (3 linhas max, truncado)
  - Equipe: Avatares sobrepostos (max 4 visíveis + "+X")
  - Orientador: Nome e foto pequena
  - Rodapé:
    * Ícone olho + visualizações
    * Ícone coração + curtidas
    * Última atualização (ex: "Há 2 dias")


Sidebar ou Seção Inferior - Próximos Eventos:
  Título: "Próximos Eventos"
  
  Lista de 3-5 eventos:
  - Ícone do tipo de evento
  - Título do evento
  - Data e hora
  - Local
  - Botão "Ver mais"


Cards Adicionais de Estatísticas (opcional, abaixo das fases):
  - Total de Projetos: X
  - Projetos Concluídos: X
  - Notificações Não Lidas: X (com link)


DASHBOARD PARA PROFESSORES:
---------------------------

Cards de Fases:
  Mesmos 4 cards, mas contam projetos que ele orienta
  Números refletem projetos sob sua orientação

Cards de Estatísticas:
  Card 1: Alunos sob Orientação (X alunos)
  Card 2: Projetos Orientados (X projetos)
  Card 3: Projetos em Andamento (X projetos)
  Card 4: Projetos Concluídos (X projetos)
  Card 5: Notificações Não Lidas (X notificações)

Seção de Projetos Recentes sob Orientação:
  Título: "Projetos Recentes"
  
  Lista ou grid com:
  - Banner do projeto
  - Título
  - Nome do aluno líder
  - Turma
  - Fase atual (badge colorido)
  - Data de criação ou última atualização
  - Botão "Ver Projeto"

Seção de Ações Rápidas:
  - Ver Todos os Projetos
  - Gerenciar Alunos
  - Criar Evento
  - Ver Relatórios

Seção de Próximos Eventos:
  Eventos criados por ele ou eventos gerais do sistema


DASHBOARD PARA ADMIN:
---------------------

Cards de Estatísticas Gerais do Sistema:
  - Total de Usuários: X
  - Total de Alunos: X
  - Total de Professores: X
  - Total de Projetos: X

Cards de Fases (sistema completo):
  Contam TODOS os projetos do sistema por fase

Seção de Ações Administrativas:
  - Gerenciar Usuários
  - Gerenciar Eventos
  - Gerenciar Cursos e Turmas
  - Ver Relatórios Completos
  - Configurações do Sistema
  - Logs de Auditoria

Seção de Atividades Recentes:
  Últimas ações no sistema:
  - Novos cadastros
  - Projetos publicados
  - Comentários recentes
  - Problemas/alertas


ENDPOINT:
---------
GET /dashboard

Headers:
Authorization: Bearer {token}

Query params (opcionais para filtros):
- curso: uuid do curso (filtrar projetos)
- categoria: string (filtrar por categoria)
- ano: number (filtrar por ano de criação)

Resposta para ALUNO (200):
{
  "tipo": "ALUNO",
  "usuario": {
    "uuid": "user-uuid-123",
    "nome": "João Silva",
    "avatarUrl": "https://...",
    "aluno": {
      "curso": "Desenvolvimento de Sistemas",
      "turma": "DS-2024-1A",
      "matricula": "202401234"
    }
  },
  "estatisticasFases": {
    "ideacao": 1,
    "modelagem": 2,
    "prototipagem": 1,
    "implementacao": 1
  },
  "estatisticasGerais": {
    "totalProjetos": 5,
    "projetosConcluidos": 3,
    "notificacoesNaoLidas": 8
  },
  "projetos": [
    {
      "uuid": "projeto-123",
      "titulo": "Sistema de Gestão Escolar",
      "descricao": "Plataforma web para gerenciamento...",
      "bannerUrl": "https://storage.com/banner.jpg",
      "faseAtual": "PROTOTIPAGEM",
      "faseBadge": {
        "nome": "Fase 3",
        "cor": "roxo"
      },
      "equipe": [
        {
          "uuid": "aluno-1",
          "nome": "João Silva",
          "avatarUrl": "https://..."
        },
        {
          "uuid": "aluno-2",
          "nome": "Maria Santos",
          "avatarUrl": "https://..."
        }
      ],
      "totalEquipe": 3,
      "orientador": {
        "uuid": "prof-1",
        "nome": "Prof. Carlos Santos",
        "avatarUrl": "https://..."
      },
      "visualizacoes": 150,
      "curtidas": 25,
      "atualizadoEm": "2025-11-08T14:30:00Z",
      "atualizadoEmTexto": "Há 2 dias"
    }
  ],
  "totalProjetos": 5,
  "paginacao": {
    "paginaAtual": 1,
    "itensPorPagina": 9,
    "totalPaginas": 1
  },
  "proximosEventos": [
    {
      "uuid": "evento-1",
      "titulo": "Feira de Projetos 2025",
      "data": "2025-11-15T14:00:00Z",
      "dataTexto": "15/11/2025 às 14:00",
      "local": "Auditório Principal",
      "tipo": "FEIRA",
      "icone": "calendar-event"
    },
    {
      "uuid": "evento-2",
      "titulo": "Workshop de IoT",
      "data": "2025-11-20T09:00:00Z",
      "dataTexto": "20/11/2025 às 09:00",
      "local": "Lab Maker",
      "tipo": "WORKSHOP",
      "icone": "wrench"
    }
  ]
}

Resposta para PROFESSOR (200):
{
  "tipo": "PROFESSOR",
  "usuario": {
    "uuid": "prof-uuid-456",
    "nome": "Prof. Carlos Santos",
    "avatarUrl": "https://...",
    "professor": {
      "especialidade": "Programação Web",
      "departamento": "Tecnologia da Informação"
    }
  },
  "estatisticasFases": {
    "ideacao": 3,
    "modelagem": 5,
    "prototipagem": 4,
    "implementacao": 2
  },
  "estatisticasGerais": {
    "alunosSobOrientacao": 15,
    "projetosOrientados": 14,
    "projetosAndamento": 10,
    "projetosConcluidos": 4,
    "notificacoesNaoLidas": 12
  },
  "projetosRecentes": [
    {
      "uuid": "projeto-456",
      "titulo": "App de Gestão de Tarefas",
      "bannerUrl": "https://...",
      "lider": {
        "uuid": "aluno-5",
        "nome": "Pedro Costa",
        "avatarUrl": "https://..."
      },
      "turma": "DS-2024-1A",
      "faseAtual": "MODELAGEM",
      "faseBadge": {
        "nome": "Fase 2",
        "cor": "azul"
      },
      "criadoEm": "2025-11-05T10:00:00Z",
      "criadoEmTexto": "Há 4 dias"
    }
  ],
  "acoesRapidas": [
    {
      "label": "Ver Todos os Projetos",
      "link": "/professor/projetos",
      "icone": "folder"
    },
    {
      "label": "Gerenciar Alunos",
      "link": "/professor/alunos",
      "icone": "users"
    },
    {
      "label": "Criar Evento",
      "link": "/admin/eventos/novo",
      "icone": "calendar-plus"
    }
  ],
  "proximosEventos": [...]
}

Resposta para ADMIN (200):
{
  "tipo": "ADMIN",
  "usuario": {
    "uuid": "admin-uuid-789",
    "nome": "Admin Pedro Silva",
    "avatarUrl": "https://..."
  },
  "estatisticasSistema": {
    "totalUsuarios": 3690,
    "totalAlunos": 3456,
    "totalProfessores": 234,
    "totalProjetos": 1234
  },
  "estatisticasFases": {
    "ideacao": 150,
    "modelagem": 300,
    "prototipagem": 400,
    "implementacao": 384
  },
  "atividadesRecentes": [
    {
      "tipo": "NOVO_USUARIO",
      "mensagem": "Ana Paula se cadastrou como aluna",
      "dataHora": "2025-11-09T05:30:00Z",
      "dataTexto": "Há 1 hora"
    },
    {
      "tipo": "PROJETO_PUBLICADO",
      "mensagem": "João Silva publicou 'Sistema de Gestão'",
      "dataHora": "2025-11-09T04:15:00Z",
      "dataTexto": "Há 2 horas"
    }
  ],
  "acoesAdmin": [
    {
      "label": "Gerenciar Usuários",
      "link": "/admin/usuarios",
      "icone": "users-cog"
    },
    {
      "label": "Gerenciar Eventos",
      "link": "/admin/eventos",
      "icone": "calendar"
    },
    {
      "label": "Relatórios Completos",
      "link": "/admin/relatorios",
      "icone": "chart-bar"
    },
    {
      "label": "Configurações",
      "link": "/admin/configuracoes",
      "icone": "settings"
    }
  ]
}

O QUE O BACKEND FAZ:
--------------------
1. Valida token JWT e extrai dados do usuário
2. Identifica tipo do usuário (ALUNO, PROFESSOR, ADMIN)
3. Busca estatísticas específicas baseado no tipo:
   
   Para ALUNO:
   - Conta projetos por fase (WHERE autor = usuário)
   - Conta total de projetos do aluno
   - Conta projetos concluídos
   - Conta notificações não lidas
   - Busca últimos projetos do aluno (com paginação)
   - Busca próximos eventos da turma/curso
   
   Para PROFESSOR:
   - Conta projetos por fase (WHERE orientador = usuário)
   - Conta alunos distintos sob orientação
   - Conta projetos orientados total
   - Conta projetos em andamento
   - Conta projetos concluídos
   - Busca projetos recentes sob orientação
   
   Para ADMIN:
   - Conta totais gerais do sistema
   - Conta projetos por fase (todos)
   - Busca atividades recentes (log de auditoria)

4. Formata datas para texto legível ("Há X dias")
5. Agrupa dados relacionados (equipe, badges, etc)
6. Aplica filtros se fornecidos (curso, categoria, ano)
7. Implementa paginação nos projetos
8. Retorna JSON estruturado

ERROS POSSÍVEIS:
----------------

Status 401 - Token ausente:
{
  "statusCode": 401,
  "error": "Unauthorized",
  "mensagem": "Token de autenticação não fornecido"
}

Status 401 - Token inválido:
{
  "statusCode": 401,
  "error": "Unauthorized",
  "mensagem": "Token inválido ou expirado"
}

Status 404 - Usuário não encontrado:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Usuário não encontrado no sistema",
  "usuarioUuid": "user-123"
}

Status 500 - Erro ao buscar dados:
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "mensagem": "Erro ao carregar dados do dashboard. Tente novamente."
}

Status 400 - Filtro inválido:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Filtro 'categoria' inválido",
  "valorFornecido": "XYZ"
}


================================================================================
4. CRIAR NOVO PROJETO (FLUXO COMPLETO EM 4 PASSOS)
================================================================================

CONCEITO GERAL:
---------------
Criação de projeto dividida em 4 passos com:
- Salvamento automático de rascunho a cada passo
- Validação progressiva
- Sistema inteligente de progressão de fases
- Upload de múltiplos arquivos
- Preview antes de publicar

Fluxo:
Passo 1: Informações Acadêmicas e Básicas → Salva rascunho
Passo 2: Anexos e Timeline → Salva anexos
Passo 3: Código Fonte → Salva código
Passo 4: Revisão e Publicação → Publica projeto

Após publicação: Notifica todos os usuários do sistema


PASSO 1: INFORMAÇÕES ACADÊMICAS E BÁSICAS DO PROJETO
-----------------------------------------------------

Interface do Formulário:

┌─────────────────────────────────────────────────────────────┐
│ Criar Novo Projeto - Passo 1 de 4                          │
│ Informações Básicas                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Informações Acadêmicas                                      │
│                                                             │
│ Curso*:                                                     │
│ [Selecione um curso                               ▼]       │
│                                                             │
│ Turma*:                                                     │
│ [Selecione uma turma                              ▼]       │
│ (Desabilitado até selecionar curso)                        │
│                                                             │
│ Unidade Curricular*:                                        │
│ [Selecione a unidade curricular                   ▼]       │
│                                                             │
│ [✓] Participou da Saga SENAI?                              │
│ [✓] Usou o Lab Maker?                                      │
│ [ ] Tem Itinerário Formativo?                              │
│                                                             │
│ Nome do Lab SENAI: [________________] (opcional)            │
│                                                             │
│───────────────────────────────────────────────────────────│
│                                                             │
│ Detalhes do Projeto                                         │
│                                                             │
│ Título do Projeto*:                                         │
│ [________________________________] 0/255                    │
│                                                             │
│ Descrição*:                                                 │
│ [                                                    ]      │
│ [  Editor de texto rico com formatação            ]      │
│ [  - Negrito, itálico, sublinhado                  ]      │
│ [  - Listas numeradas e com marcadores             ]      │
│ [  - Links                                          ]      │
│ [                                                    ]      │
│                                          100/5000           │
│                                                             │
│ Categoria*:                                                 │
│ [Selecione uma categoria                          ▼]       │
│                                                             │
│ Modalidade*:                                                │
│ ( ) Individual  (•) Grupo  ( ) Interdisciplinar            │
│                                                             │
│ Fase Inicial*:                                              │
│ [Ideação                                          ▼]       │
│ ℹ️ Esta fase pode mudar automaticamente conforme você      │
│    adicionar anexos nas próximas etapas                    │
│                                                             │
│───────────────────────────────────────────────────────────│
│                                                             │
│ Equipe do Projeto                                           │
│                                                             │
│ [✓] Você é o líder deste projeto?                          │
│                                                             │
│ Autores* (incluindo você):                                  │
│ [Buscar por nome, email ou matrícula...        ] [🔍]      │
│                                                             │
│ Autores adicionados:                                        │
│ ┌────────────────────────────────────────────────┐        │
│ │ 👤 João Silva (202401234) - LÍDER         [×] │        │
│ │ 👤 Maria Santos (202401235)                [×] │        │
│ │ 👤 Pedro Costa (202401236)                 [×] │        │
│ └────────────────────────────────────────────────┘        │
│                                                             │
│ Orientador*:                                                │
│ [Buscar professor...                          ] [🔍]      │
│                                                             │
│ Orientador selecionado:                                     │
│ ┌────────────────────────────────────────────────┐        │
│ │ 👨‍🏫 Prof. Carlos Santos                      │        │
│ │    Especialidade: Programação Web              │        │
│ │    Departamento: TI                            │        │
│ └────────────────────────────────────────────────┘        │
│                                                             │
│ Co-orientador: (opcional)                                   │
│ [Buscar professor...                          ] [🔍]      │
│                                                             │
│                                                             │
│            [Cancelar]  [Salvar Rascunho]  [Próximo →]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘


Campos e Validações:

Curso*:
- Tipo: Select
- Endpoint: GET /cursos
- Obrigatório
- Carrega lista de cursos ativos do banco
- Ao selecionar: habilita campo "Turma"

Turma*:
- Tipo: Select dinâmico
- Endpoint: GET /turmas?cursoUuid={uuid}
- Obrigatório
- Desabilitado até curso ser selecionado
- Mostra apenas turmas do curso selecionado

Unidade Curricular*:
- Tipo: Select
- Endpoint: GET /unidades-curriculares?cursoUuid={uuid}
- Obrigatório
- Filtra por curso se selecionado

Participou da Saga SENAI?: Checkbox (boolean)
Usou o Lab Maker?: Checkbox (boolean)
Tem Itinerário Formativo?: Checkbox (boolean)

Nome do Lab SENAI:
- Tipo: Input texto
- Opcional
- Ativa apenas se "Usou o Lab Maker" = true
- Max: 100 caracteres

Título do Projeto*:
- Tipo: Input texto
- Obrigatório
- Min: 10 caracteres
- Max: 255 caracteres
- Contador de caracteres em tempo real
- Placeholder: "Ex: Sistema de Gestão Escolar Inteligente"

Descrição*:
- Tipo: Editor de texto rico (WYSIWYG ou Markdown)
- Obrigatório
- Min: 100 caracteres
- Max: 5000 caracteres
- Suporta: negrito, itálico, listas, links
- Contador de caracteres
- Dica: "Descreva o problema, objetivos, metodologia e resultados esperados"

Categoria*:
- Tipo: Select
- Obrigatório
- Opções fixas:
  * Aplicativo / Site
  * Automação de Processos
  * Bioprodutos
  * Chatbots e Automação Digital
  * Dashboards e Análise de Dados
  * Economia Circular
  * Educação
  * E-commerce e Marketplace
  * Eficiência Energética
  * Impressão 3D
  * Impacto Social
  * IoT (Internet das Coisas)
  * Robótica
  * Sustentabilidade
  * Outro

Modalidade*:
- Tipo: Radio buttons
- Obrigatório
- Opções: INDIVIDUAL | GRUPO | INTERDISCIPLINAR

Fase Inicial*:
- Tipo: Select
- Obrigatório
- Opções: IDEACAO | MODELAGEM | PROTOTIPAGEM | IMPLEMENTACAO
- Padrão: IDEACAO
- Info tooltip: "Esta fase pode mudar automaticamente quando você adicionar anexos"

Autores*:
- Tipo: Component de busca e seleção múltipla
- Obrigatório (mínimo 1)
- Máximo: 10 autores
- Endpoint de busca: GET /alunos/buscar?q={termo}&cursoUuid={curso}
- Busca por: nome, email ou matrícula
- Resultados mostram: foto, nome, matrícula, curso/turma
- Adicionados aparecem como tags removíveis
- Líder é marcado automaticamente (checkbox "Você é o líder?")
- Validação: Líder deve estar na lista de autores

Orientador*:
- Tipo: Select com busca (autocomplete)
- Obrigatório
- Endpoint: GET /professores/buscar?q={termo}
- Busca por: nome ou especialidade
- Resultado mostra: foto, nome, especialidade, departamento
- Selecionado aparece em card destacado

Co-orientador:
- Tipo: Select com busca
- Opcional
- Mesmo funcionamento do orientador


ENDPOINT PASSO 1:
-----------------
POST /projetos/rascunho

Headers:
Authorization: Bearer {token}

Body:
{
  "cursoUuid": "curso-uuid-123",
  "turmaUuid": "turma-uuid-456",
  "unidadeCurricularUuid": "uc-uuid-789",
  "participouSaga": true,
  "labMaker": true,
  "itinerario": false,
  "nomeLab": "Lab Maker Central",
  "titulo": "Sistema de Gestão Escolar Inteligente",
  "descricao": "<p>Este projeto visa desenvolver um sistema web...</p>",
  "categoria": "Aplicativo / Site",
  "modalidade": "GRUPO",
  "faseAtual": "IDEACAO",
  "autoresUuids": [
    "aluno-uuid-1",
    "aluno-uuid-2",
    "aluno-uuid-3"
  ],
  "liderUuid": "aluno-uuid-1",
  "orientadorUuid": "prof-uuid-1",
  "coorientadorUuid": "prof-uuid-2"
}

Resposta sucesso (201):
{
  "uuid": "projeto-novo-uuid-123",
  "status": "RASCUNHO",
  "faseAtual": "IDEACAO",
  "passoAtual": 1,
  "proximoPasso": 2,
  "mensagem": "Rascunho salvo com sucesso! Continue para adicionar anexos.",
  "progresso": {
    "passo1": true,
    "passo2": false,
    "passo3": false,
    "passo4": false
  }
}

O QUE O BACKEND FAZ NO PASSO 1:
--------------------------------
1. Valida token JWT
2. Extrai usuário logado
3. Valida todos os campos obrigatórios
4. Verifica se curso existe e está ativo
5. Verifica se turma existe e pertence ao curso
6. Verifica se unidade curricular existe
7. Valida tamanho do título (10-255 chars)
8. Valida tamanho da descrição (100-5000 chars)
9. Sanitiza HTML da descrição (previne XSS)
10. Verifica se categoria é válida (lista fixa)
11. Verifica se modalidade é válida
12. Verifica se fase é válida
13. Valida autores:
    - Mínimo 1, máximo 10
    - Todos devem existir e ser alunos ativos
    - Sem duplicados
14. Verifica se líder está na lista de autores
15. Verifica se orientador existe e é professor ativo
16. Se coorientador: verifica se existe e é diferente do orientador
17. Gera UUID para o novo projeto
18. Cria registro na tabela "projetos":
    - Todos os campos básicos
    - status = "RASCUNHO"
    - fase_atual = "IDEACAO" (ou selecionada)
    - criado_por = usuário logado
    - data criação
19. Cria relações em "projetos_alunos":
    - Para cada autor com papel "MEMBRO"
    - Líder com papel "LIDER"
20. Cria relação em "projetos_professores":
    - Orientador com tipo "ORIENTADOR"
    - Coorientador com tipo "COORIENTADOR" (se tiver)
21. Registra ação no log de auditoria
22. Retorna UUID e status do projeto

VALIDAÇÕES E ERROS POSSÍVEIS (PASSO 1):
----------------------------------------

Status 404 - Curso não encontrado:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Curso selecionado não existe no sistema",
  "campo": "cursoUuid",
  "valor": "curso-invalido-123"
}

Status 404 - Turma não encontrada:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Turma selecionada não existe",
  "campo": "turmaUuid"
}

Status 400 - Turma não pertence ao curso:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Turma 'DS-2024-1A' não pertence ao curso 'Redes de Computadores'",
  "turma": "DS-2024-1A",
  "curso": "Redes de Computadores"
}

Status 404 - Unidade Curricular não encontrada:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Unidade Curricular selecionada não existe"
}

Status 400 - Título muito curto:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Título deve ter no mínimo 10 caracteres",
  "campo": "titulo",
  "tamanhoAtual": 5,
  "tamanhoMinimo": 10
}

Status 400 - Título muito longo:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Título não pode exceder 255 caracteres",
  "tamanhoAtual": 300
}

Status 400 - Descrição muito curta:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Descrição deve ter no mínimo 100 caracteres. Atualmente: 45 caracteres",
  "tamanhoAtual": 45,
  "tamanhoMinimo": 100
}

Status 400 - Descrição muito longa:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Descrição não pode exceder 5000 caracteres",
  "tamanhoAtual": 5500
}

Status 400 - Categoria inválida:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Categoria 'XYZ' não é válida. Escolha uma das opções disponíveis",
  "categoriaFornecida": "XYZ",
  "categoriasValidas": ["Aplicativo / Site", "IoT", ...]
}

Status 400 - Modalidade inválida:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Modalidade deve ser: INDIVIDUAL, GRUPO ou INTERDISCIPLINAR",
  "valorFornecido": "DUPLA"
}

Status 400 - Fase inválida:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Fase deve ser: IDEACAO, MODELAGEM, PROTOTIPAGEM ou IMPLEMENTACAO",
  "valorFornecido": "INICIACAO"
}

Status 400 - Sem autores:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Adicione pelo menos um autor ao projeto",
  "quantidadeAtual": 0,
  "minimoRequerido": 1
}

Status 400 - Muitos autores:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Máximo de 10 autores permitidos",
  "quantidadeAtual": 12,
  "maximoPermitido": 10
}

Status 404 - Autor não encontrado:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Aluno não encontrado no sistema",
  "autorUuid": "aluno-invalido-123",
  "autorNome": "João Silva"
}

Status 400 - Autor não é aluno ativo:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Usuário não é um aluno ativo no sistema",
  "autorUuid": "user-123",
  "autorNome": "Maria Santos",
  "tipoAtual": "PROFESSOR"
}

Status 400 - Líder não está na lista:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "O líder do projeto deve estar na lista de autores",
  "liderUuid": "aluno-999",
  "liderNome": "Pedro Costa"
}

Status 404 - Orientador não encontrado:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Professor orientador não encontrado no sistema",
  "orientadorUuid": "prof-invalido-456"
}

Status 400 - Orientador não é professor:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Usuário selecionado como orientador não é um professor",
  "orientadorUuid": "user-789",
  "tipoAtual": "ALUNO"
}

Status 400 - Orientador inativo:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Professor selecionado está inativo no sistema",
  "orientadorNome": "Prof. Roberto Silva",
  "status": "INATIVO"
}

Status 409 - Autor duplicado:
{
  "statusCode": 409,
  "error": "Conflict",
  "mensagem": "Aluno já está na lista de autores",
  "autorDuplicado": "João Silva",
  "autorUuid": "aluno-123"
}

Status 400 - Coorientador igual ao orientador:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Coorientador não pode ser o mesmo que o orientador",
  "professorNome": "Prof. Carlos Santos"
}

Status 409 - Título duplicado:
{
  "statusCode": 409,
  "error": "Conflict",
  "mensagem": "Já existe um projeto com este título",
  "titulo": "Sistema de Gestão Escolar",
  "projetoExistenteUuid": "projeto-existente-123"
}

Status 400 - Campos obrigatórios vazios:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Preencha todos os campos obrigatórios",
  "camposFaltando": [
    "titulo",
    "descricao",
    "categoria",
    "orientadorUuid"
  ]
}

Status 500 - Erro ao criar:
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "mensagem": "Erro ao criar rascunho do projeto. Tente novamente."
}


Continuarei o documento na próxima parte. Deseja que eu prossiga com:
- PASSO 2: ANEXOS E TIMELINE
- PASSO 3: CÓDIGO FONTE
- PASSO 4: REVISÃO E PUBLICAÇÃO
- Meus Projetos
- Sistema de Progressão de Fases
















================================================================================
VITRINE DE PROJETOS SENAI-BA - PARTE 1 COMPLETA
AUTENTICAÇÃO, CADASTRO E GESTÃO DE PROJETOS
================================================================================
Versão: 2.0 Final Completa
Data: 2025-11-09
Autor: @ElissonNadson

CONTEÚDO DESTA PARTE:
1. Autenticação (Google OAuth) ✓
2. Cadastro e Completar Perfil ✓
3. Dashboard ✓
4. Criar Novo Projeto (4 passos completos) ✓
5. Ver Detalhes do Projeto
6. Editar Projeto
7. Excluir Projeto
8. Transferir/Herdar Projeto
9. Meus Projetos
10. Sistema de Progressão de Fases

OUTROS ARQUIVOS:
- Parte 2: Notificações, Comentários, Curtidas e Busca
- Parte 3: Eventos, Permissões, Endpoints e Banco de Dados

================================================================================

[As seções 1-4 já foram documentadas anteriormente, continuando...]

================================================================================
5. VER DETALHES DO PROJETO
================================================================================

CONCEITO:
---------
Página de visualização completa de um projeto específico.
Layout diferenciado para usuários logados vs visitantes.
Exibe todas as informações, timeline, anexos, código e comentários.

ESTRUTURA DA PÁGINA:
--------------------

[Banner grande do projeto - imagem full width]

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│ Sistema de Gestão Escolar                                   │
│                                                             │
│ Por João Silva, Maria Santos, Pedro Costa                  │
│ Orientador: Prof. Carlos Santos                            │
│                                                             │
│ Visualizações: 1.234    Curtidas: 89                       │
│ Fase Atual: PROTOTIPAGEM (Fase 3)                         │
│                                                             │
│ [GitHub] [Baixar Código] [Editar] [Excluir]               │
│ (botões aparecem conforme permissão)                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ INFORMAÇÕES ACADÊMICAS                                      │
│                                                             │
│ • Curso: Desenvolvimento de Sistemas                        │
│ • Turma: DS-2024-1A                                         │
│ • Unidade Curricular: Programação Web                       │
│ • Categoria: Aplicativo / Site                              │
│ • Modalidade: Grupo                                         │
│ • Participou da Saga SENAI                                  │
│ • Usou Lab Maker (Lab Maker Central)                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ DESCRIÇÃO                                                   │
│                                                             │
│ [Texto completo da descrição com formatação]                │
│ [Pode ter múltiplos parágrafos, listas, links]             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ TECNOLOGIAS UTILIZADAS                                      │
│                                                             │
│ [React] [Node.js] [PostgreSQL] [TypeScript] [Docker]       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ EQUIPE DO PROJETO                                           │
│                                                             │
│ Líder:                                                      │
│ • João Silva (202401234) - LÍDER                           │
│   joao@ba.estudante.senai.br                               │
│                                                             │
│ Membros:                                                    │
│ • Maria Santos (202401235) - Desenvolvedora                │
│ • Pedro Costa (202401236) - Designer                       │
│                                                             │
│ Orientador:                                                 │
│ • Prof. Carlos Santos                                       │
│   Especialidade: Programação Web                            │
│   Departamento: TI                                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ TIMELINE DO PROJETO                                         │
│                                                             │
│ [Visual tipo linha do tempo]                                │
│                                                             │
│ Ideação ──── Modelagem ──── Prototipagem ──── Implementação │
│   (✓)          (✓)             (🔵)             ( )         │
│                                                             │
│ [Cards expansíveis para cada etapa]                         │
│                                                             │
│ ┌───────────────────────────────────────────┐              │
│ │ 💡 ETAPA 1: IDEAÇÃO                       │              │
│ │ Data: 10/01/2024                          │              │
│ │                                           │              │
│ │ Descrição:                                │              │
│ │ Nesta fase realizamos brainstorming...    │              │
│ │                                           │              │
│ │ Anexos (3):                               │              │
│ │ • brainstorming.pdf (1.2 MB) [Download]  │              │
│ │ • personas.png [Preview] [Download]       │              │
│ │ • mapa-mental.jpg [Preview]               │              │
│ └───────────────────────────────────────────┘              │
│                                                             │
│ ┌───────────────────────────────────────────┐              │
│ │ 📐 ETAPA 2: MODELAGEM                     │              │
│ │ Data: 15/01/2024                          │              │
│ │                                           │              │
│ │ Descrição:                                │              │
│ │ Criamos diagramas UML e wireframes...     │              │
│ │                                           │              │
│ │ Anexos (5):                               │              │
│ │ • diagrama-uml.pdf [Download]             │              │
│ │ • wireframe.fig [Download]                │              │
│ │ • arquitetura.png [Preview]               │              │
│ └───────────────────────────────────────────┘              │
│                                                             │
│ [...]                                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ CÓDIGO FONTE                                                │
│                                                             │
│ Visibilidade: Público                                       │
│                                                             │
│ [Ver no GitHub] ou [Baixar .zip]                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ COMENTÁRIOS (23)                                            │
│                                                             │
│ [Se logado: campo para comentar]                            │
│ [Digite seu comentário...]                 [Enviar]         │
│                                                             │
│ ┌───────────────────────────────────────────┐              │
│ │ Ana Paula • há 2 dias      ❤️ 5  💬 Responder │           │
│ │ Projeto incrível! Parabéns pela execução.  │              │
│ │                                           │              │
│ │   └─ João Silva • há 1 dia   ❤️ 2         │              │
│ │      Obrigado, Ana! Ficamos muito felizes │              │
│ └───────────────────────────────────────────┘              │
│                                                             │
│ ┌───────────────────────────────────────────┐              │
│ │ Prof. Roberto • há 5 dias   ❤️ 12         │              │
│ │ Excelente trabalho. Sugestão: adicionar   │              │
│ │ testes automatizados para melhorar...     │              │
│ └───────────────────────────────────────────┘              │
│                                                             │
│ [Ver mais comentários]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘


PERMISSÕES POR TIPO DE USUÁRIO:
--------------------------------

VISITANTE (não logado):
- Pode ver: título, descrição, equipe, timeline (se público)
- Pode ver: código (se público)
- Pode ver: comentários existentes
- NÃO pode: comentar, curtir
- NÃO vê: botões de ação (editar, excluir)
- NÃO vê: emails completos dos autores (censurado)
- NÃO vê: anexos privados

ALUNO LOGADO (não é autor):
- Tudo que visitante pode +
- Pode comentar em projetos públicos
- Pode curtir projeto e comentários
- Pode responder comentários
- NÃO pode: editar ou excluir projeto

AUTOR DO PROJETO (aluno que é membro/líder):
- Tudo que aluno logado pode +
- Vê botão "Editar"
- Líder vê botão "Excluir"
- Pode gerenciar comentários próprios
- Vê anexos mesmo se privados

ORIENTADOR DO PROJETO:
- Tudo que autor pode +
- Pode fazer ajustes no projeto
- Pode moderar comentários
- Vê todas as estatísticas detalhadas
- Vê anexos mesmo se privados

ADMIN:
- Acesso total irrestrito
- Pode editar qualquer parte
- Pode excluir projeto
- Pode transferir liderança
- Pode moderar/remover comentários
- Vê logs de auditoria


ENDPOINT:
---------
GET /projetos/{uuid}

Headers:
Authorization: Bearer {token} (opcional para visitantes)

Query params:
- incluirComentarios: boolean (default: true)
- comentariosLimite: number (default: 10)
- comentariosOffset: number (default: 0)

Resposta sucesso (200):
{
  "uuid": "projeto-123",
  "titulo": "Sistema de Gestão Escolar",
  "descricao": "<p>Este projeto visa...</p>",
  "descricaoPlainText": "Este projeto visa...",
  
  "informacoesAcademicas": {
    "curso": "Desenvolvimento de Sistemas",
    "cursoUuid": "curso-123",
    "turma": "DS-2024-1A",
    "turmaUuid": "turma-456",
    "unidadeCurricular": {
      "uuid": "uc-789",
      "nome": "Programação Web",
      "codigo": "PW-101"
    },
    "participouSaga": true,
    "labMaker": true,
    "nomeLab": "Lab Maker Central",
    "itinerario": false
  },
  
  "categoria": "Aplicativo / Site",
  "modalidade": "GRUPO",
  "faseAtual": "PROTOTIPAGEM",
  "faseBadge": {
    "nome": "Fase 3",
    "cor": "roxo",
    "icone": "wrench"
  },
  
  "banner": {
    "url": "https://storage.com/banners/projeto-123.jpg",
    "urlThumbnail": "https://storage.com/banners/projeto-123-thumb.jpg"
  },
  
  "status": "EM_ANDAMENTO",
  "visualizacoes": 1234,
  "curtidas": 89,
  "totalComentarios": 23,
  
  "criadoEm": "2024-01-10T10:00:00Z",
  "publicadoEm": "2024-01-10T14:30:00Z",
  "atualizadoEm": "2024-02-15T14:30:00Z",
  "atualizadoEmTexto": "Há 2 dias",
  
  "equipe": {
    "lider": {
      "uuid": "aluno-1",
      "nome": "João Silva",
      "matricula": "202401234",
      "email": "joao@ba.estudante.senai.br",
      "emailCensurado": "joao.s***@ba.estudante.senai.br",
      "avatarUrl": "https://...",
      "papel": "LIDER"
    },
    "membros": [
      {
        "uuid": "aluno-2",
        "nome": "Maria Santos",
        "matricula": "202401235",
        "emailCensurado": "maria.s***@ba.estudante.senai.br",
        "avatarUrl": "https://...",
        "papel": "DESENVOLVEDOR"
      },
      {
        "uuid": "aluno-3",
        "nome": "Pedro Costa",
        "matricula": "202401236",
        "emailCensurado": "pedro.c***@ba.estudante.senai.br",
        "avatarUrl": "https://...",
        "papel": "DESIGNER"
      }
    ],
    "totalMembros": 3
  },
  
  "orientador": {
    "uuid": "prof-1",
    "nome": "Prof. Carlos Santos",
    "especialidade": "Programação Web",
    "departamento": "Tecnologia da Informação",
    "avatarUrl": "https://..."
  },
  
  "coorientador": null,
  
  "etapas": [
    {
      "uuid": "etapa-1",
      "fase": "IDEACAO",
      "nome": "Ideação",
      "ordem": 1,
      "concluida": true,
      "descricao": "Nesta fase realizamos brainstorming...",
      "dataInicio": "2024-01-10",
      "dataFim": "2024-01-14",
      "anexos": [
        {
          "uuid": "anexo-1",
          "nome": "brainstorming.pdf",
          "url": "https://storage.com/projetos/projeto-123/ideacao/brainstorming.pdf",
          "urlDownload": "https://storage.com/projetos/projeto-123/ideacao/brainstorming.pdf?download=true",
          "tipo": "pdf",
          "tamanhoBytes": 1258291,
          "tamanhoFormatado": "1.2 MB",
          "ordem": 1,
          "uploadEm": "2024-01-14T16:00:00Z"
        },
        {
          "uuid": "anexo-2",
          "nome": "personas.png",
          "url": "https://storage.com/projetos/projeto-123/ideacao/personas.png",
          "urlPreview": "https://storage.com/projetos/projeto-123/ideacao/personas-preview.png",
          "tipo": "image",
          "tamanhoBytes": 524288,
          "tamanhoFormatado": "512 KB",
          "ordem": 2
        },
        {
          "uuid": "anexo-3",
          "nome": "mapa-mental.jpg",
          "url": "https://...",
          "tipo": "image",
          "tamanhoBytes": 838860,
          "tamanhoFormatado": "819 KB",
          "ordem": 3
        }
      ],
      "totalAnexos": 3
    },
    {
      "uuid": "etapa-2",
      "fase": "MODELAGEM",
      "nome": "Modelagem",
      "ordem": 2,
      "concluida": true,
      "descricao": "Criamos diagramas UML...",
      "dataInicio": "2024-01-15",
      "dataFim": "2024-01-21",
      "anexos": [
        {
          "uuid": "anexo-4",
          "nome": "diagrama-uml.pdf",
          "url": "https://...",
          "tipo": "pdf",
          "tamanhoBytes": 2202009,
          "tamanhoFormatado": "2.1 MB"
        },
        {
          "uuid": "anexo-5",
          "nome": "wireframe.fig",
          "url": "https://...",
          "tipo": "document",
          "tamanhoBytes": 3670016,
          "tamanhoFormatado": "3.5 MB"
        }
      ],
      "totalAnexos": 5
    },
    {
      "uuid": "etapa-3",
      "fase": "PROTOTIPAGEM",
      "nome": "Prototipagem",
      "ordem": 3,
      "concluida": false,
      "emAndamento": true,
      "descricao": "Desenvolvemos protótipo funcional...",
      "dataInicio": "2024-01-22",
      "anexos": [...]
    },
    {
      "uuid": "etapa-4",
      "fase": "VALIDACAO",
      "nome": "Validação",
      "ordem": 4,
      "concluida": false,
      "emAndamento": false,
      "descricao": "Realizamos testes com usuários...",
      "anexos": []
    }
  ],
  
  "codigo": {
    "temCodigo": true,
    "tipo": "link",
    "plataforma": "GITHUB",
    "url": "https://github.com/usuario/projeto",
    "visibilidade": "PUBLICO",
    "acessivel": true
  },
  
  "tecnologias": [
    {
      "uuid": "tech-1",
      "nome": "React",
      "categoria": "Frontend"
    },
    {
      "uuid": "tech-2",
      "nome": "Node.js",
      "categoria": "Backend"
    },
    {
      "uuid": "tech-3",
      "nome": "PostgreSQL",
      "categoria": "Database"
    },
    {
      "uuid": "tech-4",
      "nome": "TypeScript",
      "categoria": "Language"
    },
    {
      "uuid": "tech-5",
      "nome": "Docker",
      "categoria": "DevOps"
    }
  ],
  
  "comentarios": {
    "total": 23,
    "carregados": 10,
    "temMais": true,
    "items": [
      {
        "uuid": "com-1",
        "usuario": {
          "uuid": "user-10",
          "nome": "Ana Paula",
          "avatarUrl": "https://...",
          "tipo": "ALUNO"
        },
        "texto": "Projeto incrível! Parabéns pela execução.",
        "curtidas": 5,
        "usuarioCurtiu": false,
        "criadoEm": "2024-02-13T16:20:00Z",
        "criadoEmTexto": "Há 2 dias",
        "editado": false,
        "respostas": [
          {
            "uuid": "com-2",
            "usuario": {
              "uuid": "aluno-1",
              "nome": "João Silva",
              "avatarUrl": "https://..."
            },
            "texto": "Obrigado, Ana! Ficamos muito felizes.",
            "curtidas": 2,
            "usuarioCurtiu": false,
            "criadoEm": "2024-02-14T10:15:00Z",
            "criadoEmTexto": "Há 1 dia"
          }
        ],
        "totalRespostas": 1
      },
      {
        "uuid": "com-3",
        "usuario": {
          "uuid": "prof-5",
          "nome": "Prof. Roberto",
          "avatarUrl": "https://...",
          "tipo": "PROFESSOR"
        },
        "texto": "Excelente trabalho. Sugestão: adicionar testes automatizados...",
        "curtidas": 12,
        "usuarioCurtiu": true,
        "criadoEm": "2024-02-10T09:30:00Z",
        "criadoEmTexto": "Há 5 dias",
        "respostas": [],
        "totalRespostas": 0
      }
    ]
  },
  
  "permissoes": {
    "podeEditar": true,
    "podeExcluir": true,
    "podeComentar": true,
    "podeCurtir": true,
    "podeVerAnexosPrivados": true,
    "podeVerCodigoPrivado": true,
    "podeTransferir": false,
    "podeModerar": false
  },
  
  "usuarioCurtiu": false,
  "usuarioEAutor": true,
  "usuarioEOrientador": false
}

O QUE O BACKEND FAZ:
--------------------
1. Valida UUID do projeto
2. Busca projeto no banco
3. Verifica se projeto existe e está publicado
4. Incrementa contador de visualizações (+1)
   - Salva em tabela de analytics (opcional)
   - Atualiza campo "visualizacoes" do projeto
5. Extrai usuário do token (se fornecido)
6. Calcula permissões baseado no usuário:
   - É autor? É líder? É orientador? É admin?
7. Busca todos os dados relacionados:
   - Informações acadêmicas (curso, turma, UC)
   - Equipe completa (líder + membros)
   - Orientador e coorientador
   - Todas as etapas com anexos
   - Código fonte
   - Tecnologias
   - Comentários (com paginação)
8. Aplica filtros de privacidade:
   - Se anexos privados e usuário sem permissão: não retorna URLs
   - Se código privado: não retorna URL
   - Censura emails para visitantes
9. Formata dados:
   - Datas em texto legível
   - Tamanhos de arquivos formatados
   - Contadores de curtidas/comentários
10. Verifica se usuário curtiu o projeto
11. Busca comentários com respostas (estrutura em árvore)
12. Retorna JSON completo estruturado

ERROS POSSÍVEIS:
----------------

Status 404 - Projeto não encontrado:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Projeto não encontrado",
  "projetoUuid": "projeto-invalido-123"
}

Status 403 - Projeto privado:
{
  "statusCode": 403,
  "error": "Forbidden",
  "mensagem": "Este projeto é privado. Apenas autores e orientador podem visualizar.",
  "requerLogin": true
}

Status 410 - Projeto arquivado:
{
  "statusCode": 410,
  "error": "Gone",
  "mensagem": "Este projeto foi arquivado e não está mais disponível",
  "deletadoEm": "2024-02-01T12:00:00Z"
}

Status 500 - Erro ao incrementar visualizações:
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "mensagem": "Erro ao registrar visualização, mas projeto foi carregado"
}

Status 400 - UUID inválido:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "UUID do projeto inválido",
  "uuidFornecido": "abc-123"
}


================================================================================
6. EDITAR PROJETO
================================================================================

CONCEITO:
---------
Permite que autores, orientadores ou admin editem informações de projetos já publicados.
Usa o mesmo formulário da criação, mas preenchido com dados existentes.
Registra histórico de alterações para auditoria.

QUEM PODE EDITAR:
-----------------
- Líder do projeto (quem criou)
- Orientador designado
- Admin do sistema

Membros da equipe (não líderes) NÃO podem editar

O QUE PODE SER EDITADO:
------------------------
- Título do projeto
- Descrição
- Categoria
- Banner (substituir imagem)
- Adicionar ou remover autores
- Trocar orientador
- Editar descrição das etapas
- Adicionar novos anexos às etapas
- Remover anexos das etapas
- Mudar fase atual do projeto
- Mudar visibilidade (código/anexos)
- Atualizar link do repositório
- Adicionar/remover tecnologias

O QUE NÃO PODE SER EDITADO:
----------------------------
- UUID do projeto
- Curso e Turma (apenas admin pode alterar)
- Data de criação
- Contador de visualizações
- Contador de curtidas
- Comentários de outros usuários
- Status do projeto (só muda por ações específicas)

FLUXO:
------
1. Usuário acessa página do projeto
2. Clica em botão "Editar" (se tiver permissão)
3. Sistema carrega formulário idêntico ao de criação
4. Campos vêm preenchidos com dados atuais
5. Usuário faz alterações desejadas
6. Clica em "Salvar Alterações"
7. Sistema valida tudo
8. Salva alterações no banco
9. Registra no histórico
10. Notifica equipe sobre mudanças
11. Redireciona para página do projeto atualizado

ENDPOINT:
---------
PATCH /projetos/{uuid}

Headers:
Authorization: Bearer {token}

Body (pode enviar apenas os campos que mudaram):
{
  "titulo": "Sistema de Gestão Escolar - Nova Versão",
  "descricao": "<p>Descrição atualizada...</p>",
  "categoria": "Aplicativo / Site",
  "faseAtual": "IMPLEMENTACAO",
  "autoresUuids": ["aluno-1", "aluno-2", "aluno-3", "aluno-4"],
  "orientadorUuid": "prof-2",
  "tecnologias": ["React", "Node.js", "MongoDB", "AWS"],
  "visibilidadeCodigo": "PRIVADO",
  "linkRepositorio": "https://github.com/usuario/projeto-v2"
}

Para trocar banner:
Content-Type: multipart/form-data
Body:
- banner: File (nova imagem)
- [outros campos em JSON]

Resposta sucesso (200):
{
  "mensagem": "Projeto atualizado com sucesso!",
  "projeto": {
    "uuid": "projeto-123",
    "titulo": "Sistema de Gestão Escolar - Nova Versão",
    "atualizadoEm": "2024-02-15T14:30:00Z"
  },
  "alteracoes": [
    {
      "campo": "titulo",
      "valorAnterior": "Sistema de Gestão Escolar",
      "valorNovo": "Sistema de Gestão Escolar - Nova Versão"
    },
    {
      "campo": "banner",
      "acao": "substituido",
      "detalhes": "Banner atualizado"
    },
    {
      "campo": "autores",
      "acao": "adicionado",
      "detalhes": "Novo autor: Ana Paula"
    },
    {
      "campo": "faseAtual",
      "valorAnterior": "PROTOTIPAGEM",
      "valorNovo": "IMPLEMENTACAO"
    }
  ],
  "totalAlteracoes": 4
}

O QUE O BACKEND FAZ:
--------------------
1. Valida token JWT e extrai usuário
2. Valida UUID do projeto
3. Busca projeto no banco
4. Verifica permissões:
   ```typescript
   const usuarioELider = projeto.liderUuid === usuario.uuid
   const usuarioEOrientador = projeto.orientadorUuid === usuario.uuid
   const usuarioEAdmin = usuario.tipo === 'ADMIN'
   
   if (!usuarioELider && !usuarioEOrientador && !usuarioEAdmin) {
     throw new ForbiddenException('Sem permissão para editar')
   }
   ```
5. Valida dados recebidos (mesmas validações da criação)
6. Para cada campo alterado:
   
   a) TÍTULO:
      - Valida tamanho (10-255 chars)
      - Sanitiza texto
      - Atualiza no banco
      - Registra no histórico
   
   b) DESCRIÇÃO:
      - Valida tamanho (100-5000 chars)
      - Sanitiza HTML (previne XSS)
      - Atualiza no banco
      - Registra no histórico
   
   c) BANNER:
      - Valida nova imagem (formato, tamanho)
      - Deleta banner antigo do storage
      - Faz upload do novo
      - Atualiza URL no banco
      - Registra no histórico
   
   d) AUTORES:
      - Identifica quem foi adicionado
      - Identifica quem foi removido
      - Valida novos autores (existem? são alunos?)
      - Remove relações antigas (DELETE projetos_alunos)
      - Cria novas relações (INSERT projetos_alunos)
      - Notifica novos autores
      - Registra no histórico
   
   e) ORIENTADOR:
      - Valida novo orientador (existe? é professor?)
      - Atualiza relação em projetos_professores
      - Notifica novo orientador
      - Notifica orientador anterior (foi substituído)
      - Registra no histórico
   
   f) ETAPAS:
      - Permite editar descrições
      - Permite adicionar novos anexos (upload + INSERT)
      - Permite remover anexos (DELETE + remove do storage)
      - Registra no histórico
   
   g) FASE ATUAL:
      - Valida nova fase
      - Atualiza campo fase_atual
      - Registra no histórico
   
   h) CÓDIGO:
      - Se trocar de ZIP para link (ou vice-versa):
        * Deleta arquivo antigo (se ZIP)
        * Faz upload novo (se ZIP)
        * Atualiza campos correspondentes
      - Registra no histórico
   
   i) TECNOLOGIAS:
      - Identifica quais foram adicionadas/removidas
      - Remove relações antigas
      - Cria novas relações em projetos_tecnologias
      - Registra no histórico

7. Salva tudo no histórico de alterações:
   ```sql
   INSERT INTO historico_alteracoes (
     projeto_uuid,
     usuario_uuid,
     campo,
     valor_anterior,
     valor_novo,
     tipo_alteracao,
     data_alteracao
   ) VALUES (...)
   ```

8. Atualiza timestamp do projeto:
   ```sql
   UPDATE projetos 
   SET atualizado_em = NOW(),
       atualizado_por_uuid = '{usuario_uuid}'
   WHERE uuid = '{projeto_uuid}'
   ```

9. Envia notificações:
   - Para todos os autores: "O projeto [Título] foi atualizado"
   - Para orientador (se mudou algo significativo)
   - Não envia se quem editou é o próprio destinatário

10. Retorna resumo das alterações

ERROS POSSÍVEIS:
----------------

Status 403 - Sem permissão:
{
  "statusCode": 403,
  "error": "Forbidden",
  "mensagem": "Você não tem permissão para editar este projeto. Apenas o líder, orientador ou admin podem editar.",
  "usuarioTipo": "ALUNO",
  "usuarioEAutor": true,
  "usuarioELider": false
}

Status 404 - Projeto não encontrado:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Projeto não encontrado",
  "projetoUuid": "projeto-invalido-123"
}

Status 400 - Validação falhou:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Título deve ter entre 10 e 255 caracteres",
  "campo": "titulo",
  "valorFornecido": "ABC",
  "tamanhoAtual": 3,
  "minimoRequerido": 10
}

Status 400 - Autor não pode ser removido:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Não é possível remover o líder do projeto. Transfira a liderança primeiro.",
  "autorUuid": "aluno-1",
  "autorNome": "João Silva",
  "papel": "LIDER"
}

Status 404 - Orientador inválido:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Professor orientador não encontrado",
  "orientadorUuid": "prof-invalido-789"
}

Status 400 - Orientador não é professor:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Orientador selecionado não é um professor ativo",
  "usuarioUuid": "user-999",
  "tipoAtual": "ALUNO"
}

Status 413 - Banner muito grande:
{
  "statusCode": 413,
  "error": "Payload Too Large",
  "mensagem": "Novo banner excede o tamanho máximo de 5MB",
  "tamanhoFornecido": "8.2 MB"
}

Status 400 - Banner formato inválido:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Novo banner deve ser JPG, PNG ou WebP",
  "formatoFornecido": "gif"
}

Status 500 - Erro ao deletar arquivo antigo:
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "mensagem": "Erro ao remover banner anterior do storage. Alteração foi cancelada."
}

Status 400 - Fase inválida:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Fase do projeto inválida",
  "faseFornecida": "FINALIZACAO",
  "fasesValidas": ["IDEACAO", "MODELAGEM", "PROTOTIPAGEM", "IMPLEMENTACAO"]
}

Status 409 - Autor duplicado:
{
  "statusCode": 409,
  "error": "Conflict",
  "mensagem": "Autor já está na lista do projeto",
  "autorUuid": "aluno-5",
  "autorNome": "Pedro Santos"
}

Status 400 - Projeto arquivado:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Não é possível editar projeto arquivado",
  "statusAtual": "ARQUIVADO"
}

Status 500 - Erro ao salvar:
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "mensagem": "Erro ao salvar alterações. Tente novamente."
}


================================================================================
7. EXCLUIR PROJETO
================================================================================

CONCEITO:
---------
Permite remover projetos do sistema.
Duas opções: Soft Delete (recomendado) ou Hard Delete (permanente).
Soft Delete mantém dados no banco para auditoria e possível restauração.

QUEM PODE EXCLUIR:
------------------
- Líder do projeto
- Admin do sistema

Orientador NÃO pode excluir (apenas editar)
Membros regulares NÃO podem excluir

TIPOS DE EXCLUSÃO:
------------------

SOFT DELETE (Recomendado - padrão):
- Não remove dados do banco
- Marca projeto como "ARQUIVADO"
- Adiciona timestamp "deletado_em"
- Adiciona "deletado_por_uuid"
- Mantém todos os anexos, comentários, histórico
- Admin pode restaurar depois
- Não aparece em buscas normais
- Preserva integridade para relatórios

HARD DELETE (Permanente - apenas admin):
- Remove TUDO do banco de dados
- Deleta TODOS os arquivos do storage
- Remove comentários, curtidas, notificações
- Remove relações com autores, orientador
- Remove histórico de alterações
- Ação IRREVERSÍVEL
- Só deve ser usado em casos específicos

FLUXO DE EXCLUSÃO:
------------------
1. Usuário acessa página do projeto
2. Clica em botão "Excluir" (se tiver permissão)
3. Sistema exibe modal de confirmação:
   ```
   ⚠️ ATENÇÃO
   
   Tem certeza que deseja excluir o projeto 
   "Sistema de Gestão Escolar"?
   
   Esta ação não pode ser desfeita.
   
   [Cancelar] [Confirmar Exclusão]
   ```
4. Usuário confirma
5. Sistema executa exclusão (soft ou hard)
6. Notifica equipe e orientador
7. Registra no log de auditoria
8. Redireciona para dashboard ou lista de projetos

ENDPOINTS:
----------

1. SOFT DELETE (padrão):
DELETE /projetos/{uuid}

Headers:
Authorization: Bearer {token}

Body: Nenhum

Resposta (200):
{
  "mensagem": "Projeto arquivado com sucesso",
  "projeto": {
    "uuid": "projeto-123",
    "titulo": "Sistema de Gestão Escolar",
    "status": "ARQUIVADO",
    "deletadoEm": "2024-02-15T16:00:00Z",
    "deletadoPor": "João Silva"
  },
  "podeSerRestaurado": true
}


2. HARD DELETE (apenas admin):
DELETE /projetos/{uuid}?permanent=true

Headers:
Authorization: Bearer {token}

Query params:
- permanent: true (obrigatório)
- confirmacao: "EXCLUIR PERMANENTEMENTE" (string de confirmação)

Resposta (200):
{
  "mensagem": "Projeto excluído permanentemente",
  "projeto": {
    "uuid": "projeto-123",
    "titulo": "Sistema de Gestão Escolar"
  },
  "dadosRemovidos": {
    "totalArquivosDeletados": 15,
    "espacoLiberado": "125.5 MB",
    "comentariosRemovidos": 23,
    "curtidasRemovidas": 89,
    "notificacoesRemovidas": 3691
  },
  "avisoFinal": "Esta ação é irreversível"
}

O QUE O BACKEND FAZ - SOFT DELETE:
-----------------------------------
1. Valida token e extrai usuário
2. Valida UUID do projeto
3. Busca projeto no banco
4. Verifica permissões:
   ```typescript
   const usuarioELider = projeto.liderUuid === usuario.uuid
   const usuarioEAdmin = usuario.tipo === 'ADMIN'
   
   if (!usuarioELider && !usuarioEAdmin) {
     throw new ForbiddenException('Apenas líder ou admin podem excluir')
   }
   ```
5. Verifica se já não está arquivado
6. Atualiza registro do projeto:
   ```sql
   UPDATE projetos 
   SET 
     status = 'ARQUIVADO',
     deletado_em = NOW(),
     deletado_por_uuid = '{usuario_uuid}',
     atualizado_em = NOW()
   WHERE uuid = '{projeto_uuid}'
   ```
7. NÃO remove arquivos do storage (mantém tudo)
8. NÃO remove comentários, curtidas, etc
9. Envia notificações:
   - Para todos os autores: "O projeto [Título] foi arquivado"
   - Para orientador: "Projeto [Título] foi arquivado por [Nome]"
10. Registra no log de auditoria:
    - Ação: ARQUIVAR_PROJETO
    - Usuário que executou
    - Data/hora
    - IP do usuário
11. Retorna confirmação

O QUE O BACKEND FAZ - HARD DELETE:
-----------------------------------
1. Valida token e extrai usuário
2. Verifica se é ADMIN:
   ```typescript
   if (usuario.tipo !== 'ADMIN') {
     throw new ForbiddenException('Apenas administradores podem fazer exclusão permanente')
   }
   ```
3. Valida string de confirmação
4. Valida UUID do projeto
5. Busca projeto no banco
6. Inicia transação no banco (rollback se algo der errado)
7. Busca TODAS as relações do projeto:
   - Lista de autores
   - Orientador/coorientador
   - Etapas e anexos
   - Comentários e respostas
   - Curtidas
   - Notificações
   - Tecnologias
   - Histórico de alterações
8. Deleta na ordem correta (respeitando foreign keys):
   
   a) Deleta respostas de comentários:
      ```sql
      DELETE FROM comentarios 
      WHERE comentario_pai_uuid IN (
        SELECT uuid FROM comentarios 
        WHERE projeto_uuid = '{projeto_uuid}'
      )
      ```
   
   b) Deleta comentários principais:
      ```sql
      DELETE FROM comentarios 
      WHERE projeto_uuid = '{projeto_uuid}'
      ```
   
   c) Deleta curtidas:
      ```sql
      DELETE FROM curtidas 
      WHERE projeto_uuid = '{projeto_uuid}'
      ```
   
   d) Deleta anexos (tabela):
      ```sql
      DELETE FROM anexos_etapas 
      WHERE etapa_uuid IN (
        SELECT uuid FROM etapas_projeto 
        WHERE projeto_uuid = '{projeto_uuid}'
      )
      ```
   
   e) Deleta arquivos do storage:
      - Banner do projeto
      - Todos os anexos de todas as etapas
      - Código .zip (se tiver)
      - Usa serviço de storage (S3/Cloudinary) para deletar
   
   f) Deleta etapas:
      ```sql
      DELETE FROM etapas_projeto 
      WHERE projeto_uuid = '{projeto_uuid}'
      ```
   
   g) Deleta relações com alunos:
      ```sql
      DELETE FROM projetos_alunos 
      WHERE projeto_uuid = '{projeto_uuid}'
      ```
   
   h) Deleta relações com professores:
      ```sql
      DELETE FROM projetos_professores 
      WHERE projeto_uuid = '{projeto_uuid}'
      ```
   
   i) Deleta relações com tecnologias:
      ```sql
      DELETE FROM projetos_tecnologias 
      WHERE projeto_uuid = '{projeto_uuid}'
      ```
   
   j) Deleta notificações relacionadas:
      ```sql
      DELETE FROM notificacoes 
      WHERE link LIKE '%/projetos/{projeto_uuid}%'
      ```
   
   k) Deleta histórico de alterações:
      ```sql
      DELETE FROM historico_alteracoes 
      WHERE projeto_uuid = '{projeto_uuid}'
      ```
   
   l) Deleta histórico de transferências:
      ```sql
      DELETE FROM historico_transferencias 
      WHERE projeto_uuid = '{projeto_uuid}'
      ```
   
   m) Deleta estatísticas:
      ```sql
      DELETE FROM estatisticas_projetos 
      WHERE projeto_uuid = '{projeto_uuid}'
      ```
   
   n) Finalmente, deleta o projeto principal:
      ```sql
      DELETE FROM projetos 
      WHERE uuid = '{projeto_uuid}'
      ```

9. Commit da transação (se tudo deu certo)
10. Registra no log de auditoria:
    - Ação: EXCLUIR_PERMANENTEMENTE_PROJETO
    - Título do projeto
    - Usuário que executou
    - Timestamp
    - Dados de tamanho e quantidade removidos
11. Conta total de arquivos deletados e espaço liberado
12. Retorna resumo completo da exclusão

ERROS POSSÍVEIS:
----------------

Status 403 - Sem permissão (soft delete):
{
  "statusCode": 403,
  "error": "Forbidden",
  "mensagem": "Apenas o líder do projeto pode arquivar",
  "usuarioAtual": "Maria Santos",
  "liderProjeto": "João Silva"
}

Status 403 - Hard delete sem ser admin:
{
  "statusCode": 403,
  "error": "Forbidden",
  "mensagem": "Apenas administradores podem fazer exclusão permanente",
  "tipoUsuario": "ALUNO"
}

Status 404 - Projeto não encontrado:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Projeto não encontrado",
  "projetoUuid": "projeto-invalido-123"
}

Status 400 - Projeto já arquivado:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Este projeto já foi arquivado",
  "deletadoEm": "2024-02-01T12:00:00Z",
  "deletadoPor": "João Silva"
}

Status 500 - Erro ao deletar arquivos:
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "mensagem": "Erro ao remover arquivos do storage. Operação cancelada.",
  "detalhes": "Connection timeout to storage service"
}

Status 409 - Projeto com dependências:
{
  "statusCode": 409,
  "error": "Conflict",
  "mensagem": "Não é possível excluir. Projeto possui dependências ativas.",
  "dependencias": [
    "3 avaliações pendentes",
    "15 comentários recentes"
  ]
}

Status 400 - Confirmação incorreta:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "String de confirmação incorreta. Digite 'EXCLUIR PERMANENTEMENTE' para confirmar.",
  "confirmacaoFornecida": "EXCLUIR"
}

Status 500 - Erro na transação:
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "mensagem": "Erro durante exclusão. Transação revertida. Nenhum dado foi removido.",
  "detalhes": "Database transaction failed"
}


ENDPOINT PARA RESTAURAR (apenas admin):
----------------------------------------
POST /projetos/{uuid}/restaurar

Headers:
Authorization: Bearer {token}

Body: Nenhum

Resposta (200):
{
  "mensagem": "Projeto restaurado com sucesso",
  "projeto": {
    "uuid": "projeto-123",
    "titulo": "Sistema de Gestão Escolar",
    "status": "EM_ANDAMENTO",
    "restauradoEm": "2024-02-20T10:00:00Z",
    "restauradoPor": "Admin Pedro Silva"
  }
}

O que faz:
1. Valida se usuário é admin
2. Busca projeto arquivado
3. Atualiza status:
   ```sql
   UPDATE projetos 
   SET 
     status = 'EM_ANDAMENTO',
     deletado_em = NULL,
     deletado_por_uuid = NULL,
     restaurado_em = NOW(),
     restaurado_por_uuid = '{admin_uuid}'
   WHERE uuid = '{projeto_uuid}'
   ```
4. Notifica equipe
5. Registra no log


================================================================================
8. TRANSFERIR/HERDAR PROJETO
================================================================================

CONCEITO:
---------
Permite transferir liderança de projetos entre alunos.
Útil quando aluno se forma, desiste ou projeto é retomado por nova turma.
Mantém histórico completo de quem foram os líderes anteriores.

CENÁRIOS DE USO:
----------------
- Aluno se formou e quer passar projeto para outro aluno
- Aluno desistiu do curso ou trancou matrícula
- Projeto foi descontinuado mas nova turma quer retomar
- Mudança de líder dentro da mesma equipe
- Projeto legado sendo continuado

QUEM PODE TRANSFERIR:
---------------------
- Professor orientador do projeto
- Admin do sistema
- Líder atual (com aprovação do orientador)

Alunos regulares NÃO podem transferir sozinhos

TIPOS DE TRANSFERÊNCIA:
-----------------------

1. TRANSFERÊNCIA SIMPLES:
   - Muda apenas o líder
   - Mantém mesma equipe
   - Mantém orientador
   - Ex: João passa liderança para Maria (ambos já na equipe)

2. TRANSFERÊNCIA COM SUBSTITUIÇÃO:
   - Remove líder antigo da equipe
   - Adiciona novo líder
   - Pode trocar orientador também
   - Ex: João se formou, Pedro assume (Pedro não estava na equipe)

3. HERANÇA DE PROJETO:
   - Mantém líder antigo como "ex-membro" ou "fundador"
   - Adiciona novo líder
   - Pode adicionar nova equipe completa
   - Mantém histórico visível
   - Ex: Turma 2024 → Turma 2025

FLUXO DE TRANSFERÊNCIA:
-----------------------
1. Professor/Admin acessa projeto
2. Clica em "Gerenciar Projeto" → "Transferir Liderança"
3. Sistema exibe formulário:

┌──────────────────────────────────────────────────────────┐
│ Transferir Liderança do Projeto                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Projeto: Sistema de Gestão Escolar                      │
│ Líder Atual: João Silva (formado em 2023)              │
│                                                          │
│ Novo Líder*: [Buscar aluno]                             │
│   [Buscar por nome, email ou matrícula]                 │
│                                                          │
│ Motivo da transferência*: [Select]                      │
│   - Aluno se formou                                     │
│   - Aluno desistiu/trancou                              │
│   - Mudança de liderança                                │
│   - Projeto retomado por nova turma                     │
│   - Outro (especificar)                                 │
│                                                          │
│ Observações: [Textarea opcional]                         │
│   Ex: "João se formou em dezembro/2023,                 │
│        Pedro assume o projeto"                           │
│                                                          │
│ [✓] Manter líder anterior no histórico como fundador    │
│ [✓] Notificar novo líder                                │
│ [✓] Notificar líder anterior (se disponível)            │
│ [ ] Também trocar orientador                            │
│                                                          │
│ [Cancelar] [Confirmar Transferência]                     │
└──────────────────────────────────────────────────────────┘

4. Sistema valida tudo
5. Executa transferência
6. Salva no histórico
7. Notifica todos envolvidos
8. Redireciona para página do projeto

ENDPOINT:
---------
POST /projetos/{uuid}/transferir

Headers:
Authorization: Bearer {token}

Body:
{
  "novoLiderUuid": "aluno-456",
  "motivo": "ALUNO_FORMADO",
  "observacoes": "João se formou em dezembro/2023, Pedro Costa assume o projeto",
  "manterLiderAnterior": true,
  "notificarNovoLider": true,
  "notificarLiderAnterior": true,
  "trocarOrientador": false,
  "novoOrientadorUuid": null
}

Motivos possíveis:
- ALUNO_FORMADO
- ALUNO_DESISTIU
- MUDANCA_LIDERANCA
- PROJETO_RETOMADO
- OUTRO

Resposta sucesso (200):
{
  "mensagem": "Liderança transferida com sucesso",
  "transferencia": {
    "uuid": "transferencia-uuid-789",
    "projeto": {
      "uuid": "projeto-123",
      "titulo": "Sistema de Gestão Escolar"
    },
    "liderAnterior": {
      "uuid": "aluno-1",
      "nome": "João Silva",
      "papel": "EX_LIDER"
    },
    "novoLider": {
      "uuid": "aluno-456",
      "nome": "Pedro Costa",
      "papel": "LIDER"
    },
    "motivo": "ALUNO_FORMADO",
    "observacoes": "João se formou...",
    "dataTransferencia": "2024-02-15T17:00:00Z",
    "transferidoPor": {
      "uuid": "prof-1",
      "nome": "Prof. Carlos Santos"
    }
  },
  "notificacoesEnviadas": {
    "novoLider": true,
    "liderAnterior": true,
    "orientador": true,
    "equipe": true
  }
}

O QUE O BACKEND FAZ:
--------------------
1. Valida token e extrai usuário
2. Verifica permissões (professor orientador ou admin)
3. Valida UUID do projeto
4. Busca projeto no banco
5. Valida se novo líder existe e é aluno ativo
6. Verifica se novo líder já não é o líder atual
7. Valida motivo da transferência
8. Inicia transação no banco

9. Se manterLiderAnterior = true:
   - Atualiza papel do líder antigo para "EX_LIDER" ou "FUNDADOR"
   - Mantém na tabela projetos_alunos
   - Adiciona campo metadata JSON:
     ```json
     {
       "foiLider": true,
       "periodoLideranca": {
         "inicio": "2024-01-10",
         "fim": "2024-02-15"
       }
     }
     ```

10. Se manterLiderAnterior = false:
    - Remove líder antigo da equipe completamente
    - DELETE em projetos_alunos

11. Se novo líder JÁ está na equipe:
    - Apenas atualiza papel para "LIDER"
    
12. Se novo líder NÃO está na equipe:
    - Adiciona como novo membro com papel "LIDER"
    - INSERT em projetos_alunos

13. Atualiza campo lider_uuid no projeto:
    ```sql
    UPDATE projetos 
    SET 
      lider_uuid = '{novo_lider_uuid}',
      atualizado_em = NOW()
    WHERE uuid = '{projeto_uuid}'
    ```

14. Salva no histórico de transferências:
    ```sql
    INSERT INTO historico_transferencias (
      uuid,
      projeto_uuid,
      lider_anterior_uuid,
      lider_novo_uuid,
      motivo,
      observacoes,
      transferido_por_uuid,
      data_transferencia
    ) VALUES (...)
    ```

15. Se trocarOrientador = true:
    - Atualiza relação em projetos_professores
    - Notifica novo e antigo orientador

16. Commit da transação

17. Envia notificações:
    
    a) Para novo líder:
       ```json
       {
         "tipo": "PROJETO",
         "titulo": "Você é o novo líder do projeto",
         "mensagem": "Você agora lidera o projeto 'Sistema de Gestão Escolar'",
         "link": "/projetos/projeto-123"
       }
       ```
    
    b) Para líder anterior (se disponível):
       ```json
       {
         "tipo": "PROJETO",
         "titulo": "Liderança do projeto transferida",
         "mensagem": "A liderança do projeto 'Sistema de Gestão Escolar' foi transferida para Pedro Costa",
         "link": "/projetos/projeto-123"
       }
       ```
    
    c) Para orientador:
       ```json
       {
         "tipo": "PROJETO",
         "titulo": "Liderança de projeto transferida",
         "mensagem": "Liderança de 'Sistema de Gestão Escolar' transferida de João Silva para Pedro Costa. Motivo: Aluno se formou",
         "link": "/projetos/projeto-123"
       }
       ```
    
    d) Para toda equipe:
       ```json
       {
         "tipo": "PROJETO",
         "titulo": "Mudança de liderança",
         "mensagem": "Pedro Costa agora é o líder do projeto",
         "link": "/projetos/projeto-123"
       }
       ```

18. Registra no log de auditoria

19. Retorna confirmação completa

ERROS POSSÍVEIS:
----------------

Status 403 - Sem permissão:
{
  "statusCode": 403,
  "error": "Forbidden",
  "mensagem": "Apenas professor orientador ou admin podem transferir liderança de projeto",
  "usuarioTipo": "ALUNO",
  "requerido": ["PROFESSOR", "ADMIN"]
}

Status 404 - Novo líder não encontrado:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Aluno selecionado como novo líder não encontrado no sistema",
  "alunoUuid": "aluno-invalido-456"
}

Status 400 - Novo líder inativo:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Aluno selecionado não está ativo no sistema",
  "alunoNome": "Pedro Costa",
  "statusAtual": "TRANCADO"
}

Status 400 - Novo líder já é líder:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Aluno selecionado já é o líder atual do projeto",
  "alunoNome": "João Silva"
}

Status 400 - Motivo não especificado:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Motivo da transferência é obrigatório",
  "motivosValidos": [
    "ALUNO_FORMADO",
    "ALUNO_DESISTIU",
    "MUDANCA_LIDERANCA",
    "PROJETO_RETOMADO",
    "OUTRO"
  ]
}

Status 400 - Motivo inválido:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Motivo da transferência inválido",
  "motivoFornecido": "APOSENTADORIA",
  "motivosValidos": [...]
}

Status 404 - Projeto não encontrado:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Projeto não encontrado",
  "projetoUuid": "projeto-invalido-123"
}

Status 400 - Projeto arquivado:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Não é possível transferir liderança de projeto arquivado",
  "statusAtual": "ARQUIVADO"
}

Status 404 - Novo orientador não encontrado:
{
  "statusCode": 404,
  "error": "Not Found",
  "mensagem": "Professor selecionado como novo orientador não encontrado",
  "orientadorUuid": "prof-invalido-999"
}

Status 500 - Erro na transação:
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "mensagem": "Erro ao processar transferência. Nenhuma alteração foi feita.",
  "detalhes": "Transaction rolled back"
}


VISUALIZAÇÃO DO HISTÓRICO DE TRANSFERÊNCIAS:
---------------------------------------------
Na página do projeto, exibir seção:

HISTÓRICO DE LIDERANÇA
• 15/02/2024: Liderança transferida de João Silva para Pedro Costa
  Motivo: Aluno se formou
  Por: Prof. Carlos Santos

• 10/01/2024: Projeto criado
  Líder inicial: João Silva




================================================================================
9. MEUS PROJETOS
================================================================================

CONCEITO:
---------
Página dedicada listando APENAS os projetos do usuário logado.
Interface similar ao dashboard mas focada exclusivamente em projetos próprios.
Permite filtros, ordenação, busca e ações rápidas.
Exibe estatísticas pessoais detalhadas.

PARA QUEM:
----------
ALUNOS: Veem projetos onde são autores (líder ou membro)
PROFESSORES: Veem projetos onde são orientadores
ADMIN: Tem visão de todos os projetos (link diferente)

LAYOUT DA PÁGINA:
-----------------

[HEADER]
Meus Projetos

[CARDS DE ESTATÍSTICAS - em linha]
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total       │ Em Rascunho │ Em Andamento│ Concluídos  │
│    5        │      1      │      3      │      1      │
└─────────────┴─────────────┴─────────────┴─────────────┘

[FILTROS E AÇÕES]
┌──────────────────────────────────────────────────────────┐
│ [Filtros ▼]  [Buscar...        ]  [Ordenar ▼] [+ Novo]  │
│                                                          │
│ Filtros ativos:                                          │
│ [Status: Todos ×] [Fase: Todas ×] [Ano: 2024 ×]        │
└──────────────────────────────────────────────────────────┘

[TABS DE NAVEGAÇÃO]
[Todos (5)] [Rascunhos (1)] [Publicados (4)] [Arquivados (0)]

[LISTAGEM DE PROJETOS]
Mostrando 5 de 5 projetos

┌──────────────────────────────────────────────────────────┐
│ [Banner miniatura]                                        │
│ Sistema de Gestão Escolar              [Fase 3]          │
│ Atualizado há 2 dias                   Visualizações: 150│
│ Status: EM_ANDAMENTO                   Curtidas: 25      │
│                                                          │
│ [Editar] [Ver Detalhes] [...]                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ [Banner miniatura]                                        │
│ App de Gestão de Tarefas               [Rascunho]        │
│ Criado há 1 semana                     Visualizações: 0  │
│ Status: RASCUNHO                                         │
│                                                          │
│ [Continuar Edição] [Publicar] [Excluir]                 │
└──────────────────────────────────────────────────────────┘

[... mais projetos ...]

[PAGINAÇÃO]
← Anterior  1  2  3  Próximo →


FILTROS DISPONÍVEIS:
--------------------

Status:
- Todos
- Rascunho
- Em Andamento
- Concluído
- Arquivado

Fase:
- Todas
- Ideação
- Modelagem
- Prototipagem
- Implementação

Categoria:
- Todas
- Aplicativo / Site
- IoT
- Automação
- [todas as categorias...]

Período:
- Todos os tempos
- Este mês
- Este ano
- 2024
- 2023
- Custom (data início - data fim)

Papel no Projeto (para alunos):
- Todos
- Líder
- Membro

Ordenação:
- Mais recentes
- Mais antigos
- Título (A-Z)
- Título (Z-A)
- Mais visualizados
- Mais curtidos
- Última atualização

ENDPOINT:
---------
GET /meus-projetos

Headers:
Authorization: Bearer {token}

Query params:
- status: string (RASCUNHO | EM_ANDAMENTO | CONCLUIDO | ARQUIVADO)
- fase: string (IDEACAO | MODELAGEM | PROTOTIPAGEM | IMPLEMENTACAO)
- categoria: string
- ano: number
- papel: string (LIDER | MEMBRO) - apenas para alunos
- busca: string (busca por título ou descrição)
- ordenar: string (recentes | antigos | titulo_asc | titulo_desc | visualizacoes | curtidas | atualizacao)
- pagina: number (default: 1)
- limite: number (default: 20, max: 100)

Exemplos:
GET /meus-projetos?status=EM_ANDAMENTO&fase=PROTOTIPAGEM&pagina=1
GET /meus-projetos?busca=gestão&ordenar=curtidas&limite=10
GET /meus-projetos?ano=2024&papel=LIDER

Resposta para ALUNO (200):
{
  "tipo": "ALUNO",
  "usuario": {
    "uuid": "user-123",
    "nome": "João Silva"
  },
  "estatisticas": {
    "total": 5,
    "rascunhos": 1,
    "emAndamento": 3,
    "concluidos": 1,
    "arquivados": 0,
    "comoLider": 2,
    "comoMembro": 3,
    "porFase": {
      "ideacao": 0,
      "modelagem": 1,
      "prototipagem": 2,
      "implementacao": 1,
      "concluidos": 1
    }
  },
  "filtrosAtivos": {
    "status": "EM_ANDAMENTO",
    "fase": "PROTOTIPAGEM",
    "ano": null,
    "categoria": null,
    "papel": null,
    "busca": null
  },
  "projetos": [
    {
      "uuid": "projeto-123",
      "titulo": "Sistema de Gestão Escolar",
      "descricaoResumida": "Plataforma web para gerenciamento de instituições...",
      "bannerUrl": "https://storage.com/banners/projeto-123.jpg",
      "bannerThumbnailUrl": "https://storage.com/banners/projeto-123-thumb.jpg",
      "status": "EM_ANDAMENTO",
      "faseAtual": "PROTOTIPAGEM",
      "faseBadge": {
        "nome": "Fase 3",
        "cor": "roxo"
      },
      "categoria": "Aplicativo / Site",
      "meuPapel": "LIDER",
      "equipe": {
        "total": 3,
        "avatares": [
          "https://...",
          "https://...",
          "https://..."
        ]
      },
      "orientador": {
        "nome": "Prof. Carlos Santos",
        "avatarUrl": "https://..."
      },
      "visualizacoes": 150,
      "curtidas": 25,
      "comentarios": 12,
      "criadoEm": "2024-01-10T10:00:00Z",
      "atualizadoEm": "2024-02-15T14:30:00Z",
      "atualizadoEmTexto": "Há 2 dias",
      "progresso": 75
    },
    {
      "uuid": "projeto-456",
      "titulo": "App de Gestão de Tarefas",
      "descricaoResumida": "Aplicativo mobile para gestão de tarefas...",
      "bannerUrl": null,
      "status": "RASCUNHO",
      "faseAtual": "IDEACAO",
      "categoria": "Aplicativo / Site",
      "meuPapel": "MEMBRO",
      "equipe": {
        "total": 2,
        "avatares": ["https://...", "https://..."]
      },
      "orientador": {
        "nome": "Prof. Maria Santos",
        "avatarUrl": "https://..."
      },
      "visualizacoes": 0,
      "curtidas": 0,
      "comentarios": 0,
      "criadoEm": "2024-02-08T16:00:00Z",
      "atualizadoEm": "2024-02-08T16:00:00Z",
      "atualizadoEmTexto": "Há 1 semana",
      "progresso": 25
    }
  ],
  "paginacao": {
    "paginaAtual": 1,
    "itensPorPagina": 20,
    "totalItens": 5,
    "totalPaginas": 1,
    "temProxima": false,
    "temAnterior": false
  }
}

Resposta para PROFESSOR (200):
{
  "tipo": "PROFESSOR",
  "usuario": {
    "uuid": "prof-1",
    "nome": "Prof. Carlos Santos"
  },
  "estatisticas": {
    "total": 14,
    "rascunhos": 2,
    "emAndamento": 10,
    "concluidos": 2,
    "arquivados": 0,
    "porFase": {
      "ideacao": 3,
      "modelagem": 4,
      "prototipagem": 5,
      "implementacao": 2
    },
    "alunosOrientados": 25
  },
  "projetos": [
    {
      "uuid": "projeto-789",
      "titulo": "Sistema IoT para Casa Inteligente",
      "lider": {
        "uuid": "aluno-10",
        "nome": "Pedro Costa",
        "avatarUrl": "https://..."
      },
      "turma": "DS-2024-1A",
      "status": "EM_ANDAMENTO",
      "faseAtual": "IMPLEMENTACAO",
      "categoria": "IoT",
      "equipe": {
        "total": 4
      },
      "visualizacoes": 320,
      "curtidas": 45,
      "criadoEm": "2024-01-15T09:00:00Z",
      "atualizadoEm": "2024-02-14T11:20:00Z",
      "atualizadoEmTexto": "Há 3 dias"
    }
  ],
  "paginacao": {...}
}

O QUE O BACKEND FAZ:
--------------------
1. Valida token JWT e extrai usuário
2. Identifica tipo do usuário (ALUNO ou PROFESSOR)
3. Monta query base:
   
   Para ALUNO:
   ```sql
   SELECT p.* FROM projetos p
   INNER JOIN projetos_alunos pa ON p.uuid = pa.projeto_uuid
   WHERE pa.aluno_uuid = '{usuario_aluno_uuid}'
   AND p.deletado_em IS NULL
   ```
   
   Para PROFESSOR:
   ```sql
   SELECT p.* FROM projetos p
   INNER JOIN projetos_professores pp ON p.uuid = pp.projeto_uuid
   WHERE pp.professor_uuid = '{usuario_professor_uuid}'
   AND pp.tipo = 'ORIENTADOR'
   AND p.deletado_em IS NULL
   ```

4. Aplica filtros recebidos:
   - status: AND p.status = '{status}'
   - fase: AND p.fase_atual = '{fase}'
   - categoria: AND p.categoria = '{categoria}'
   - ano: AND YEAR(p.criado_em) = {ano}
   - papel (aluno): AND pa.papel = '{papel}'
   - busca: AND (p.titulo LIKE '%{busca}%' OR p.descricao LIKE '%{busca}%')

5. Aplica ordenação:
   - recentes: ORDER BY p.criado_em DESC
   - antigos: ORDER BY p.criado_em ASC
   - titulo_asc: ORDER BY p.titulo ASC
   - titulo_desc: ORDER BY p.titulo DESC
   - visualizacoes: ORDER BY p.visualizacoes DESC
   - curtidas: ORDER BY p.curtidas DESC
   - atualizacao: ORDER BY p.atualizado_em DESC

6. Aplica paginação:
   - LIMIT {limite} OFFSET {(pagina - 1) * limite}

7. Para cada projeto retornado:
   - Busca dados da equipe (avatares)
   - Busca orientador
   - Busca contadores (visualizações, curtidas, comentários)
   - Formata datas
   - Gera thumbnail do banner
   - Calcula progresso (baseado em etapas completas)

8. Calcula estatísticas gerais:
   - Conta projetos por status
   - Conta projetos por fase
   - Para aluno: conta como líder vs membro

9. Retorna JSON estruturado com:
   - Estatísticas
   - Filtros ativos
   - Lista de projetos
   - Paginação

AÇÕES RÁPIDAS NOS CARDS:
-------------------------

Para RASCUNHOS:
- [Continuar Edição] → redireciona pro último passo editado
- [Publicar] → abre modal de confirmação e publica
- [Excluir] → exclui rascunho

Para PROJETOS PUBLICADOS:
- [Ver Detalhes] → abre página completa
- [Editar] → abre formulário de edição
- [...] Menu dropdown com:
  * Duplicar projeto
  * Baixar relatório
  * Arquivar
  * Excluir (apenas líder)

ERROS POSSÍVEIS:
----------------

Status 401 - Token ausente:
{
  "statusCode": 401,
  "error": "Unauthorized",
  "mensagem": "Token de autenticação não fornecido"
}

Status 401 - Token inválido:
{
  "statusCode": 401,
  "error": "Unauthorized",
  "mensagem": "Token inválido ou expirado"
}

Status 400 - Filtro inválido:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Valor de filtro 'status' inválido",
  "valorFornecido": "PENDENTE",
  "valoresValidos": ["RASCUNHO", "EM_ANDAMENTO", "CONCLUIDO", "ARQUIVADO"]
}

Status 400 - Ordenação inválida:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Valor de ordenação inválido",
  "valorFornecido": "alfabetica",
  "valoresValidos": ["recentes", "antigos", "titulo_asc", "titulo_desc", "visualizacoes", "curtidas", "atualizacao"]
}

Status 400 - Limite excedido:
{
  "statusCode": 400,
  "error": "Bad Request",
  "mensagem": "Limite de itens por página não pode exceder 100",
  "limiteFornecido": 500,
  "limiteMaximo": 100
}

Status 500 - Erro ao buscar:
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "mensagem": "Erro ao buscar projetos. Tente novamente."
}


================================================================================
10. SISTEMA DE PROGRESSÃO DE FASES (AUTOMÁTICO)
================================================================================

CONCEITO:
---------
Sistema inteligente que detecta automaticamente em qual fase o projeto está
baseado nos anexos e conteúdo adicionados em cada etapa.

Regra fundamental: A fase atual do projeto é determinada pela ÚLTIMA ETAPA
que possui anexos ou conteúdo significativo.

COMO FUNCIONA:
--------------

Quando projeto é criado (Passo 1):
→ Fase inicial: IDEACAO (padrão)

Quando anexos são adicionados (Passo 2):
→ Sistema verifica quais etapas têm anexos
→ Atualiza fase_atual para a última etapa com anexos

Exemplo de progressão:
----------------------

CENÁRIO 1: Projeto novo
- Etapa Ideação: 0 anexos
- Etapa Modelagem: 0 anexos
- Etapa Prototipagem: 0 anexos
- Etapa Implementação: 0 anexos
→ Fase atual: IDEACAO (padrão inicial)

CENÁRIO 2: Adicionou anexos na Ideação
- Etapa Ideação: 3 anexos ✓
- Etapa Modelagem: 0 anexos
- Etapa Prototipagem: 0 anexos
- Etapa Implementação: 0 anexos
→ Fase atual: IDEACAO

CENÁRIO 3: Adicionou anexos na Ideação e Modelagem
- Etapa Ideação: 3 anexos ✓
- Etapa Modelagem: 5 anexos ✓
- Etapa Prototipagem: 0 anexos
- Etapa Implementação: 0 anexos
→ Fase atual: MODELAGEM (última com anexos)

CENÁRIO 4: Adicionou anexos em todas até Prototipagem
- Etapa Ideação: 3 anexos ✓
- Etapa Modelagem: 5 anexos ✓
- Etapa Prototipagem: 4 anexos ✓
- Etapa Implementação: 0 anexos
→ Fase atual: PROTOTIPAGEM

CENÁRIO 5: Projeto completo
- Etapa Ideação: 3 anexos ✓
- Etapa Modelagem: 5 anexos ✓
- Etapa Prototipagem: 4 anexos ✓
- Etapa Implementação: 2 anexos ✓
→ Fase atual: IMPLEMENTACAO

CENÁRIO 6: Pulou etapas (não recomendado mas possível)
- Etapa Ideação: 0 anexos
- Etapa Modelagem: 0 anexos
- Etapa Prototipagem: 3 anexos ✓
- Etapa Implementação: 0 anexos
→ Fase atual: PROTOTIPAGEM (última com anexos)

LÓGICA DE PROGRESSÃO:
---------------------

```typescript
function calcularFaseAtual(etapas: Etapa[]): Fase {
  // Ordem das fases (menor para maior)
  const ordemFases = {
    'IDEACAO': 1,
    'MODELAGEM': 2,
    'PROTOTIPAGEM': 3,
    'IMPLEMENTACAO': 4
  }
  
  let ultimaFaseComAnexos = 'IDEACAO' // padrão
  let maiorOrdem = 1
  
  // Percorre todas as etapas
  for (const etapa of etapas) {
    // Verifica se etapa tem anexos
    if (etapa.anexos && etapa.anexos.length > 0) {
      const ordemAtual = ordemFases[etapa.fase]
      
      // Se ordem atual é maior que a já registrada
      if (ordemAtual > maiorOrdem) {
        maiorOrdem = ordemAtual
        ultimaFaseComAnexos = etapa.fase
      }
    }
  }
  
  return ultimaFaseComAnexos
}
```

QUANDO A FASE É ATUALIZADA:
---------------------------

1. Ao adicionar anexos (Passo 2 da criação):
   - Backend recalcula fase após salvar anexos
   - Atualiza campo fase_atual

2. Ao editar projeto e adicionar novos anexos:
   - Backend recalcula fase
   - Atualiza se necessário

3. Ao remover anexos de uma etapa:
   - Backend recalcula fase
   - Pode retroceder para fase anterior se necessário

4. Manualmente (apenas orientador ou admin):
   - Endpoint específico para forçar mudança de fase
   - Útil para casos excepcionais

REGRAS ESPECIAIS:
-----------------

1. PROJETO PODE RETROCEDER DE FASE:
   Se remover todos os anexos de uma etapa, volta para fase anterior
   Exemplo:
   - Estava em PROTOTIPAGEM
   - Remove todos anexos de Prototipagem
   - Volta para MODELAGEM (se esta tiver anexos)

2. FASE MANUAL TEM PRIORIDADE (OPCIONAL):
   Se orientador/admin definir fase manualmente, sistema respeita
   Campo: fase_manual_definida (boolean)
   Se true: não recalcula automaticamente

3. VALIDAÇÃO DE PUBLICAÇÃO:
   Para publicar projeto, DEVE ter:
   - Pelo menos 1 anexo em ALGUMA etapa
   - OU descrição preenchida em todas as 4 etapas
   - Isso garante conteúdo mínimo

ENDPOINTS RELACIONADOS:
------------------------

1. Recalcular Fase (automático, chamado internamente):
POST /projetos/{uuid}/recalcular-fase (interno)

Não requer body, apenas recalcula baseado nos anexos atuais

2. Forçar Mudança de Fase (manual - apenas orientador/admin):
PATCH /projetos/{uuid}/fase

Headers:
Authorization: Bearer {token}

Body:
{
  "faseNova": "IMPLEMENTACAO",
  "motivo": "Projeto já está em fase de implementação mas faltou documentar",
  "forcarManual": true
}

Resposta (200):
{
  "mensagem": "Fase atualizada manualmente com sucesso",
  "faseAnterior": "PROTOTIPAGEM",
  "faseNova": "IMPLEMENTACAO",
  "modoManual": true,
  "atualizadoPor": "Prof. Carlos Santos"
}

VISUALIZAÇÃO DA FASE PARA O USUÁRIO:
-------------------------------------

No card do projeto:
[Badge colorido: "Fase 3 - Prototipagem"]

Na página de detalhes:
┌──────────────────────────────────────────┐
│ Fase Atual: PROTOTIPAGEM (Fase 3)        │
│                                          │
│ Progresso do Projeto:                    │
│ ████████████░░░░ 75%                     │
│                                          │
│ Ideação      ✓ Completa (3 arquivos)     │
│ Modelagem    ✓ Completa (5 arquivos)     │
│ Prototipagem ◐ Em andamento (4 arquivos) │
│ Implementação □ Não iniciada             │
└──────────────────────────────────────────┘

CÁLCULO DE PROGRESSO:
---------------------

```typescript
function calcularProgresso(etapas: Etapa[]): number {
  const totalEtapas = 4
  let etapasCompletas = 0
  
  for (const etapa of etapas) {
    // Considera completa se tem anexos E descrição
    if (etapa.anexos.length > 0 && etapa.descricao) {
      etapasCompletas++
    }
  }
  
  return (etapasCompletas / totalEtapas) * 100
}
```

Progresso:
- 0%: Nenhuma etapa completa
- 25%: 1 etapa completa (Ideação)
- 50%: 2 etapas completas (Ideação + Modelagem)
- 75%: 3 etapas completas
- 100%: Todas as 4 etapas completas

INDICADORES VISUAIS:
--------------------

Badge da fase (cores):
- IDEACAO: Amarelo/Dourado
- MODELAGEM: Azul
- PROTOTIPAGEM: Roxo
- IMPLEMENTACAO: Verde

Ícones:
- IDEACAO: Lâmpada
- MODELAGEM: Documento/Planta
- PROTOTIPAGEM: Ferramenta/Engrenagem
- IMPLEMENTACAO: Foguete

Status da etapa:
- ✓ Completa (verde)
- ◐ Em andamento (amarelo)
- □ Não iniciada (cinza)

NOTIFICAÇÕES DE PROGRESSÃO:
----------------------------

Quando projeto avança de fase automaticamente:
→ Notifica equipe: "Seu projeto avançou para fase de [NOME_FASE]!"

Quando projeto atinge 100%:
→ Notifica equipe: "Parabéns! Todas as etapas do projeto foram completadas!"
→ Notifica orientador: "Projeto [TITULO] completou todas as etapas"

DASHBOARD - CONTADORES POR FASE:
---------------------------------

No dashboard, cards mostram:
- Card Ideação: Conta projetos com fase_atual = 'IDEACAO'
- Card Modelagem: Conta projetos com fase_atual = 'MODELAGEM'
- Card Prototipagem: Conta projetos com fase_atual = 'PROTOTIPAGEM'
- Card Implementação: Conta projetos com fase_atual = 'IMPLEMENTACAO'

Query exemplo:
```sql
SELECT 
  COUNT(*) FILTER (WHERE fase_atual = 'IDEACAO') as ideacao,
  COUNT(*) FILTER (WHERE fase_atual = 'MODELAGEM') as modelagem,
  COUNT(*) FILTER (WHERE fase_atual = 'PROTOTIPAGEM') as prototipagem,
  COUNT(*) FILTER (WHERE fase_atual = 'IMPLEMENTACAO') as implementacao
FROM projetos
WHERE lider_uuid = '{usuario_uuid}'
  AND status != 'ARQUIVADO'
```

BENEFÍCIOS DO SISTEMA AUTOMÁTICO:
----------------------------------

1. FACILITA PARA O ALUNO:
   - Não precisa lembrar de atualizar fase manualmente
   - Sistema "sabe" onde o projeto está

2. ESTATÍSTICAS PRECISAS:
   - Dashboard mostra realidade do progresso
   - Professores veem fase real dos projetos

3. GESTÃO VISUAL:
   - Interface mostra claramente progresso
   - Fácil ver o que falta fazer

4. FLEXIBILIDADE:
   - Permite progressão não-linear se necessário
   - Admin pode ajustar manualmente em casos especiais

CASOS ESPECIAIS:
----------------

1. Projeto só com descrições (sem anexos):
   → Permanece em IDEACAO até adicionar anexos
   → Ou orientador define fase manualmente

2. Projeto legado (importado):
   → Admin pode definir fase inicial manualmente
   → Depois sistema assume controle automático

3. Projeto de pesquisa (diferente do padrão):
   → Orientador pode desabilitar progressão automática
   → Define fases manualmente conforme metodologia

TABELA DE APOIO NO BANCO:
--------------------------

```sql
CREATE TABLE progressao_fases_log (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_uuid UUID NOT NULL,
  fase_anterior VARCHAR(50),
  fase_nova VARCHAR(50) NOT NULL,
  tipo_mudanca ENUM('AUTOMATICA', 'MANUAL') DEFAULT 'AUTOMATICA',
  motivo TEXT,
  mudado_por_uuid UUID,
  data_mudanca TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (projeto_uuid) REFERENCES projetos(uuid),
  FOREIGN KEY (mudado_por_uuid) REFERENCES usuarios(uuid)
);
```

Este log permite:
- Rastrear histórico completo de mudanças de fase
- Saber quando projeto avançou
- Auditar mudanças manuais
- Gerar relatórios de progressão


================================================================================
FIM DA PARTE 1 - AUTENTICAÇÃO, CADASTRO E GESTÃO DE PROJETOS
================================================================================

RESUMO DO QUE FOI DOCUMENTADO:
-------------------------------
1. ✓ Autenticação completa com Google OAuth
2. ✓ Cadastro e completar perfil (alunos e professores)
3. ✓ Dashboard personalizado por tipo de usuário
4. ✓ Criar projeto em 4 passos detalhados
5. ✓ Ver detalhes completos do projeto
6. ✓ Editar projeto com histórico
7. ✓ Excluir projeto (soft e hard delete)
8. ✓ Transferir liderança e herdar projetos
9. ✓ Meus Projetos (página dedicada)
10. ✓ Sistema de progressão automática de fases

PRÓXIMOS ARQUIVOS:
------------------
PARTE 2: Notificações, Comentários, Curtidas, Busca e Filtros
PARTE 3: Eventos (Admin), Visitantes, Permissões, Endpoints e Banco de Dados

Total de endpoints documentados nesta parte: ~35
Total de erros possíveis documentados: ~150
Total de validações documentadas: ~200

================================================================================

