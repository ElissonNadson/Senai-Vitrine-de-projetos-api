import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';

type CsvRow = Record<string, string>;
type EnvMap = Record<string, string>;

const DATA_DIR = path.join(__dirname, '../database/seeds/data');

function loadEnv(): EnvMap {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    throw new Error(`Arquivo .env não encontrado em: ${envPath}`);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  return envContent.split('\n').reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return acc;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) return acc;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key) {
      acc[key] = value;
    }
    return acc;
  }, {} as EnvMap);
}

function normalizeHeader(rawHeader: string): string {
  return (rawHeader ?? '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9_]/g, '');
}

function safeString(value: unknown): string {
  return String(value ?? '').trim();
}

function extractYearFromFilename(filePath: string): number | null {
  const match = path.basename(filePath).match(/(20\d{2})/);
  if (!match) return null;
  return Number(match[1]);
}

function normalizeClassCode(code: string): string {
  const trimmed = safeString(code);

  const cleanedPrefix = trimmed
    .replace(/^\uFEFF/, '')
    .replace(/^[^A-Za-z0-9]+/, '');

  return cleanedPrefix.replace(/^[Bb]/, '');
}

function normalizeEmail(email: string): string {
  return safeString(email).toLowerCase();
}

function getEncodingIssueScore(rows: CsvRow[]): number {
  const sample = rows.slice(0, 120);
  let score = 0;

  for (const row of sample) {
    for (const value of Object.values(row)) {
      if (!value) continue;
      if (value.includes('�')) score += 5;
      if (value.includes('Ã')) score += 2;
      if (value.includes('Â')) score += 2;
      if (value.includes('â')) score += 2;
    }
  }

  return score;
}

async function readCsvWithEncoding(
  filePath: string,
  encoding: BufferEncoding,
): Promise<CsvRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.csv.readFile(filePath, {
    parserOptions: { delimiter: ';', encoding },
  });

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) return [];

  const rows: CsvRow[] = [];
  let headers: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    const values = Array.isArray(row.values)
      ? row.values.slice(1).map((v) => safeString(v))
      : [];

    if (rowNumber === 1) {
      headers = values.map((header) => normalizeHeader(header));
      return;
    }

    const rowData: CsvRow = {};
    headers.forEach((header, index) => {
      if (!header) return;
      rowData[header] = values[index] ?? '';
    });
    rows.push(rowData);
  });

  return rows;
}

function rowsFromWorksheet(worksheet: ExcelJS.Worksheet | undefined): CsvRow[] {
  if (!worksheet) return [];

  const rows: CsvRow[] = [];
  let headers: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    const values = Array.isArray(row.values)
      ? row.values.slice(1).map((v) => safeString(v))
      : [];

    if (rowNumber === 1) {
      headers = values.map((header) => normalizeHeader(header));
      return;
    }

    const rowData: CsvRow = {};
    headers.forEach((header, index) => {
      if (!header) return;
      rowData[header] = values[index] ?? '';
    });
    rows.push(rowData);
  });

  return rows;
}

async function readCsv(filePath: string): Promise<CsvRow[]> {
  const encodingsToTry: BufferEncoding[] = ['utf8', 'latin1'];

  let bestRows: CsvRow[] = [];
  let bestEncoding: BufferEncoding = 'utf8';
  let bestScore = Number.POSITIVE_INFINITY;

  for (const encoding of encodingsToTry) {
    const rows = await readCsvWithEncoding(filePath, encoding);
    const score = getEncodingIssueScore(rows);

    if (score < bestScore) {
      bestScore = score;
      bestRows = rows;
      bestEncoding = encoding;
    }

    if (score === 0) break;
  }

  console.log(
    `Codificação detectada para ${path.basename(filePath)}: ${bestEncoding}`,
  );
  return bestRows;
}

async function readXlsx(filePath: string): Promise<CsvRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet(1);
  return rowsFromWorksheet(worksheet);
}

function getFirstAvailableValue(row: CsvRow, keys: string[]): string {
  for (const key of keys) {
    const value = safeString(row[normalizeHeader(key)]);
    if (value) return value;
  }
  return '';
}

