require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT) || 5432,
    user: process.env.DB_USER || process.env.POSTGRES_USER || process.env.USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || process.env.PASSWORD || 'postgres',
    database: process.env.DATABASE || process.env.POSTGRES_DB || 'vitrine_senai',
});

async function listUsers() {
    try {
        const res = await pool.query('SELECT uuid, nome, email, tipo FROM usuarios ORDER BY nome');
        console.log('--- SYSTEM USERS ---');
        console.table(res.rows);
        await pool.end();
    } catch (err) {
        console.error('Error querying users:', err);
    }
}

listUsers();
