-- Seeding News Data
-- Author: nadsonnodachi@gmail.com (6079d76a-6339-494b-9cd9-70118bb40af4)

INSERT INTO noticias (
    titulo, 
    resumo, 
    conteudo, 
    banner_url, 
    data_evento, 
    categoria, 
    autor_uuid,
    publicado,
    destaque,
    data_publicacao
) VALUES 
(
    'SENAI CIMATEC tem projeto vencedor do Prêmio ANP de Inovação',
    'SENAI CIMATEC conquista destaque no Prêmio ANP de Inovação Tecnológica com o programa BRAVE, em parceria com a Shell Brasil.',
    'O SENAI CIMATEC foi destaque na edição 2025 do Prêmio ANP de Inovação Tecnológica, realizada em 5 de dezembro, no Rio de Janeiro. O BRAVE, Programa Brasileiro para o Desenvolvimento do Agave, conquistou a categoria dedicada à transição energética e às energias renováveis. A iniciativa é desenvolvida com investimentos oriundos da EMBRAPII e da cláusula de PD&I da ANP, em parceria com a Shell Brasil e a Unicamp.',
    'src/assets/images/news/news-1.jpg',
    '2025-12-10',
    'Inovação',
    '6079d76a-6339-494b-9cd9-70118bb40af4',
    true,
    true,
    '2025-12-10'
),
(
    'SENAI CIMATEC vence a 10ª edição do Programa Mãos Dadas',
    'Projeto de reaproveitamento de materiais em PD&I é reconhecido na 10ª edição do Programa Mãos Dadas.',
    'O SENAI CIMATEC foi vencedor da 10ª edição do Programa Mãos Dadas com um projeto inovador focado no reaproveitamento de materiais em Pesquisa, Desenvolvimento e Inovação (PD&I). A iniciativa reforça o compromisso da instituição com a sustentabilidade e a eficiência no uso de recursos.',
    'https://www.senaicimatec.com.br/wp-content/uploads/2025/12/WhatsApp-Image-2025-12-01-at-10.49.28.jpeg',
    '2025-12-01',
    'Premiação',
    '6079d76a-6339-494b-9cd9-70118bb40af4',
    true,
    true,
    '2025-12-01'
),
(
    'CIMATEC Startups realiza graduação das turmas de Validação e Operação',
    'Ciclo de aceleração encerra com graduação das startups nas fases de Validação e Operação.',
    'O SENAI CIMATEC realizou, na última terça-feira (25), a graduação das turmas 2025.2 da trilha de Validação e Operação do CIMATEC Startups, programa voltado ao desenvolvimento de negócios inovadores. Durante três meses, os participantes vivenciaram uma jornada intensa de mentorias especializadas, atividades práticas, acompanhamento contínuo e eventos de networking que contribuíram para a maturação de suas soluções e modelos de negócio.',
    'src/assets/images/news/news-graduacao.png',
    '2025-11-25',
    'Startups',
    '6079d76a-6339-494b-9cd9-70118bb40af4',
    true,
    false,
    '2025-11-25'
),
(
    'XXIV Seminário das Indústrias Gráficas destaca tendências da Gráfica 5.0',
    'Evento realizado no SENAI CIMATEC discute o futuro do setor no Brasil com foco em inovação, sustentabilidade e criatividade.',
    'Empresários, especialistas e profissionais do setor gráfico se reuniram na última quarta-feira (26) no SENAI CIMATEC para o XXIV Seminário das Indústrias Gráficas, evento que colocou em pauta inovação, sustentabilidade e criatividade como pilares da Gráfica 5.0. O seminário apresentou reflexões sobre os desafios e as oportunidades de uma indústria que vem passando por transformação acelerada nas últimas décadas.',
    'src/assets/images/news/news-seminario.png',
    '2025-11-27',
    'Indústria',
    '6079d76a-6339-494b-9cd9-70118bb40af4',
    true,
    false,
    '2025-11-27'
),
(
    'Jornada Nacional de Inovação destaca potencial do Nordeste em energias renováveis',
    'Encontro regional discute estratégias para impulsionar o setor energético na região.',
    'A Jornada Nacional de Inovação reuniu especialistas e líderes do setor para discutir o papel estratégico do Nordeste na transição energética do Brasil. O evento destacou projetos de hidrogênio verde, energia eólica offshore e novas tecnologias para o setor de óleo e gás.',
    'src/assets/images/news/news-3.png',
    '2025-11-27',
    'Energia',
    '6079d76a-6339-494b-9cd9-70118bb40af4',
    true,
    false,
    '2025-11-27'
),
(
    'QuIIN fortalece cooperação internacional durante missão técnica à Alemanha',
    'Missão técnica promovida pela EMBRAPII e Fraunhofer busca novas parcerias tecnológicas.',
    'Representantes do SENAI CIMATEC integraram a comitiva brasileira na missão técnica à Alemanha, promovida pela EMBRAPII em parceria com o Instituto Fraunhofer. O objetivo foi fortalecer a cooperação internacional em pesquisa aplicada e inovação industrial, com foco em manufatura avançada e digitalização.',
    'src/assets/images/news/news-1.jpg',
    '2025-11-26',
    'Internacional',
    '6079d76a-6339-494b-9cd9-70118bb40af4',
    true,
    false,
    '2025-11-26'
),
(
    'SENAI abre inscrições para cursos técnicos com foco na Indústria 4.0',
    'Novas turmas para cursos em automação, robótica e desenvolvimento de sistemas.',
    'O SENAI está com inscrições abertas para o processo seletivo dos cursos técnicos 2026.1. São milhares de vagas em diversas áreas tecnológicas, com destaque para as formações voltadas à Indústria 4.0, como Automação Industrial, Mecatrônica e Desenvolvimento de Sistemas. Os cursos contam com aulas práticas em laboratórios de ponta.',
    'src/assets/images/news/news-2.png',
    '2025-11-20',
    'Educação',
    '6079d76a-6339-494b-9cd9-70118bb40af4',
    true,
    false,
    '2025-11-20'
),
(
    'Novo laboratório de Inteligência Artificial é inaugurado no CIMATEC Park',
    'Infraestrutura de ponta impulsionará pesquisas em IA generativa e visão computacional.',
    'O SENAI CIMATEC inaugurou seu mais novo laboratório dedicado à Inteligência Artificial no complexo CIMATEC Park. O espaço, equipado com supercomputadores e data center de última geração, será utilizado para o desenvolvimento de soluções em IA generativa, visão computacional e análise de grandes volumes de dados para a indústria.',
    'src/assets/images/news/news-3.png',
    '2025-11-15',
    'Tecnologia',
    '6079d76a-6339-494b-9cd9-70118bb40af4',
    true,
    false,
    '2025-11-15'
),
(
    'SENAI promove Hackathon Industrial com foco em soluções sustentáveis',
    'Maratona de programação reúne estudantes e startups para resolver desafios reais da indústria.',
    'Mais de 200 participantes se reuniram no SENAI para o Hackathon Industrial 2025. O desafio deste ano foi desenvolver soluções tecnológicas voltadas para a sustentabilidade e a economia circular nas linhas de produção. As equipes vencedoras receberão mentorias e apoio para transformar seus protótipos em negócios.',
    'src/assets/images/news/news-1.jpg',
    '2025-11-10',
    'Evento',
    '6079d76a-6339-494b-9cd9-70118bb40af4',
    true,
    false,
    '2025-11-10'
),
(
    'Parceria entre SENAI e setor automotivo impulsiona mobilidade elétrica na Bahia',
    'Acordo visa capacitação profissional e desenvolvimento de novas tecnologias para veículos elétricos.',
    'O SENAI firmou um acordo de cooperação técnica com grandes montadoras instaladas na Bahia para impulsionar a cadeia da mobilidade elétrica no estado. A parceria prevê a criação de cursos específicos para a manutenção de veículos elétricos e híbridos, além de projetos de P&D voltados para baterias e infraestrutura de recarga.',
    'src/assets/images/news/news-2.png',
    '2025-11-05',
    'Parceria',
    '6079d76a-6339-494b-9cd9-70118bb40af4',
    true,
    false,
    '2025-11-05'
);
