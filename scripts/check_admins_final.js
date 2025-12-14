const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
let envConfig = {};
try {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                envConfig[parts[0].trim()] = parts.slice(1).join('=').trim();
            }
        });
    }
} catch (e) { }

const client = new Client({
    user: envConfig.DB_USER || process.env.DB_USER || 'postgres',
    password: envConfig.DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    host: envConfig.HOST || process.env.DB_HOST || 'localhost',
    database: envConfig.DATABASE || process.env.DB_NAME || 'vitrine_senai',
    port: Number(envConfig.DB_PORT || process.env.DB_PORT || 5432),
});

async function run() {
    await client.connect();
    const res = await client.query("SELECT email, tipo, google_id FROM usuarios WHERE tipo = 'ADMIN'");
    console.log('--- ALL ADMINS ---');
    res.rows.forEach(u => console.log(`${u.email} (ID: ${u.google_id})`));
    await client.end();
}
run();
