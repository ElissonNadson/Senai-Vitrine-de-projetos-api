const { Client } = require('pg');

const client = new Client({
    host: 'vitrinesenaifeira.cloud',
    port: 31982,
    user: 'api_user',
    password: 'J3sus1sK1ng',
    database: 'vitrine_senai',
});

const newDepartments = [
    {
        nome: 'Automação',
        sigla: 'AUTO',
        descricao: 'Sistemas automatizados, controladores, IoT e robótica industrial',
        cor_hex: '#10B981',
        icone: 'settings',
        ativo: true
    },
    {
        nome: 'Manutenção',
        sigla: 'MANUT',
        descricao: 'Manutenção industrial, sistemas elétricos e mecânicos',
        cor_hex: '#F59E0B',
        icone: 'wrench',
        ativo: true
    },
    {
        nome: 'Gestão e Tecnologia da Informação',
        sigla: 'GTI',
        descricao: 'Gestão, administração, desenvolvimento de software e tecnologia da informação',
        cor_hex: '#3B82F6',
        icone: 'briefcase',
        ativo: true
    },
    {
        nome: 'Química, Segurança e Edificações',
        sigla: 'QSE',
        descricao: 'Processos químicos, segurança do trabalho e construção civil',
        cor_hex: '#8B5CF6',
        icone: 'flask',
        ativo: true
    },
    {
        nome: 'Gratuidade',
        sigla: 'GRAT',
        descricao: 'Programas de gratuidade e projetos sociais',
        cor_hex: '#EC4899',
        icone: 'heart',
        ativo: true
    }
];

async function updateDepartments() {
    try {
        await client.connect();
        console.log('Connected to database');

        // 1. Mostrar dados atuais
        const res = await client.query('SELECT * FROM departamentos');
        console.log('Current departments:', res.rows.map(r => r.nome));

        // 2. Apagar dados atuais
        await client.query('DELETE FROM departamentos');
        console.log('Deleted all existing departments');

        // 3. Inserir novos dados
        for (const dept of newDepartments) {
            const query = `
        INSERT INTO departamentos (uuid, nome, sigla, descricao, cor_hex, icone, ativo)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
      `;
            const values = [dept.nome, dept.sigla, dept.descricao, dept.cor_hex, dept.icone, dept.ativo];
            await client.query(query, values);
        }

        console.log('Inserted new departments:', newDepartments.map(d => d.nome));

    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
        console.log('Disconnected');
    }
}

updateDepartments();
