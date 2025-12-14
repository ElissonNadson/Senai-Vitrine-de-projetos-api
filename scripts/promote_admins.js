const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '../.env');
let envConfig = {};

try {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                if (key && value) {
                    envConfig[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.error('Error reading .env:', e);
}

const dbUser = envConfig.DB_USER || envConfig.POSTGRES_USER || process.env.DB_USER || 'postgres';
const dbPassword = envConfig.DB_PASSWORD || envConfig.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'postgres';
const dbHost = envConfig.HOST || envConfig.DB_HOST || process.env.DB_HOST || 'localhost';
const dbPort = Number(envConfig.DB_PORT || envConfig.POSTGRES_PORT || process.env.DB_PORT || 5432);
const dbName = envConfig.DATABASE || envConfig.POSTGRES_DB || process.env.DB_NAME || 'vitrine_senai';

console.log(`Connecting to DB ${dbName} at ${dbHost}:${dbPort}...`);

const client = new Client({
    user: dbUser,
    password: dbPassword,
    host: dbHost,
    database: dbName,
    port: dbPort,
});

async function run() {
    try {
        await client.connect();
        console.log('Connected.');

        const usersToPromote = [
            { email: 'nadsonnodachi@gmail.com', nome: 'Nadson Nodachi' },
            { email: 'ingridbarretoap@gmail.com', nome: 'Ingrid Barreto' }
        ];

        for (const u of usersToPromote) {
            console.log(`\nProcessing ${u.email}...`);

            // Check if user exists
            const res = await client.query('SELECT * FROM usuarios WHERE email = $1', [u.email]);

            if (res.rows.length > 0) {
                const user = res.rows[0];
                console.log(`User found. Current Type: ${user.tipo}`);
                if (user.tipo !== 'ADMIN') {
                    await client.query("UPDATE usuarios SET tipo = 'ADMIN' WHERE uuid = $1", [user.uuid]);
                    console.log(`UPDATED: Promoted to ADMIN.`);
                } else {
                    console.log(`User is already ADMIN.`);
                }
            } else {
                console.log(`User NOT found. Creating new ADMIN...`);
                // Create with placeholder google_id
                const placeholderGoogleId = `manual_${u.email.split('@')[0]}_${Date.now()}`;

                await client.query(
                    `INSERT INTO usuarios (email, nome, tipo, google_id, ativo) 
                 VALUES ($1, $2, 'ADMIN', $3, true)`,
                    [u.email, u.nome, placeholderGoogleId]
                );
                console.log(`CREATED: Inserted as ADMIN with google_id='${placeholderGoogleId}'.`);
            }
        }

        // Verify Final State
        const emailsParam = usersToPromote.map(u => `'${u.email}'`).join(',');
        const ver = await client.query(`SELECT email, tipo FROM usuarios WHERE email IN (${emailsParam})`);

        console.log('\n--- Final Verification ---');
        ver.rows.forEach(r => console.log(`${r.email}: ${r.tipo}`));

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await client.end();
    }
}

run();
