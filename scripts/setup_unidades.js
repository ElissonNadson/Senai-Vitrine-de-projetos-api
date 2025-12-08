require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'vitrine-senai-db',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'vitrine_senai',
});

const cursosHardcoded = [
    {
        nome: "Técnico em Administração",
        unidades: [
            "Criatividade e ideação em projetos",
            "Fundamentos de Administração",
            "Gestão Ambiental e da Qualidade",
            "Introdução a Indústria 4.0",
            "Introdução a Processos de Melhoria e Inovação",
            "Introdução a Qualidade e Produtividade",
            "Introdução a Tecnologia da Informação e Comunicação",
            "Introdução ao Desenvolvimento de Projetos",
            "Introdução à Gestão Organizacional",
            "Modelagem de Projetos",
            "Planejamento e Monitoramento de Atividades Administrativas",
            "Processos Administrativos de Apoio Contábil e Financeiro",
            "Processos Administrativos de Marketing e Vendas",
            "Processos Administrativos de RH e DP",
            "Processos Administrativos na Produção e Logística",
            "Processos Administrativos no Apoio a Projetos",
            "Prototipagem de Projetos",
            "Saúde e Segurança no Trabalho",
            "Sustentabilidade nos Processos Industriais"
        ]
    },
    {
        nome: "Técnico em Desenvolvimento de Sistemas",
        unidades: [
            "Banco de Dados",
            "Criatividade e ideação em projetos",
            "Desenvolvimento de Sistemas",
            "Fundamentos de Eletroeletrônica Aplicada",
            "Implantação de Sistemas",
            "Implementação de Projetos",
            "Interface Homem-Computador",
            "Internet das Coisas",
            "Introdução a Indústria 4.0",
            "Introdução a Qualidade e Produtividade",
            "Introdução a Tecnologia da Informação e Comunicação",
            "Introdução ao Desenvolvimento de Projetos",
            "Lógica de Programação",
            "Manutenção de Sistemas",
            "Modelagem de Projetos",
            "Modelagem de Sistemas",
            "Prototipagem de Projetos",
            "Programação de Aplicativos",
            "Saúde e Segurança no Trabalho",
            "Sustentabilidade nos Processos Industriais",
            "Teste de Sistemas"
        ]
    },
    {
        nome: "Técnico em Eletromecânica",
        unidades: [
            "Controladores Lógicos Programáveis",
            "Criatividade e Ideação em Projetos",
            "Elementos de Máquinas",
            "Fabricação Mecânica Aplicada à Manutenção e à Montagem",
            "Fundamentos da Eletricidade Industrial",
            "Fundamentos da Tecnologia Mecânica",
            "Implementação de Projetos",
            "Introdução a Indústria 4.0",
            "Introdução a Qualidade e Produtividade",
            "Introdução a Tecnologia da Informação e Comunicação",
            "Introdução ao Desenvolvimento de Projetos",
            "Introdução à Fabricação Mecânica",
            "Manutenção de Sistemas Automatizados",
            "Manutenção Elétrica de Máquinas e Equipamentos",
            "Manutenção Mecânica de Máquinas e Equipamentos",
            "Modelagem de Projetos",
            "Montagem de Sistemas Elétricos",
            "Montagem de Sistemas Mecânicos",
            "Organização da Produção Mecânica",
            "Planejamento e Controle da Manutenção",
            "Projeto de Inovação em Eletromecânica",
            "Prototipagem de Projetos",
            "Saúde e Segurança no Trabalho",
            "Sustentabilidade nos Processos Industriais"
        ]
    },
    {
        nome: "Técnico em Eletrotécnica",
        unidades: [
            "Criatividade e ideação em Projetos",
            "Desenho Técnico Aplicado a Projetos Elétricos",
            "Eficiência Energética",
            "Fundamentos de Eletricidade",
            "Fundamentos de Sistemas Elétricos",
            "Gestão Operacional Integrada",
            "Implementação de Projetos",
            "Instalação e Manutenção Elétrica Predial",
            "Instalações de Sistemas Elétricos de Potencia - SEP",
            "Instalações e Acionamentos Elétricos Industriais",
            "Integração de Sistemas de Energias Renováveis",
            "Integração de Sistemas Elétricos Automatizados",
            "Introdução a Indústria 4.0",
            "Introdução a Qualidade e Produtividade",
            "Introdução a Tecnologia da Informação e Comunicação",
            "Introdução ao Desenvolvimento de Projetos",
            "Manutenção e Operação de Sistemas Elétricos de Potência - SEP",
            "Manutenção Elétrica Industrial",
            "Modelagem de Projetos",
            "Projetos de Instalações Elétricas de Potencia",
            "Projetos Elétricos Industriais",
            "Projetos Elétricos Prediais",
            "Prototipagem de Projetos",
            "Saúde e Segurança no Trabalho",
            "Sustentabilidade nos Processos Industriais"
        ]
    },
    {
        nome: "Técnico em Logística",
        unidades: [
            "Criatividade e ideação em projetos",
            "Gestão da Produção",
            "Gestão de Suprimentos",
            "Gestão de Transporte e Distribuição",
            "Implementação de Projetos",
            "Introdução a Indústria 4.0",
            "Introdução a Qualidade e Produtividade",
            "Introdução a Tecnologia da Informação e Comunicação",
            "Introdução ao Desenvolvimento de Projetos",
            "Introdução aos Processos Logísticos",
            "Logística Integrada",
            "Logística Sustentável",
            "Métodos Quantitativos Aplicados à Logística",
            "Modelagem de Projetos",
            "Processos de Armazenagem",
            "Prototipagem de Projetos",
            "Saúde e Segurança no Trabalho",
            "Sustentabilidade nos Processos Industriais"
        ]
    },
    {
        nome: "Técnico em Manutenção Automotiva",
        unidades: [
            "Criatividade e ideação em projetos",
            "Diagnósticos Avançados em Sistemas Automotivos",
            "Fundamentos e Tecnologias da Carroceria Automotiva",
            "Gestão da Manutenção Automotiva",
            "Implementação de Projetos",
            "Inspeção Veicular",
            "Introdução a Indústria 4.0",
            "Introdução a Qualidade e Produtividade",
            "Introdução a Tecnologia da Informação e Comunicação",
            "Introdução à Eletromobilidade",
            "Introdução ao Desenvolvimento de Projetos",
            "Introdução às Tecnologias e Processos da Manutenção Eletromecânica Automotiva",
            "Modelagem de Projetos",
            "Motores de Combustão Interna",
            "Prototipagem de Projetos",
            "Saúde e Segurança no Trabalho",
            "Sistemas de Freios, Suspensão e Direção",
            "Sistemas de Transmissão de Veículos",
            "Sistemas Eletroeletrônicos Automotivos",
            "Sustentabilidade nos Processos Industriais",
            "Vistoria de Sinistros e Cautelar"
        ]
    },
    {
        nome: "Técnico em Química",
        unidades: [
            "Análises Instrumentais",
            "Análises Microbiológicas",
            "Ciências Aplicadas à Segurança e Saúde do Trabalho",
            "Criatividade e Ideação em Projetos",
            "Desenvolvimento de Métodos Analíticos, Produtos e Processos",
            "Físico-química Aplicada",
            "Fundamentos das Técnicas Laboratoriais",
            "Fundamentos de Bioquímica e Microbiologia",
            "Fundamentos de Matemática e Física",
            "Fundamentos de Processos Químicos Industriais",
            "Fundamentos de Química Geral e Inorgânica",
            "Fundamentos de Química Orgânica",
            "Gestão de Pessoas",
            "Implementação de Projetos",
            "Introdução a Indústria 4.0",
            "Introdução a Tecnologia da Informação e Comunicação",
            "Modelagem de Projetos",
            "Química Analítica",
            "Química Orgânica Experimental",
            "Saúde e Segurança no Trabalho",
            "Sustentabilidade nos Processos Industriais"
        ]
    },
    {
        nome: "Técnico em Segurança do Trabalho",
        unidades: [
            "Assessoria e Consultoria em Saúde, Segurança e Meio Ambiente do Trabalho",
            "Ciências Aplicadas à Segurança e Saúde do Trabalho",
            "Comunicação e Informação aplicadas à Segurança e Saúde do Trabalho",
            "Coordenação de Programas e Procedimentos de Saúde e Segurança do Trabalho",
            "Criatividade e ideação em projetos",
            "Ergonomia",
            "Fundamentos de Segurança e Saúde do Trabalho",
            "Gestão de Auditorias em de Segurança e Saúde do Trabalho",
            "Gestão de Emergências em SST",
            "Gestão de Pessoas aplicada à Segurança e Saúde do Trabalho",
            "Higiene Ocupacional",
            "Implementação de Projetos",
            "Introdução a Indústria 4.0",
            "Introdução a Qualidade e Produtividade",
            "Introdução a Tecnologia da Informação e Comunicação",
            "Introdução ao Desenvolvimento de Projetos",
            "Leitura e Interpretação de Desenho Técnico",
            "Modelagem de Projetos",
            "Monitoramento dos Programas e Documentos de Segurança e Saúde do Trabalho",
            "Planejamento e Execução de Ações Educativas",
            "Prototipagem de Projetos",
            "Rotinas de Segurança e Saúde do Trabalho",
            "Saúde e Segurança no Trabalho",
            "Sustentabilidade nos Processos Industriais"
        ]
    }
];

