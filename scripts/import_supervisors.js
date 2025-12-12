
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const csvFilePath = path.join(__dirname, '..', '..', 'Lista orientadores.csv');

async function importSupervisors() {
    const pool = new Pool({
        user: process.env.DB_USER || process.env.POSTGRES_USER || process.env.USERNAME,
        password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || process.env.PASSWORD,
        host: process.env.HOST || process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || process.env.POSTGRES_PORT) || 5432,
        database: process.env.DATABASE || process.env.POSTGRES_DB,
    });

    const client = await pool.connect();

    try {
        console.log('Lendo arquivo CSV...');
        const fileContent = fs.readFileSync(csvFilePath, 'utf8');
        const lines = fileContent.split('\n');

        // Ignorar cabeçalho e linhas vazias
        const dataLines = lines.slice(1).filter(line => line.trim().length > 0);

        console.log(`Encontrados ${dataLines.length} registros para processar.`);

        let addedCount = 0;
        let existingCount = 0;
        let errorCount = 0;

        for (const line of dataLines) {
            const parts = line.split(';');
            if (parts.length < 2) continue;

            const nome = parts[0].trim();
            const email = parts[1].trim();

            if (!email) continue;

            try {
                await client.query('BEGIN');

                // Verificar se usuário já existe
                const existingUser = await client.query('SELECT uuid FROM usuarios WHERE email = $1', [email]);

                if (existingUser.rows.length > 0) {
                    existingCount++;
                    // Opcional: garantir que ele seja professor
                    const userId = existingUser.rows[0].uuid;

                    // Verificar se já é professor
                    const existingProf = await client.query('SELECT * FROM professores WHERE usuario_uuid = $1', [userId]);

                    if (existingProf.rows.length === 0) {
                        // Se usuário existe mas não é professor, insere na tabela professores
                        // Gerar matrícula temporária se necessário
                        const matricula = 'P' + Math.floor(Math.random() * 100000);
                        await client.query(
                            'INSERT INTO professores (usuario_uuid, matricula) VALUES ($1, $2)',
                            [userId, matricula]
                        );
                        // Atualiza tipo para PROFESSOR se não for
                        await client.query("UPDATE usuarios SET tipo = 'PROFESSOR' WHERE uuid = $1 AND tipo != 'PROFESSOR'", [userId]);
                        console.log(`Usuário ${email} promovido a professor.`);
                    }

                } else {
                    // Criar novo usuário
                    const userId = uuidv4();

                    await client.query(
                        `INSERT INTO usuarios (uuid, nome, email, tipo, primeiro_acesso, ativo, criado_em, atualizado_em, google_id)
             VALUES ($1, $2, $3, 'PROFESSOR', TRUE, TRUE, NOW(), NOW(), $4)`,
                        [userId, nome, email, `generated_${userId}`]
                    );

                    // Criar registro de professor
                    // Gerar matrícula aleatória pois não temos no CSV
                    const matricula = 'P' + Math.floor(10000 + Math.random() * 90000);

                    await client.query(
                        'INSERT INTO professores (usuario_uuid, matricula) VALUES ($1, $2)',
                        [userId, matricula]
                    );

                    addedCount++;
                }

                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`Erro ao processar ${email}:`, err.message);
                errorCount++;
            }
        }

        console.log('Importação concluída!');
        console.log(`Adicionados: ${addedCount}`);
        console.log(`Existentes: ${existingCount}`);
        console.log(`Erros: ${errorCount}`);

    } catch (err) {
        console.error('Erro fatal:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

importSupervisors();
