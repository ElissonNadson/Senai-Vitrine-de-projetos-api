
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function inspect() {
    const client = new Client({
        host: process.env.HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const tables = ['alunos', 'projetos_alunos', 'usuarios', 'professores', 'projetos_professores'];

        for (const table of tables) {
            console.log(`\n--- Columns for ${table} ---`);
            const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);

            res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

inspect();
