const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const config = {
    host: 'vitrinesenaifeira.cloud',
    port: 31982,
    database: 'vitrine_senai',
    user: 'api_user',
    password: 'J3sus1sK1ng'
};

async function applyMigration() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Conectado ao banco de dados.');

        const sqlPath = '/srv/projetos/vitrine-senai/api/database/migrations/013_soft_delete_docentes.sql';
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Aplicando migration...');
        await client.query(sql);

        console.log('Migration aplicada com sucesso!');
    } catch (err) {
        console.error('Erro ao aplicar migration:', err);
    } finally {
        await client.end();
    }
}

applyMigration();
