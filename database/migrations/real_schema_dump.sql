--
-- PostgreSQL database dump
--

\restrict JRAreNIOmEktq0xM3DNYOlJL3J4ailPitEbu1oycVeHsksAKfGhVwmCRdnwJoDu

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: atualizar_timestamp(); Type: FUNCTION; Schema: public; Owner: api_user
--

CREATE FUNCTION public.atualizar_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.atualizar_timestamp() OWNER TO api_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alunos; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.alunos (
    usuario_uuid uuid NOT NULL,
    matricula character varying(20),
    curso_uuid uuid,
    turma_uuid uuid,
    telefone character varying(20),
    bio text,
    linkedin_url character varying(255),
    github_url character varying(255),
    portfolio_url character varying(255),
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now(),
    instagram_url character varying(255),
    tiktok_url character varying(255),
    facebook_url character varying(255),
    cep character varying(10),
    logradouro character varying(255),
    numero character varying(20),
    complemento character varying(100),
    bairro character varying(100),
    cidade character varying(100),
    estado character varying(2),
    id bigint NOT NULL
);


ALTER TABLE public.alunos OWNER TO api_user;

--
-- Name: TABLE alunos; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.alunos IS 'Dados específicos de alunos';


--
-- Name: alunos_id_seq; Type: SEQUENCE; Schema: public; Owner: api_user
--

