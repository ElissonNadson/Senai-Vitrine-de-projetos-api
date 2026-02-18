const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const c = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(l => {
    const p = l.split('=');
    if (p.length >= 2) c[p[0].trim()] = p.slice(1).join('=').trim();
  });
}

const cl = new Client({
  host: c.HOST || 'localhost',
  port: Number(c.DB_PORT || 5432),
  database: c.DATABASE,
  user: c.DB_USER || c.USERNAME || 'postgres',
  password: c.DB_PASSWORD || c.PASSWORD || 'postgres',
});

async function run() {
  await cl.connect();
  const res = await cl.query(
    "UPDATE usuarios SET tipo = 'ADMIN' WHERE email = 'nadsonnodachi@gmail.com' RETURNING uuid, nome, email, tipo"
  );
  console.log('Rows updated:', res.rowCount);
  console.log('Result:', JSON.stringify(res.rows, null, 2));
  await cl.end();
}

run().catch(e => { console.error(e.message); cl.end(); });
