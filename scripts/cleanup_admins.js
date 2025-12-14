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
    } else {
        console.warn('Warning: .env file not found at', envPath);
    }
} catch (e) {
    console.error('Error reading .env:', e);
}

// Fallback to process.env
const dbUser = envConfig.DB_USER || envConfig.POSTGRES_USER || process.env.DB_USER || 'postgres';
const dbPassword = envConfig.DB_PASSWORD || envConfig.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'postgres';
const dbHost = envConfig.HOST || envConfig.DB_HOST || process.env.DB_HOST || 'localhost';
const dbPort = Number(envConfig.DB_PORT || envConfig.POSTGRES_PORT || process.env.DB_PORT || 5432);
const dbName = envConfig.DATABASE || envConfig.POSTGRES_DB || process.env.DB_NAME || 'vitrine_senai';

console.log(`Connecting to DB ${dbName} at ${dbHost}:${dbPort} as ${dbUser}`);

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
        console.log('Connected successfully.');

        // 1. List ANY users to debug
        const resAll = await client.query("SELECT email, tipo FROM usuarios LIMIT 50");
        console.log('\n--- First 50 Users (for debug) ---');
        resAll.rows.forEach(u => console.log(`${u.email} - ${u.tipo}`));

        // 2. Check for the specific users
        const specificEmails = ['nadsonnodachi@gmail.com', 'ingridbarretoap@gmail.com'];
        const placeholdersSpecific = specificEmails.map((_, i) => `$${i + 1}`).join(',');
        const resSpecific = await client.query(`SELECT email, tipo FROM usuarios WHERE email IN (${placeholdersSpecific})`, specificEmails);

        console.log('\n--- Usage of Targeted Emails ---');
        if (resSpecific.rows.length === 0) {
            console.log("Target users NOT FOUND in DB.");
        } else {
            resSpecific.rows.forEach(u => console.log(`Found: ${u.email} as ${u.tipo}`));
        }

        // 3. Original Logic (List Admins)
        const res = await client.query("SELECT uuid, email, nome FROM usuarios WHERE tipo = 'ADMIN'");
        const allAdmins = res.rows;

        console.log('\n--- Current Admins (Retry) ---');
        if (allAdmins.length === 0) {
            console.log('No admins found.');
            return;
        }

        allAdmins.forEach(u => console.log(`- ${u.email} (${u.nome})`));

        // 4. Identify users to keep and delete
        const keepEmails = ['nadsonnodachi@gmail.com', 'ingridbarretoap@gmail.com'];
        const toDelete = allAdmins.filter(u => !keepEmails.includes(u.email));

        console.log('\n--- Admins to Delete ---');
        if (toDelete.length === 0) {
            console.log('No admins to delete (all matches kept list).');
            return;
        }

        toDelete.forEach(u => console.log(`- ${u.email} (${u.nome})`));

        // 5. Execute Deletion
        const uuidsToDelete = toDelete.map(u => u.uuid);
        const placeholders = uuidsToDelete.map((_, i) => `$${i + 1}`).join(',');
        const deleteQuery = `DELETE FROM usuarios WHERE uuid IN (${placeholders})`;

        console.log(`\nDeleting ${toDelete.length} users...`);
        await client.query(deleteQuery, uuidsToDelete);

        console.log('Deletion successful.');

    } catch (err) {
        if (err.code === '23503') { // Foreign key violation
            console.error('\nERROR: Could not delete some users because they have related records (e.g. Projects) that strictly reference them.');
            console.error('Details:', err.detail);
        } else {
            console.error('\nDatabase Error:', err);
        }
    } finally {
        await client.end();
    }
}

run();