async function setupUnidades() {
    try {
        console.log('Conectando ao banco deados...');

        // Check connection
        const res = await pool.query('SELECT NOW()');
        console.log('Conectado:', res.rows[0]);

        // 1. Criar tabela unidades_curriculares
        console.log('Criando tabela unidades_curriculares...');
        await pool.query(`
      CREATE TABLE IF NOT EXISTS unidades_curriculares (
        uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        curso_uuid UUID NOT NULL,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (curso_uuid) REFERENCES cursos(uuid) ON DELETE CASCADE,
        UNIQUE (nome, curso_uuid)
      );
    `);
        console.log('Tabela criada ou já existente.');

        // 2. Buscar cursos existentes
        const cursosResult = await pool.query('SELECT uuid, nome FROM cursos');
        const dbCursos = cursosResult.rows;
        console.log(`Encontrados ${dbCursos.length} cursos no banco.`);

        // 3. Inserir unidades
        let totalInseridos = 0;

        for (const cursoInfo of cursosHardcoded) {
            const dbCurso = dbCursos.find(c => c.nome.trim().toLowerCase() === cursoInfo.nome.trim().toLowerCase());

            if (!dbCurso) {
                console.warn(`[AVISO] Curso não encontrado no banco: "${cursoInfo.nome}". Pulando...`);
                continue;
            }

            console.log(`Processando unidades para curso: ${cursoInfo.nome} (${dbCurso.uuid})`);

            for (const unidade of cursoInfo.unidades) {
                try {
                    await pool.query(
                        `INSERT INTO unidades_curriculares (nome, curso_uuid) 
             VALUES ($1, $2)
             ON CONFLICT (nome, curso_uuid) DO NOTHING`,
                        [unidade.trim(), dbCurso.uuid]
                    );
                    totalInseridos++;
                } catch (err) {
                    console.error(`Erro ao inserir unidade "${unidade}":`, err.message);
                }
            }
        }

        console.log(`Processo finalizado. Total de unidades processadas (inseridas/existentes): ${totalInseridos}`);

    } catch (error) {
        console.error('Erro fatal:', error);
    } finally {
        await pool.end();
    }
}

setupUnidades();
