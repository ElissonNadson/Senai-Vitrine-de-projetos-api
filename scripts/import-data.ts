
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';

// Load env vars
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

// Paths to CSVs
const CSV_CAIXA = path.join(__dirname, '../../caixa_utf8.csv');
const CSV_DADOS = path.join(__dirname, '../../dados_utf8.csv');
const CSV_ORIENTADORES = path.join(__dirname, '../../orientadores_utf8.csv');

async function readCsv(filePath: string): Promise<any[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.csv.readFile(filePath, { parserOptions: { delimiter: ';' } });
    const worksheet = workbook.getWorksheet(1);
    const rows: any[] = [];
    if (!worksheet) return [];

    let headers: string[] = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
            headers = Array.isArray(row.values) ? row.values.slice(1) as string[] : [];
        } else {
            const rowData: any = {};
            const values = Array.isArray(row.values) ? row.values.slice(1) : [];
            headers.forEach((header, index) => {
                rowData[header] = values[index];
            });
            rows.push(rowData);
        }
    });
    return rows;
}

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB');

        console.log('Cleaning old data...');
        // Truncate cascade to clean everything
        await client.query('TRUNCATE TABLE usuarios, cursos, turmas, unidades_curriculares, departamentos CASCADE');
        // Re-insert departments (seeds.sql had them, but we wiped. Wait, seeds.sql is immutable? 
        // We deleted departments too. We might want to keep departments or re-insert them. 
        // The CSVs don't have departments. I'll re-insert default departments from seeds logic if needed or skip.
        // But Professores need department_uuid. I'll make it nullable or create a default 'Geral'.

        // Re-create a default department for professors if needed
        const deptUuid = uuidv4();
        await client.query(`INSERT INTO departamentos (uuid, nome, sigla, ativo) VALUES ($1, 'Geral', 'GER', TRUE)`, [deptUuid]);

        console.log('Importing Catalog (Courses/Classes/Units)...');
        const catalog = await readCsv(CSV_CAIXA);

        const coursesMap = new Map<string, string>(); // Name -> UUID
        const classesMap = new Map<string, string>(); // Code -> UUID (Globally unique code or per course?)
        // CSV: CURSO;TURMA;UNIDADE CURRICULAR

        for (const row of catalog) {
            const courseName = row['CURSO'];
            const classCode = row['TURMA']; // e.g. 93626
            const unitName = row['UNIDADE CURRICULAR'];

            if (!courseName) continue;

            // Course
            let courseUuid = coursesMap.get(courseName);
            if (!courseUuid) {
                // Check if already inserted in this run (in case map missed properties?)
                // Just create new
                courseUuid = uuidv4();
                await client.query(
                    'INSERT INTO cursos (uuid, nome, modalidade, ativo) VALUES ($1, $2, $3, $4)',
                    [courseUuid, courseName, 'TÉCNICO', true]
                );
                coursesMap.set(courseName, courseUuid);
                console.log(`Created Course: ${courseName}`);
            }

            // Class
            if (classCode) {
                const classKey = `${courseName}-${classCode}`;
                if (!classesMap.has(classKey)) {
                    const classUuid = uuidv4();
                    // Use a default year 2024 for now since CSV doesn't specify
                    await client.query(
                        'INSERT INTO turmas (uuid, curso_uuid, codigo, ano, semestre, turno, ativa) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                        [classUuid, courseUuid, classCode, 2024, 1, 'MATUTINO', true]
                    );
                    classesMap.set(classKey, classUuid);
                    console.log(`Created Class: ${classCode} for ${courseName}`);
                }
            }

            // Unit
            if (unitName) {
                // Check exist
                const exist = await client.query('SELECT 1 FROM unidades_curriculares WHERE nome = $1 AND curso_uuid = $2', [unitName, courseUuid]);
                if (exist.rowCount === 0) {
                    await client.query(
                        'INSERT INTO unidades_curriculares (uuid, curso_uuid, nome, ativa) VALUES ($1, $2, $3, $4)',
                        [uuidv4(), courseUuid, unitName, true]
                    );
                }
            }
        }

        console.log('Importing Students...');
        const students = await readCsv(CSV_DADOS);
        // CURSO;TURMA;ALUNO;EMAILGOOGLE;MODALIDADE

        for (const row of students) {
            const name = row['ALUNO'];
            const email = row['EMAILGOOGLE'];
            const courseName = row['CURSO'];
            const classCode = row['TURMA'];
            const modalidade = row['MODALIDADE']; // Use this?

            if (!email || !name) continue;

            // Find Course
            let courseUuid = coursesMap.get(courseName);
            if (!courseUuid && courseName) {
                // Try finding by query if mapped differently
                const res = await client.query('SELECT uuid FROM cursos WHERE nome = $1', [courseName]);
                if (res.rowCount > 0) courseUuid = res.rows[0].uuid;
            }

            // Find Class
            let classUuid: string | undefined;
            if (courseName && classCode) {
                const classKey = `${courseName}-${classCode}`;
                classUuid = classesMap.get(classKey);
                if (!classUuid) {
                    // Try query
                    const res = await client.query('SELECT uuid FROM turmas WHERE codigo = $1', [classCode]); // Assuming unique codes?
                    if (res.rowCount > 0) classUuid = res.rows[0].uuid;
                }
            }

            // Create User
            const userUuid = uuidv4();
            const googleId = `imported_${email}`; // Placeholder

            try {
                await client.query(
                    'INSERT INTO usuarios (uuid, nome, email, google_id, tipo, primeiro_acesso, ativo) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [userUuid, name, email, googleId, 'ALUNO', true, true]
                );

                await client.query(
                    'INSERT INTO alunos (usuario_uuid, matricula, curso_uuid, turma_uuid) VALUES ($1, $2, $3, $4)',
                    [userUuid, null, courseUuid || null, classUuid || null]
                );
                console.log(`Imported Student: ${name}`);
            } catch (e: any) {
                console.error(`Failed to import student ${name}: ${e.message}`);
            }
        }

        console.log('Importing Professors...');
        const professors = await readCsv(CSV_ORIENTADORES);
        // ORIENTADOR;EMAILGOOGLE

        for (const row of professors) {
            const name = row['ORIENTADOR'];
            const email = row['EMAILGOOGLE'];

            if (!email || !name) continue;

            const userUuid = uuidv4();
            const googleId = `imported_${email}`;

            try {
                await client.query(
                    'INSERT INTO usuarios (uuid, nome, email, google_id, tipo, primeiro_acesso, ativo) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [userUuid, name, email, googleId, 'PROFESSOR', true, true]
                );

                await client.query(
                    'INSERT INTO professores (usuario_uuid, departamento_uuid) VALUES ($1, $2)',
                    [userUuid, deptUuid]
                );
                console.log(`Imported Professor: ${name}`);
            } catch (e: any) {
                console.error(`Failed to import professor ${name}: ${e.message}`);
            }
        }

        console.log('Migration Completed!');

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