ALTER TABLE public.alunos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.alunos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: anexos_etapas; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.anexos_etapas (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    etapa_uuid uuid NOT NULL,
    nome_arquivo character varying(255) NOT NULL,
    arquivo_url text NOT NULL,
    tipo_arquivo character varying(100),
    tamanho_bytes bigint,
    upload_por_uuid uuid,
    criado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.anexos_etapas OWNER TO api_user;

--
-- Name: TABLE anexos_etapas; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.anexos_etapas IS 'Arquivos anexados às etapas';


--
-- Name: cursos; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.cursos (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(255) NOT NULL,
    sigla character varying(20),
    carga_horaria integer,
    modalidade character varying(50),
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now(),
    CONSTRAINT cursos_modalidade_check CHECK (((modalidade)::text = ANY ((ARRAY['TÉCNICO'::character varying, 'GRADUAÇÃO'::character varying, 'PÓS-GRADUAÇÃO'::character varying, 'QUALIFICAÇÃO'::character varying])::text[])))
);


ALTER TABLE public.cursos OWNER TO api_user;

--
-- Name: TABLE cursos; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.cursos IS 'Cursos oferecidos pelo SENAI';


--
-- Name: departamentos; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.departamentos (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(255) NOT NULL,
    sigla character varying(20),
    descricao text,
    cor_hex character varying(7),
    icone character varying(50),
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.departamentos OWNER TO api_user;

--
-- Name: TABLE departamentos; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.departamentos IS 'Departamentos SENAI (TI, Automação, etc)';


--
-- Name: etapas_projeto; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.etapas_projeto (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_uuid uuid NOT NULL,
    nome character varying(255) NOT NULL,
    descricao text,
    ordem integer NOT NULL,
    status character varying(20) DEFAULT 'PENDENTE'::character varying,
    data_inicio date,
    data_fim date,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now(),
    fase character varying(20),
    titulo character varying(255),
    tipo_etapa character varying(50),
    criado_por_uuid uuid,
    concluido_em timestamp without time zone,
    observacoes_conclusao text,
    feedback_orientador text,
    feedback_por_uuid uuid,
    feedback_em timestamp without time zone,
    CONSTRAINT etapas_projeto_fase_check CHECK (((fase)::text = ANY ((ARRAY['IDEACAO'::character varying, 'MODELAGEM'::character varying, 'PROTOTIPAGEM'::character varying, 'IMPLEMENTACAO'::character varying])::text[]))),
    CONSTRAINT etapas_projeto_status_check CHECK (((status)::text = ANY ((ARRAY['PENDENTE'::character varying, 'EM_ANDAMENTO'::character varying, 'EM_REVISAO'::character varying, 'PENDENTE_ORIENTADOR'::character varying, 'CONCLUIDA'::character varying])::text[]))),
    CONSTRAINT etapas_projeto_tipo_etapa_check CHECK (((tipo_etapa)::text = ANY ((ARRAY['PLANEJAMENTO'::character varying, 'DESENVOLVIMENTO'::character varying, 'TESTE'::character varying, 'DOCUMENTACAO'::character varying, 'APRESENTACAO'::character varying])::text[])))
);


ALTER TABLE public.etapas_projeto OWNER TO api_user;

--
-- Name: TABLE etapas_projeto; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.etapas_projeto IS 'Etapas personalizadas de cada projeto';


--
-- Name: historico_alteracoes; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.historico_alteracoes (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_uuid uuid NOT NULL,
    usuario_uuid uuid NOT NULL,
    campo_alterado character varying(100),
    valor_anterior text,
    valor_novo text,
    acao character varying(50),
    criado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.historico_alteracoes OWNER TO api_user;

--
-- Name: TABLE historico_alteracoes; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.historico_alteracoes IS 'Histórico de mudanças nos projetos';


--
-- Name: noticias; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.noticias (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo character varying(255) NOT NULL,
    resumo text,
    conteudo text,
    banner_url text,
    data_evento timestamp without time zone,
    local_evento character varying(255),
    categoria character varying(50) DEFAULT 'GERAL'::character varying,
    slug character varying(255),
    publicado boolean DEFAULT true,
    data_publicacao timestamp without time zone DEFAULT now(),
    destaque boolean DEFAULT false,
    autor_uuid uuid,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now(),
    visualizacoes integer DEFAULT 0,
    curtidas integer DEFAULT 0,
    data_expiracao timestamp without time zone
);


ALTER TABLE public.noticias OWNER TO api_user;

--
-- Name: TABLE noticias; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.noticias IS 'Notícias e Eventos do portal';


--
-- Name: COLUMN noticias.visualizacoes; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.noticias.visualizacoes IS 'Contador de visualizações da notícia';


--
-- Name: COLUMN noticias.curtidas; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.noticias.curtidas IS 'Contador de curtidas da notícia';


--
-- Name: COLUMN noticias.data_expiracao; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.noticias.data_expiracao IS 'Data agendada para arquivamento automático da notícia';


--
-- Name: notificacoes; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.notificacoes (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_uuid uuid NOT NULL,
    tipo character varying(50) NOT NULL,
    titulo character varying(255) NOT NULL,
    mensagem text NOT NULL,
    link character varying(255),
    lida boolean DEFAULT false,
    criado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notificacoes OWNER TO api_user;

--
-- Name: TABLE notificacoes; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.notificacoes IS 'Notificações síncronas para usuários';


--
-- Name: professores; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.professores (
    usuario_uuid uuid NOT NULL,
    matricula character varying(20),
    departamento_uuid uuid,
    especialidade character varying(255),
    telefone character varying(20),
    bio text,
    linkedin_url character varying(255),
    lattes_url character varying(255),
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now(),
    id bigint NOT NULL
);


ALTER TABLE public.professores OWNER TO api_user;

--
-- Name: TABLE professores; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.professores IS 'Dados específicos de professores';


--
-- Name: professores_id_seq; Type: SEQUENCE; Schema: public; Owner: api_user
--

ALTER TABLE public.professores ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.professores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: progressao_fases_log; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.progressao_fases_log (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_uuid uuid NOT NULL,
    fase_anterior character varying(50),
    fase_nova character varying(50) NOT NULL,
    tipo_mudanca character varying(20) DEFAULT 'AUTOMATICA'::character varying,
    motivo text,
    mudado_por_uuid uuid,
    data_mudanca timestamp without time zone DEFAULT now(),
    CONSTRAINT progressao_fases_log_tipo_mudanca_check CHECK (((tipo_mudanca)::text = ANY ((ARRAY['AUTOMATICA'::character varying, 'MANUAL'::character varying])::text[])))
);


ALTER TABLE public.progressao_fases_log OWNER TO api_user;

--
-- Name: TABLE progressao_fases_log; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.progressao_fases_log IS 'Log de progressão automática/manual de fases';


--
-- Name: projetos; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.projetos (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo character varying(255) NOT NULL,
    descricao text NOT NULL,
    descricao_curta character varying(500),
    banner_url text,
    fase_atual character varying(50) DEFAULT 'IDEACAO'::character varying,
    status character varying(20) DEFAULT 'RASCUNHO'::character varying,
    lider_uuid uuid NOT NULL,
    departamento_uuid uuid,
    visibilidade character varying(20) DEFAULT 'PUBLICO'::character varying,
    curtidas_count integer DEFAULT 0,
    visualizacoes_count integer DEFAULT 0,
    arquivado boolean DEFAULT false,
    data_publicacao timestamp without time zone,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now(),
    criado_por_uuid uuid NOT NULL,
    itinerario boolean DEFAULT false,
    senai_lab boolean DEFAULT false,
    saga_senai boolean DEFAULT false,
    objetivos text,
    resultados_esperados text,
    repositorio_url character varying(500),
    demo_url character varying(500),
    categoria character varying(100),
    curso character varying(200),
    turma character varying(50),
    modalidade character varying(50),
    unidade_curricular character varying(255),
    has_repositorio boolean DEFAULT false,
    tipo_repositorio character varying(20),
    link_repositorio text,
    codigo_visibilidade character varying(20) DEFAULT 'Público'::character varying,
    anexos_visibilidade character varying(20) DEFAULT 'Público'::character varying,
    aceitou_termos boolean DEFAULT false,
    CONSTRAINT projetos_anexos_visibilidade_check CHECK (((anexos_visibilidade)::text = ANY ((ARRAY['Público'::character varying, 'Privado'::character varying, NULL::character varying])::text[]))),
    CONSTRAINT projetos_codigo_visibilidade_check CHECK (((codigo_visibilidade)::text = ANY ((ARRAY['Público'::character varying, 'Privado'::character varying, NULL::character varying])::text[]))),
    CONSTRAINT projetos_fase_atual_check CHECK (((fase_atual)::text = ANY ((ARRAY['IDEACAO'::character varying, 'MODELAGEM'::character varying, 'PROTOTIPAGEM'::character varying, 'IMPLEMENTACAO'::character varying])::text[]))),
    CONSTRAINT projetos_modalidade_check CHECK (((modalidade)::text = ANY ((ARRAY['Presencial'::character varying, 'Semipresencial'::character varying, NULL::character varying])::text[]))),
    CONSTRAINT projetos_status_check CHECK (((status)::text = ANY ((ARRAY['RASCUNHO'::character varying, 'PUBLICADO'::character varying, 'ARQUIVADO'::character varying])::text[]))),
    CONSTRAINT projetos_tipo_repositorio_check CHECK (((tipo_repositorio)::text = ANY ((ARRAY['arquivo'::character varying, 'link'::character varying, NULL::character varying])::text[]))),
    CONSTRAINT projetos_visibilidade_check CHECK (((visibilidade)::text = ANY ((ARRAY['PUBLICO'::character varying, 'PRIVADO'::character varying, 'RESTRITO'::character varying])::text[])))
);


ALTER TABLE public.projetos OWNER TO api_user;

--
-- Name: TABLE projetos; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.projetos IS 'Projetos da vitrine';


--
-- Name: COLUMN projetos.itinerario; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos.itinerario IS 'Participou de itinerário formativo';


--
-- Name: COLUMN projetos.categoria; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos.categoria IS 'Categoria do projeto: Aplicativo/Site, IoT, Automação, etc.';


--
-- Name: COLUMN projetos.curso; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos.curso IS 'Nome do curso técnico';


--
-- Name: COLUMN projetos.turma; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos.turma IS 'Código da turma';


--
-- Name: COLUMN projetos.modalidade; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos.modalidade IS 'Modalidade do curso: Presencial ou Semipresencial';


--
-- Name: COLUMN projetos.unidade_curricular; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos.unidade_curricular IS 'Nome da unidade curricular';


--
-- Name: COLUMN projetos.has_repositorio; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos.has_repositorio IS 'Projeto possui repositório de código';


--
-- Name: COLUMN projetos.tipo_repositorio; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos.tipo_repositorio IS 'Tipo: arquivo (ZIP) ou link (GitHub/GitLab)';


--
-- Name: COLUMN projetos.link_repositorio; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos.link_repositorio IS 'URL do repositório externo (GitHub, GitLab, etc.)';


--
-- Name: COLUMN projetos.codigo_visibilidade; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos.codigo_visibilidade IS 'Visibilidade do código: Público ou Privado';


--
-- Name: COLUMN projetos.anexos_visibilidade; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos.anexos_visibilidade IS 'Visibilidade dos anexos das fases: Público ou Privado';


--
-- Name: COLUMN projetos.aceitou_termos; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos.aceitou_termos IS 'Usuário aceitou os termos de uso e privacidade';


--
-- Name: projetos_alunos; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.projetos_alunos (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_uuid uuid NOT NULL,
    usuario_uuid uuid NOT NULL,
    papel character varying(20) DEFAULT 'AUTOR'::character varying,
    adicionado_em timestamp without time zone DEFAULT now(),
    CONSTRAINT projetos_alunos_papel_check CHECK (((papel)::text = ANY ((ARRAY['LIDER'::character varying, 'AUTOR'::character varying, 'COLABORADOR'::character varying])::text[])))
);


ALTER TABLE public.projetos_alunos OWNER TO api_user;

--
-- Name: TABLE projetos_alunos; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.projetos_alunos IS 'Autores dos projetos';


--
-- Name: projetos_auditoria; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.projetos_auditoria (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_uuid uuid NOT NULL,
    usuario_uuid uuid NOT NULL,
    acao character varying(50) NOT NULL,
    descricao text,
    dados_anteriores jsonb,
    dados_novos jsonb,
    ip_address character varying(45),
    user_agent text,
    criado_em timestamp without time zone DEFAULT now(),
    CONSTRAINT projetos_auditoria_acao_check CHECK (((acao)::text = ANY ((ARRAY['CRIACAO'::character varying, 'ATUALIZACAO_PASSO1'::character varying, 'ATUALIZACAO_PASSO2'::character varying, 'ATUALIZACAO_PASSO3'::character varying, 'ATUALIZACAO_PASSO4'::character varying, 'ATUALIZACAO_PASSO5'::character varying, 'PUBLICACAO'::character varying, 'ARQUIVAMENTO'::character varying, 'EXCLUSAO'::character varying, 'ADICAO_AUTOR'::character varying, 'REMOCAO_AUTOR'::character varying, 'ADICAO_ORIENTADOR'::character varying, 'REMOCAO_ORIENTADOR'::character varying, 'UPLOAD_BANNER'::character varying, 'UPLOAD_CODIGO'::character varying, 'UPLOAD_ANEXO_FASE'::character varying])::text[])))
);


ALTER TABLE public.projetos_auditoria OWNER TO api_user;

--
-- Name: TABLE projetos_auditoria; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.projetos_auditoria IS 'Registra todas as alterações feitas em projetos para rastreabilidade';


--
-- Name: COLUMN projetos_auditoria.acao; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos_auditoria.acao IS 'Tipo de ação realizada no projeto';


--
-- Name: COLUMN projetos_auditoria.dados_anteriores; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos_auditoria.dados_anteriores IS 'Estado dos dados antes da alteração (JSON)';


--
-- Name: COLUMN projetos_auditoria.dados_novos; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos_auditoria.dados_novos IS 'Estado dos dados após a alteração (JSON)';


--
-- Name: COLUMN projetos_auditoria.ip_address; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos_auditoria.ip_address IS 'Endereço IP de onde a ação foi realizada';


--
-- Name: COLUMN projetos_auditoria.user_agent; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.projetos_auditoria.user_agent IS 'User-Agent do navegador/cliente';


--
-- Name: projetos_codigo; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.projetos_codigo (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_uuid uuid NOT NULL,
    nome_arquivo character varying(255) NOT NULL,
    url_arquivo text NOT NULL,
    tamanho_bytes bigint,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.projetos_codigo OWNER TO api_user;

--
-- Name: TABLE projetos_codigo; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.projetos_codigo IS 'Arquivo ZIP com o código fonte do projeto';


--
-- Name: projetos_fases; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.projetos_fases (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_uuid uuid NOT NULL,
    nome_fase character varying(50) NOT NULL,
    descricao text,
    ordem integer DEFAULT 0,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now(),
    CONSTRAINT projetos_fases_nome_fase_check CHECK (((nome_fase)::text = ANY ((ARRAY['ideacao'::character varying, 'modelagem'::character varying, 'prototipagem'::character varying, 'implementacao'::character varying])::text[])))
);


ALTER TABLE public.projetos_fases OWNER TO api_user;

--
-- Name: TABLE projetos_fases; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.projetos_fases IS 'Armazena descrições das 4 fases do projeto';


--
-- Name: projetos_fases_anexos; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.projetos_fases_anexos (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    fase_uuid uuid NOT NULL,
    tipo_anexo character varying(100),
    nome_arquivo character varying(255) NOT NULL,
    url_arquivo text NOT NULL,
    tamanho_bytes bigint,
    mime_type character varying(100),
    criado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.projetos_fases_anexos OWNER TO api_user;

--
-- Name: TABLE projetos_fases_anexos; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.projetos_fases_anexos IS 'Anexos de cada fase (Crazy 8, Wireframes, User Stories, etc.)';


--
-- Name: projetos_professores; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.projetos_professores (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_uuid uuid NOT NULL,
    usuario_uuid uuid NOT NULL,
    papel character varying(20) DEFAULT 'ORIENTADOR'::character varying,
    adicionado_em timestamp without time zone DEFAULT now(),
    CONSTRAINT projetos_professores_papel_check CHECK (((papel)::text = ANY ((ARRAY['ORIENTADOR'::character varying, 'COORIENTADOR'::character varying, 'AVALIADOR'::character varying])::text[])))
);


ALTER TABLE public.projetos_professores OWNER TO api_user;

--
-- Name: TABLE projetos_professores; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.projetos_professores IS 'Orientadores dos projetos';


--
-- Name: projetos_tecnologias; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.projetos_tecnologias (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_uuid uuid NOT NULL,
    tecnologia_uuid uuid NOT NULL,
    adicionado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.projetos_tecnologias OWNER TO api_user;

--
-- Name: TABLE projetos_tecnologias; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.projetos_tecnologias IS 'Tecnologias usadas em cada projeto';


--
-- Name: sessoes_usuarios; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.sessoes_usuarios (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_uuid uuid NOT NULL,
    token_hash character varying(64) NOT NULL,
    ip_address character varying(45),
    user_agent text,
    navegador character varying(100),
    sistema_operacional character varying(100),
    dispositivo character varying(50),
    localizacao character varying(255),
    criado_em timestamp without time zone DEFAULT now(),
    ultimo_acesso timestamp without time zone DEFAULT now(),
    expira_em timestamp without time zone NOT NULL,
    ativo boolean DEFAULT true
);


ALTER TABLE public.sessoes_usuarios OWNER TO api_user;

--
-- Name: TABLE sessoes_usuarios; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.sessoes_usuarios IS 'Tabela para rastrear sessões ativas de usuários';


--
-- Name: COLUMN sessoes_usuarios.token_hash; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.sessoes_usuarios.token_hash IS 'Hash SHA-256 do JWT token para identificação segura';


--
-- Name: COLUMN sessoes_usuarios.dispositivo; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON COLUMN public.sessoes_usuarios.dispositivo IS 'Tipo de dispositivo: Desktop, Mobile, Tablet';


--
-- Name: tecnologias; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.tecnologias (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(100) NOT NULL,
    categoria character varying(50),
    cor_hex character varying(7),
    icone character varying(50),
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tecnologias OWNER TO api_user;

--
-- Name: TABLE tecnologias; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.tecnologias IS 'Stack tecnológica (React, Node, etc)';


--
-- Name: turmas; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.turmas (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    curso_uuid uuid NOT NULL,
    codigo character varying(50) NOT NULL,
    ano integer NOT NULL,
    semestre integer,
    turno character varying(20),
    data_inicio date,
    data_fim date,
    ativa boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now(),
    CONSTRAINT turmas_semestre_check CHECK ((semestre = ANY (ARRAY[1, 2]))),
    CONSTRAINT turmas_turno_check CHECK (((turno)::text = ANY ((ARRAY['MATUTINO'::character varying, 'VESPERTINO'::character varying, 'NOTURNO'::character varying, 'INTEGRAL'::character varying])::text[])))
);


ALTER TABLE public.turmas OWNER TO api_user;

--
-- Name: TABLE turmas; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.turmas IS 'Turmas ativas e finalizadas';


--
-- Name: unidades_curriculares; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.unidades_curriculares (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    curso_uuid uuid NOT NULL,
    nome character varying(255) NOT NULL,
    codigo character varying(50),
    carga_horaria integer,
    periodo integer,
    ementa text,
    ativa boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.unidades_curriculares OWNER TO api_user;

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.usuarios (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    nome character varying(255) NOT NULL,
    avatar_url text,
    google_id character varying(255) NOT NULL,
    tipo character varying(20) NOT NULL,
    primeiro_acesso boolean DEFAULT true,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now(),
    CONSTRAINT usuarios_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['ALUNO'::character varying, 'PROFESSOR'::character varying, 'ADMIN'::character varying])::text[])))
);


ALTER TABLE public.usuarios OWNER TO api_user;

--
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON TABLE public.usuarios IS 'Usuários do sistema (alunos, professores, admin)';


--
-- Name: vw_projetos_auditoria; Type: VIEW; Schema: public; Owner: api_user
--

CREATE VIEW public.vw_projetos_auditoria AS
 SELECT pa.uuid,
    pa.projeto_uuid,
    p.titulo AS projeto_titulo,
    pa.usuario_uuid,
    u.nome AS usuario_nome,
    u.email AS usuario_email,
    u.tipo AS usuario_tipo,
    pa.acao,
    pa.descricao,
    pa.dados_anteriores,
    pa.dados_novos,
    pa.ip_address,
    pa.user_agent,
    pa.criado_em
   FROM ((public.projetos_auditoria pa
     JOIN public.projetos p ON ((pa.projeto_uuid = p.uuid)))
     JOIN public.usuarios u ON ((pa.usuario_uuid = u.uuid)))
  ORDER BY pa.criado_em DESC;


ALTER TABLE public.vw_projetos_auditoria OWNER TO api_user;

--
-- Name: VIEW vw_projetos_auditoria; Type: COMMENT; Schema: public; Owner: api_user
--

COMMENT ON VIEW public.vw_projetos_auditoria IS 'View com dados completos de auditoria incluindo nomes de usuários e projetos';


--
-- Name: alunos alunos_matricula_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.alunos
    ADD CONSTRAINT alunos_matricula_key UNIQUE (matricula);


--
-- Name: alunos alunos_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.alunos
    ADD CONSTRAINT alunos_pkey PRIMARY KEY (id);


--
-- Name: alunos alunos_usuario_uuid_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.alunos
    ADD CONSTRAINT alunos_usuario_uuid_key UNIQUE (usuario_uuid);


--
-- Name: anexos_etapas anexos_etapas_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.anexos_etapas
    ADD CONSTRAINT anexos_etapas_pkey PRIMARY KEY (uuid);


--
-- Name: cursos cursos_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_pkey PRIMARY KEY (uuid);


--
-- Name: departamentos departamentos_nome_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_nome_key UNIQUE (nome);


--
-- Name: departamentos departamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_pkey PRIMARY KEY (uuid);


--
-- Name: departamentos departamentos_sigla_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_sigla_key UNIQUE (sigla);


--
-- Name: etapas_projeto etapas_projeto_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.etapas_projeto
    ADD CONSTRAINT etapas_projeto_pkey PRIMARY KEY (uuid);


--
-- Name: etapas_projeto etapas_projeto_projeto_uuid_ordem_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.etapas_projeto
    ADD CONSTRAINT etapas_projeto_projeto_uuid_ordem_key UNIQUE (projeto_uuid, ordem);


--
-- Name: historico_alteracoes historico_alteracoes_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.historico_alteracoes
    ADD CONSTRAINT historico_alteracoes_pkey PRIMARY KEY (uuid);


--
-- Name: noticias noticias_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT noticias_pkey PRIMARY KEY (uuid);


--
-- Name: noticias noticias_slug_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT noticias_slug_key UNIQUE (slug);


--
-- Name: notificacoes notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (uuid);


--
-- Name: professores professores_matricula_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.professores
    ADD CONSTRAINT professores_matricula_key UNIQUE (matricula);


--
-- Name: professores professores_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.professores
    ADD CONSTRAINT professores_pkey PRIMARY KEY (id);


--
-- Name: professores professores_usuario_uuid_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.professores
    ADD CONSTRAINT professores_usuario_uuid_key UNIQUE (usuario_uuid);


--
-- Name: progressao_fases_log progressao_fases_log_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.progressao_fases_log
    ADD CONSTRAINT progressao_fases_log_pkey PRIMARY KEY (uuid);


--
-- Name: projetos_alunos projetos_alunos_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_alunos
    ADD CONSTRAINT projetos_alunos_pkey PRIMARY KEY (uuid);


--
-- Name: projetos_alunos projetos_alunos_projeto_uuid_aluno_uuid_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_alunos
    ADD CONSTRAINT projetos_alunos_projeto_uuid_aluno_uuid_key UNIQUE (projeto_uuid, usuario_uuid);


--
-- Name: projetos_auditoria projetos_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_auditoria
    ADD CONSTRAINT projetos_auditoria_pkey PRIMARY KEY (uuid);


--
-- Name: projetos_codigo projetos_codigo_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_codigo
    ADD CONSTRAINT projetos_codigo_pkey PRIMARY KEY (uuid);


--
-- Name: projetos_codigo projetos_codigo_projeto_uuid_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_codigo
    ADD CONSTRAINT projetos_codigo_projeto_uuid_key UNIQUE (projeto_uuid);


--
-- Name: projetos_fases_anexos projetos_fases_anexos_fase_uuid_tipo_anexo_nome_arquivo_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_fases_anexos
    ADD CONSTRAINT projetos_fases_anexos_fase_uuid_tipo_anexo_nome_arquivo_key UNIQUE (fase_uuid, tipo_anexo, nome_arquivo);


--
-- Name: projetos_fases_anexos projetos_fases_anexos_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_fases_anexos
    ADD CONSTRAINT projetos_fases_anexos_pkey PRIMARY KEY (uuid);


--
-- Name: projetos_fases projetos_fases_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_fases
    ADD CONSTRAINT projetos_fases_pkey PRIMARY KEY (uuid);


--
-- Name: projetos_fases projetos_fases_projeto_uuid_nome_fase_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_fases
    ADD CONSTRAINT projetos_fases_projeto_uuid_nome_fase_key UNIQUE (projeto_uuid, nome_fase);


--
-- Name: projetos projetos_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos
    ADD CONSTRAINT projetos_pkey PRIMARY KEY (uuid);


--
-- Name: projetos_professores projetos_professores_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_professores
    ADD CONSTRAINT projetos_professores_pkey PRIMARY KEY (uuid);


--
-- Name: projetos_professores projetos_professores_projeto_uuid_usuario_uuid_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_professores
    ADD CONSTRAINT projetos_professores_projeto_uuid_usuario_uuid_key UNIQUE (projeto_uuid, usuario_uuid);


--
-- Name: projetos_tecnologias projetos_tecnologias_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_tecnologias
    ADD CONSTRAINT projetos_tecnologias_pkey PRIMARY KEY (uuid);


--
-- Name: projetos_tecnologias projetos_tecnologias_projeto_uuid_tecnologia_uuid_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_tecnologias
    ADD CONSTRAINT projetos_tecnologias_projeto_uuid_tecnologia_uuid_key UNIQUE (projeto_uuid, tecnologia_uuid);


--
-- Name: sessoes_usuarios sessoes_usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.sessoes_usuarios
    ADD CONSTRAINT sessoes_usuarios_pkey PRIMARY KEY (uuid);


--
-- Name: tecnologias tecnologias_nome_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.tecnologias
    ADD CONSTRAINT tecnologias_nome_key UNIQUE (nome);


--
-- Name: tecnologias tecnologias_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.tecnologias
    ADD CONSTRAINT tecnologias_pkey PRIMARY KEY (uuid);


--
-- Name: projetos titulo_unico; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos
    ADD CONSTRAINT titulo_unico UNIQUE (titulo);


--
-- Name: turmas turmas_curso_uuid_codigo_ano_semestre_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.turmas
    ADD CONSTRAINT turmas_curso_uuid_codigo_ano_semestre_key UNIQUE (curso_uuid, codigo, ano, semestre);


--
-- Name: turmas turmas_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.turmas
    ADD CONSTRAINT turmas_pkey PRIMARY KEY (uuid);


--
-- Name: unidades_curriculares unidades_curriculares_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.unidades_curriculares
    ADD CONSTRAINT unidades_curriculares_pkey PRIMARY KEY (uuid);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_google_id_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_google_id_key UNIQUE (google_id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (uuid);


--
-- Name: idx_alunos_curso; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_alunos_curso ON public.alunos USING btree (curso_uuid);


--
-- Name: idx_alunos_matricula; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_alunos_matricula ON public.alunos USING btree (matricula);


--
-- Name: idx_alunos_turma; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_alunos_turma ON public.alunos USING btree (turma_uuid);


--
-- Name: idx_alunos_usuario; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_alunos_usuario ON public.alunos USING btree (usuario_uuid);


--
-- Name: idx_anexos_etapa; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_anexos_etapa ON public.anexos_etapas USING btree (etapa_uuid);


--
-- Name: idx_anexos_upload_por; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_anexos_upload_por ON public.anexos_etapas USING btree (upload_por_uuid);


--
-- Name: idx_cursos_ativo; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_cursos_ativo ON public.cursos USING btree (ativo);


--
-- Name: idx_cursos_nome; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_cursos_nome ON public.cursos USING btree (nome);


--
-- Name: idx_departamentos_ativo; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_departamentos_ativo ON public.departamentos USING btree (ativo);


--
-- Name: idx_departamentos_nome; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_departamentos_nome ON public.departamentos USING btree (nome);


--
-- Name: idx_etapas_ordem; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_etapas_ordem ON public.etapas_projeto USING btree (ordem);


--
-- Name: idx_etapas_projeto; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_etapas_projeto ON public.etapas_projeto USING btree (projeto_uuid);


--
-- Name: idx_historico_data; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_historico_data ON public.historico_alteracoes USING btree (criado_em DESC);


--
-- Name: idx_historico_projeto; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_historico_projeto ON public.historico_alteracoes USING btree (projeto_uuid);


--
-- Name: idx_historico_usuario; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_historico_usuario ON public.historico_alteracoes USING btree (usuario_uuid);


--
-- Name: idx_noticias_categoria; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_noticias_categoria ON public.noticias USING btree (categoria);


--
-- Name: idx_noticias_data; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_noticias_data ON public.noticias USING btree (data_publicacao DESC);


--
-- Name: idx_noticias_slug; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_noticias_slug ON public.noticias USING btree (slug);


--
-- Name: idx_notificacoes_data; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_notificacoes_data ON public.notificacoes USING btree (criado_em DESC);


--
-- Name: idx_notificacoes_lida; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_notificacoes_lida ON public.notificacoes USING btree (lida);


--
-- Name: idx_notificacoes_usuario; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_notificacoes_usuario ON public.notificacoes USING btree (usuario_uuid);


--
-- Name: idx_professores_departamento; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_professores_departamento ON public.professores USING btree (departamento_uuid);


--
-- Name: idx_professores_matricula; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_professores_matricula ON public.professores USING btree (matricula);


--
-- Name: idx_professores_usuario; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_professores_usuario ON public.professores USING btree (usuario_uuid);


--
-- Name: idx_progressao_data; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_progressao_data ON public.progressao_fases_log USING btree (data_mudanca DESC);


--
-- Name: idx_progressao_projeto; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_progressao_projeto ON public.progressao_fases_log USING btree (projeto_uuid);


--
-- Name: idx_projetos_alunos_aluno; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_alunos_aluno ON public.projetos_alunos USING btree (usuario_uuid);


--
-- Name: idx_projetos_alunos_projeto; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_alunos_projeto ON public.projetos_alunos USING btree (projeto_uuid);


--
-- Name: idx_projetos_auditoria_acao; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_auditoria_acao ON public.projetos_auditoria USING btree (acao);


--
-- Name: idx_projetos_auditoria_data; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_auditoria_data ON public.projetos_auditoria USING btree (criado_em DESC);


--
-- Name: idx_projetos_auditoria_projeto; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_auditoria_projeto ON public.projetos_auditoria USING btree (projeto_uuid);


--
-- Name: idx_projetos_auditoria_usuario; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_auditoria_usuario ON public.projetos_auditoria USING btree (usuario_uuid);


--
-- Name: idx_projetos_categoria; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_categoria ON public.projetos USING btree (categoria);


--
-- Name: idx_projetos_codigo_projeto; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_codigo_projeto ON public.projetos_codigo USING btree (projeto_uuid);


--
-- Name: idx_projetos_curso; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_curso ON public.projetos USING btree (curso);


--
-- Name: idx_projetos_departamento; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_departamento ON public.projetos USING btree (departamento_uuid);


--
-- Name: idx_projetos_fase; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_fase ON public.projetos USING btree (fase_atual);


--
-- Name: idx_projetos_fases_anexos_fase; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_fases_anexos_fase ON public.projetos_fases_anexos USING btree (fase_uuid);


--
-- Name: idx_projetos_fases_anexos_tipo; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_fases_anexos_tipo ON public.projetos_fases_anexos USING btree (tipo_anexo);


--
-- Name: idx_projetos_fases_nome; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_fases_nome ON public.projetos_fases USING btree (nome_fase);


--
-- Name: idx_projetos_fases_projeto; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_fases_projeto ON public.projetos_fases USING btree (projeto_uuid);


--
-- Name: idx_projetos_lider; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_lider ON public.projetos USING btree (lider_uuid);


--
-- Name: idx_projetos_modalidade; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_modalidade ON public.projetos USING btree (modalidade);


--
-- Name: idx_projetos_professores_projeto; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_professores_projeto ON public.projetos_professores USING btree (projeto_uuid);


--
-- Name: idx_projetos_professores_usuario; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_professores_usuario ON public.projetos_professores USING btree (usuario_uuid);


--
-- Name: idx_projetos_status; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_status ON public.projetos USING btree (status);


--
-- Name: idx_projetos_tecnologias_projeto; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_tecnologias_projeto ON public.projetos_tecnologias USING btree (projeto_uuid);


--
-- Name: idx_projetos_tecnologias_tecnologia; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_tecnologias_tecnologia ON public.projetos_tecnologias USING btree (tecnologia_uuid);


--
-- Name: idx_projetos_titulo; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_titulo ON public.projetos USING btree (titulo);


--
-- Name: idx_projetos_turma; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_projetos_turma ON public.projetos USING btree (turma);


--
-- Name: idx_sessoes_ativo; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_sessoes_ativo ON public.sessoes_usuarios USING btree (ativo);


--
-- Name: idx_sessoes_expira; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_sessoes_expira ON public.sessoes_usuarios USING btree (expira_em);


--
-- Name: idx_sessoes_token_hash; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_sessoes_token_hash ON public.sessoes_usuarios USING btree (token_hash);


--
-- Name: idx_sessoes_usuario; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_sessoes_usuario ON public.sessoes_usuarios USING btree (usuario_uuid);


--
-- Name: idx_sessoes_usuario_ativo; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_sessoes_usuario_ativo ON public.sessoes_usuarios USING btree (usuario_uuid, ativo);


--
-- Name: idx_tecnologias_categoria; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_tecnologias_categoria ON public.tecnologias USING btree (categoria);


--
-- Name: idx_tecnologias_nome; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_tecnologias_nome ON public.tecnologias USING btree (nome);


--
-- Name: idx_turmas_ativa; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_turmas_ativa ON public.turmas USING btree (ativa);


--
-- Name: idx_turmas_curso; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_turmas_curso ON public.turmas USING btree (curso_uuid);


--
-- Name: idx_unidades_curso; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_unidades_curso ON public.unidades_curriculares USING btree (curso_uuid);


--
-- Name: idx_unidades_periodo; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_unidades_periodo ON public.unidades_curriculares USING btree (periodo);


--
-- Name: idx_usuarios_email; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: idx_usuarios_google_id; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_usuarios_google_id ON public.usuarios USING btree (google_id);


--
-- Name: idx_usuarios_tipo; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_usuarios_tipo ON public.usuarios USING btree (tipo);


--
-- Name: alunos trigger_alunos_updated; Type: TRIGGER; Schema: public; Owner: api_user
--

CREATE TRIGGER trigger_alunos_updated BEFORE UPDATE ON public.alunos FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- Name: etapas_projeto trigger_etapas_updated; Type: TRIGGER; Schema: public; Owner: api_user
--

CREATE TRIGGER trigger_etapas_updated BEFORE UPDATE ON public.etapas_projeto FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- Name: noticias trigger_noticias_updated; Type: TRIGGER; Schema: public; Owner: api_user
--

CREATE TRIGGER trigger_noticias_updated BEFORE UPDATE ON public.noticias FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- Name: professores trigger_professores_updated; Type: TRIGGER; Schema: public; Owner: api_user
--

CREATE TRIGGER trigger_professores_updated BEFORE UPDATE ON public.professores FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- Name: projetos trigger_projetos_updated; Type: TRIGGER; Schema: public; Owner: api_user
--

CREATE TRIGGER trigger_projetos_updated BEFORE UPDATE ON public.projetos FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- Name: usuarios trigger_usuarios_updated; Type: TRIGGER; Schema: public; Owner: api_user
--

CREATE TRIGGER trigger_usuarios_updated BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- Name: alunos alunos_usuario_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.alunos
    ADD CONSTRAINT alunos_usuario_uuid_fkey FOREIGN KEY (usuario_uuid) REFERENCES public.usuarios(uuid) ON DELETE CASCADE;


--
-- Name: anexos_etapas anexos_etapas_etapa_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.anexos_etapas
    ADD CONSTRAINT anexos_etapas_etapa_uuid_fkey FOREIGN KEY (etapa_uuid) REFERENCES public.etapas_projeto(uuid) ON DELETE CASCADE;


--
-- Name: anexos_etapas anexos_etapas_upload_por_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.anexos_etapas
    ADD CONSTRAINT anexos_etapas_upload_por_uuid_fkey FOREIGN KEY (upload_por_uuid) REFERENCES public.usuarios(uuid);


--
-- Name: etapas_projeto etapas_projeto_criado_por_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.etapas_projeto
    ADD CONSTRAINT etapas_projeto_criado_por_uuid_fkey FOREIGN KEY (criado_por_uuid) REFERENCES public.usuarios(uuid);


--
-- Name: etapas_projeto etapas_projeto_feedback_por_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.etapas_projeto
    ADD CONSTRAINT etapas_projeto_feedback_por_uuid_fkey FOREIGN KEY (feedback_por_uuid) REFERENCES public.usuarios(uuid);


--
-- Name: etapas_projeto etapas_projeto_projeto_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.etapas_projeto
    ADD CONSTRAINT etapas_projeto_projeto_uuid_fkey FOREIGN KEY (projeto_uuid) REFERENCES public.projetos(uuid) ON DELETE CASCADE;


--
-- Name: historico_alteracoes historico_alteracoes_projeto_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.historico_alteracoes
    ADD CONSTRAINT historico_alteracoes_projeto_uuid_fkey FOREIGN KEY (projeto_uuid) REFERENCES public.projetos(uuid) ON DELETE CASCADE;


--
-- Name: historico_alteracoes historico_alteracoes_usuario_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.historico_alteracoes
    ADD CONSTRAINT historico_alteracoes_usuario_uuid_fkey FOREIGN KEY (usuario_uuid) REFERENCES public.usuarios(uuid);


--
-- Name: noticias noticias_autor_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT noticias_autor_uuid_fkey FOREIGN KEY (autor_uuid) REFERENCES public.usuarios(uuid);


--
-- Name: notificacoes notificacoes_usuario_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_usuario_uuid_fkey FOREIGN KEY (usuario_uuid) REFERENCES public.usuarios(uuid) ON DELETE CASCADE;


--
-- Name: professores professores_usuario_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.professores
    ADD CONSTRAINT professores_usuario_uuid_fkey FOREIGN KEY (usuario_uuid) REFERENCES public.usuarios(uuid) ON DELETE CASCADE;


--
-- Name: progressao_fases_log progressao_fases_log_mudado_por_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.progressao_fases_log
    ADD CONSTRAINT progressao_fases_log_mudado_por_uuid_fkey FOREIGN KEY (mudado_por_uuid) REFERENCES public.usuarios(uuid);


--
-- Name: progressao_fases_log progressao_fases_log_projeto_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.progressao_fases_log
    ADD CONSTRAINT progressao_fases_log_projeto_uuid_fkey FOREIGN KEY (projeto_uuid) REFERENCES public.projetos(uuid) ON DELETE CASCADE;


--
-- Name: projetos_alunos projetos_alunos_projeto_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_alunos
    ADD CONSTRAINT projetos_alunos_projeto_uuid_fkey FOREIGN KEY (projeto_uuid) REFERENCES public.projetos(uuid) ON DELETE CASCADE;


--
-- Name: projetos_alunos projetos_alunos_usuario_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_alunos
    ADD CONSTRAINT projetos_alunos_usuario_uuid_fkey FOREIGN KEY (usuario_uuid) REFERENCES public.usuarios(uuid) ON DELETE CASCADE;


--
-- Name: projetos_auditoria projetos_auditoria_projeto_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_auditoria
    ADD CONSTRAINT projetos_auditoria_projeto_uuid_fkey FOREIGN KEY (projeto_uuid) REFERENCES public.projetos(uuid) ON DELETE CASCADE;


--
-- Name: projetos_auditoria projetos_auditoria_usuario_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_auditoria
    ADD CONSTRAINT projetos_auditoria_usuario_uuid_fkey FOREIGN KEY (usuario_uuid) REFERENCES public.usuarios(uuid) ON DELETE SET NULL;


--
-- Name: projetos_codigo projetos_codigo_projeto_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_codigo
    ADD CONSTRAINT projetos_codigo_projeto_uuid_fkey FOREIGN KEY (projeto_uuid) REFERENCES public.projetos(uuid) ON DELETE CASCADE;


--
-- Name: projetos projetos_criado_por_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos
    ADD CONSTRAINT projetos_criado_por_uuid_fkey FOREIGN KEY (criado_por_uuid) REFERENCES public.usuarios(uuid);


--
-- Name: projetos projetos_departamento_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos
    ADD CONSTRAINT projetos_departamento_uuid_fkey FOREIGN KEY (departamento_uuid) REFERENCES public.departamentos(uuid);


--
-- Name: projetos_fases_anexos projetos_fases_anexos_fase_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_fases_anexos
    ADD CONSTRAINT projetos_fases_anexos_fase_uuid_fkey FOREIGN KEY (fase_uuid) REFERENCES public.projetos_fases(uuid) ON DELETE CASCADE;


--
-- Name: projetos_fases projetos_fases_projeto_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_fases
    ADD CONSTRAINT projetos_fases_projeto_uuid_fkey FOREIGN KEY (projeto_uuid) REFERENCES public.projetos(uuid) ON DELETE CASCADE;


--
-- Name: projetos projetos_lider_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos
    ADD CONSTRAINT projetos_lider_uuid_fkey FOREIGN KEY (lider_uuid) REFERENCES public.usuarios(uuid);


--
-- Name: projetos_professores projetos_professores_projeto_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_professores
    ADD CONSTRAINT projetos_professores_projeto_uuid_fkey FOREIGN KEY (projeto_uuid) REFERENCES public.projetos(uuid) ON DELETE CASCADE;


--
-- Name: projetos_professores projetos_professores_usuario_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_professores
    ADD CONSTRAINT projetos_professores_usuario_uuid_fkey FOREIGN KEY (usuario_uuid) REFERENCES public.usuarios(uuid) ON DELETE CASCADE;


--
-- Name: projetos_tecnologias projetos_tecnologias_projeto_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_tecnologias
    ADD CONSTRAINT projetos_tecnologias_projeto_uuid_fkey FOREIGN KEY (projeto_uuid) REFERENCES public.projetos(uuid) ON DELETE CASCADE;


--
-- Name: projetos_tecnologias projetos_tecnologias_tecnologia_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.projetos_tecnologias
    ADD CONSTRAINT projetos_tecnologias_tecnologia_uuid_fkey FOREIGN KEY (tecnologia_uuid) REFERENCES public.tecnologias(uuid) ON DELETE CASCADE;


--
-- Name: sessoes_usuarios sessoes_usuarios_usuario_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.sessoes_usuarios
    ADD CONSTRAINT sessoes_usuarios_usuario_uuid_fkey FOREIGN KEY (usuario_uuid) REFERENCES public.usuarios(uuid) ON DELETE CASCADE;


--
-- Name: turmas turmas_curso_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.turmas
    ADD CONSTRAINT turmas_curso_uuid_fkey FOREIGN KEY (curso_uuid) REFERENCES public.cursos(uuid) ON DELETE CASCADE;


--
-- Name: unidades_curriculares unidades_curriculares_curso_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.unidades_curriculares
    ADD CONSTRAINT unidades_curriculares_curso_uuid_fkey FOREIGN KEY (curso_uuid) REFERENCES public.cursos(uuid) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict JRAreNIOmEktq0xM3DNYOlJL3J4ailPitEbu1oycVeHsksAKfGhVwmCRdnwJoDu