async function run(): Promise<void> {
  const env = loadEnv();
  const client = new Client({
    host: env.HOST_PROD,
    port: parseInt(env.DB_PORT_PROD),
    database: env.DATABASE_PROD,
    user: env.USERNAME_PROD,
    password: env.PASSWORD_PROD,
  });

  const courseUuidCache = new Map<string, string>();
  const turmaUuidCache = new Map<string, string>();
  const userUuidCache = new Map<string, string>();
  const alunoByUsuarioCache = new Set<string>();

  let createdUsuarios = 0;
  let reusedUsuarios = 0;
  let createdCursos = 0;
  let reusedCursos = 0;
  let createdTurmas = 0;
  let reusedTurmas = 0;
  let createdAlunos = 0;
  let updatedAlunos = 0;
  let skippedRows = 0;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      throw new Error(`Diretório de dados não encontrado: ${DATA_DIR}`);
    }

    const dataFiles = fs
      .readdirSync(DATA_DIR)
      .filter((file) => {
        const lower = file.toLowerCase();
        return lower.endsWith('.csv') || lower.endsWith('.xlsx');
      })
      .map((file) => path.join(DATA_DIR, file))
      .sort((a, b) => a.localeCompare(b));

    if (!dataFiles.length) {
      console.log(`Nenhum arquivo .csv/.xlsx encontrado em: ${DATA_DIR}`);
      return;
    }

    await client.connect();
    console.log('Conectado ao banco de dados.');

    for (const dataFilePath of dataFiles) {
      const year = extractYearFromFilename(dataFilePath);
      if (!year) {
        console.warn(
          `Arquivo ignorado (ano não encontrado no nome): ${path.basename(dataFilePath)}`,
        );
        continue;
      }

      console.log(
        `\nProcessando ${path.basename(dataFilePath)} (ano ${year})...`,
      );
      const extension = path.extname(dataFilePath).toLowerCase();
      const rows =
        extension === '.xlsx'
          ? await readXlsx(dataFilePath)
          : await readCsv(dataFilePath);
      console.log(`Linhas lidas: ${rows.length}`);

      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const emailRaw = getFirstAvailableValue(row, ['EMAILGOOGLE', 'EMAIL']);
        const nome = getFirstAvailableValue(row, ['NOME', 'ALUNO']);
        const cursoNome = getFirstAvailableValue(row, ['CURSO']);
        const codTurmaRaw = getFirstAvailableValue(row, ['CODTURMA', 'TURMA']);

        const email = normalizeEmail(emailRaw);
        const codigoTurma = normalizeClassCode(codTurmaRaw);

        if (!email || !nome || !cursoNome || !codigoTurma) {
          const missingFields: string[] = [];
          if (!email) missingFields.push('email');
          if (!nome) missingFields.push('nome');
          if (!cursoNome) missingFields.push('curso');
          if (!codigoTurma) missingFields.push('codigo_turma');

          const fileName = path.basename(dataFilePath);
          const lineNumber = index + 2; // +1 pelo índice e +1 pelo cabeçalho
          console.warn(
            `[SKIP] arquivo=${fileName} linha=${lineNumber} email=${email || 'N/A'} nome="${nome || 'N/A'}" motivo=campos_obrigatorios_ausentes (${missingFields.join(', ')})`,
          );
          skippedRows += 1;
          continue;
        }

        // usuarios: verifica por e-mail (chave única), reaproveita UUID quando já existe
        let usuarioUuid = userUuidCache.get(email);
        if (!usuarioUuid) {
          const existingUser = await client.query<{ uuid: string }>(
            `SELECT uuid FROM usuarios WHERE email = $1 LIMIT 1`,
            [email],
          );

          if (existingUser.rowCount) {
            usuarioUuid = existingUser.rows[0].uuid;
            reusedUsuarios += 1;
          } else {
            usuarioUuid = uuidv4();
            const googleId = `imported_${email}`;
            await client.query(
              `INSERT INTO usuarios (uuid, email, nome, google_id, tipo)
                             VALUES ($1, $2, $3, $4, 'ALUNO')`,
              [usuarioUuid, email, nome, googleId],
            );
            createdUsuarios += 1;
          }
          userUuidCache.set(email, usuarioUuid);
        }

        // cursos: verifica por nome
        let cursoUuid = courseUuidCache.get(cursoNome);
        if (!cursoUuid) {
          const existingCourse = await client.query<{ uuid: string }>(
            `SELECT uuid FROM cursos WHERE nome = $1 LIMIT 1`,
            [cursoNome],
          );

          if (existingCourse.rowCount) {
            cursoUuid = existingCourse.rows[0].uuid;
            reusedCursos += 1;
          } else {
            cursoUuid = uuidv4();
            await client.query(
              `INSERT INTO cursos (uuid, nome)
                    VALUES ($1, $2)`,
              [cursoUuid, cursoNome],
            );
            createdCursos += 1;
          }
          courseUuidCache.set(cursoNome, cursoUuid);
        }

        // turmas: verifica por curso + código sem primeira letra + ano
        const turmaCacheKey = `${cursoUuid}|${codigoTurma}`;
        let turmaUuid = turmaUuidCache.get(turmaCacheKey);
        if (!turmaUuid) {
          const existingTurma = await client.query<{ uuid: string }>(
            `SELECT uuid FROM turmas WHERE curso_uuid = $1 AND codigo = $2 LIMIT 1`,
            [cursoUuid, codigoTurma],
          );

          if (existingTurma.rowCount) {
            turmaUuid = existingTurma.rows[0].uuid;
            reusedTurmas += 1;
          } else {
            turmaUuid = uuidv4();
            await client.query(
              `INSERT INTO turmas (uuid, curso_uuid, codigo, ano)
                             VALUES ($1, $2, $3, $4)`,
              [turmaUuid, cursoUuid, codigoTurma, year],
            );
            createdTurmas += 1;
          }
          turmaUuidCache.set(turmaCacheKey, turmaUuid);
        }

        // alunos: se já existir, atualiza curso/turma; se não, insere
        if (alunoByUsuarioCache.has(usuarioUuid)) {
          await client.query(
            `UPDATE alunos
               SET curso_uuid = $2,
                   turma_uuid = $3
             WHERE usuario_uuid = $1`,
            [usuarioUuid, cursoUuid, turmaUuid],
          );
          updatedAlunos += 1;
          continue;
        }

        const existingAluno = await client.query(
          `SELECT 1 FROM alunos WHERE usuario_uuid = $1 LIMIT 1`,
          [usuarioUuid],
        );

        if (existingAluno.rowCount) {
          await client.query(
            `UPDATE alunos
               SET curso_uuid = $2,
                   turma_uuid = $3
             WHERE usuario_uuid = $1`,
            [usuarioUuid, cursoUuid, turmaUuid],
          );
          updatedAlunos += 1;
        } else {
          await client.query(
            `INSERT INTO alunos (usuario_uuid, curso_uuid, turma_uuid)
                         VALUES ($1, $2, $3)`,
            [usuarioUuid, cursoUuid, turmaUuid],
          );
          createdAlunos += 1;
        }

        alunoByUsuarioCache.add(usuarioUuid);

        console.log(`Linha ${index + 1} processada com sucesso.`);
      }
    }

    console.log('\nImportação finalizada.');
    console.log(`Usuarios criados: ${createdUsuarios}`);
    console.log(`Usuarios reaproveitados: ${reusedUsuarios}`);
    console.log(`Cursos criados: ${createdCursos}`);
    console.log(`Cursos reaproveitados: ${reusedCursos}`);
    console.log(`Turmas criadas: ${createdTurmas}`);
    console.log(`Turmas reaproveitadas: ${reusedTurmas}`);
    console.log(`Alunos criados: ${createdAlunos}`);
    console.log(`Alunos atualizados: ${updatedAlunos}`);
    console.log(
      `Linhas ignoradas (faltando campos obrigatórios): ${skippedRows}`,
    );
  } catch (error) {
    console.error('Erro durante importação:', error);
  } finally {
    await client.end();
  }
}

run();
