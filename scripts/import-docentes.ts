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

  const worksheet = workbook.getWorksheet(1) || workbook.worksheets[0];
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

  const dataFilePath = path.join(DATA_DIR, 'Docente_E-mail_Google.xlsx');

  const userUuidCache = new Map<string, string>();

  let createdUsuarios = 0;
  let reusedUsuarios = 0;
  const createdDocentes = 0;
  const reusedDocentes = 0;
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

    console.log(`\nProcessando ${path.basename(dataFilePath)}...`);
    const extension = path.extname(dataFilePath).toLowerCase();

    const rows =
      extension === '.xlsx'
        ? await readXlsx(dataFilePath)
        : await readCsv(dataFilePath);
    console.log(`Linhas lidas: ${rows.length}`);

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const emailRaw = getFirstAvailableValue(row, ['EMAILGOOGLE', 'EMAIL']);
      const nome = getFirstAvailableValue(row, ['NOME', 'DOCENTE']);

      const email = normalizeEmail(emailRaw);

      if (!email || !nome) {
        const missingFields: string[] = [];
        if (!email) missingFields.push('email');
        if (!nome) missingFields.push('nome');

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
                             VALUES ($1, $2, $3, $4, 'DOCENTE')`,
            [usuarioUuid, email, nome, googleId],
          );
          createdUsuarios += 1;
        }
        userUuidCache.set(email, usuarioUuid);
      }

      console.log(`Linha ${index + 1} processada com sucesso.`);
    }

    console.log('\nImportação finalizada.');
    console.log(`Usuarios criados: ${createdUsuarios}`);
    console.log(`Usuarios reaproveitados: ${reusedUsuarios}`);
    console.log(`Docentes criados: ${createdDocentes}`);
    console.log(`Docentes reaproveitados: ${reusedDocentes}`);
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
