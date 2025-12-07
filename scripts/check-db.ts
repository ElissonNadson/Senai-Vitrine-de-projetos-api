
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars manually simple way
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
}, {} as any);

const client = new Client({
    host: env.HOST || 'vitrinesenaifeira.cloud',
    port: parseInt(env.DB_PORT || '31982'),
    database: env.DATABASE || 'vitrine_senai',
    user: env.DB_USER || 'api_user',
    password: env.DB_PASSWORD || 'J3sus1sK1ng',
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const admins = await client.query('SELECT count(*) as count FROM usuarios WHERE tipo = \'ADMIN\'');
        console.log('Admins Count:', admins.rows[0].count);

        const usersCount = await client.query('SELECT count(*) as count FROM usuarios');
        console.log('Total Users Count:', usersCount.rows[0].count);
        const usersSample = await client.query('SELECT string_agg(email, \', \') as emails FROM (SELECT email FROM usuarios LIMIT 5) s');
        console.log('Sample Emails:', usersSample.rows[0].emails);

        const coursesCount = await client.query('SELECT count(*) as count FROM cursos');
        console.log('Total Courses Count:', coursesCount.rows[0].count);
        const coursesSample = await client.query('SELECT string_agg(nome, \', \') as names FROM (SELECT nome FROM cursos LIMIT 5) s');
        console.log('Sample Courses:', coursesSample.rows[0].names);

        const classes = await client.query('SELECT count(*) as count FROM turmas');
        console.log('Classes Count:', classes.rows[0].count);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
