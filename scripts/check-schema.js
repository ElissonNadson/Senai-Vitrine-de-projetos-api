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
  
  const tables = ['projetos_alunos', 'projetos_docentes', 'departamentos'];
  for (const t of tables) {
    const r = await cl.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position",
      [t]
    );
    console.log(`${t}: ${r.rows.map(r => r.column_name).join(', ')}`);
  }
  
  await cl.end();
}

run().catch(e => { console.error(e.message); cl.end(); });
