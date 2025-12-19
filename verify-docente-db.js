
const { Client } = require('pg');

const client = new Client({
    host: 'vitrinesenaifeira.cloud',
    port: 31982,
    database: 'vitrine_senai',
    user: 'api_user',
    password: 'J3sus1sK1ng',
    ssl: false
});

async function verify() {
    try {
        console.log('Connecting to vitrine_senai...');
        await client.connect();

        // 1. Tables check
        console.log('1. Checking tables...');
        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('docentes', 'projetos_docentes');
    `);
        const tableNames = tables.rows.map(r => r.table_name);
        console.log('Found tables:', tableNames);

        if (!tableNames.includes('docentes')) throw new Error('Table docentes missing!');

        // 2. Insert Test User
        console.log('2. Inserting test User...');
        const timestamp = Date.now();
        const email = `verify.docente.${timestamp}@example.com`;
        const googleId = `mock_gid_${timestamp}`;

        const insertQuery = `
      INSERT INTO usuarios (nome, email, tipo, criado_em, atualizado_em, ativo, primeiro_acesso, google_id)
      VALUES ($1, $2, 'DOCENTE', NOW(), NOW(), true, true, $3)
      RETURNING uuid
    `;

        const userRes = await client.query(insertQuery, [`Test Verification ${timestamp}`, email, googleId]);
        const userId = userRes.rows[0].uuid;
        console.log('User created:', userId);

        // 3. Inspect Docentes Schema
        console.log('3. Inspecting docentes schema...');
        const docColsRes = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'docentes'
    `);
        const docCols = docColsRes.rows.map(r => r.column_name);
        console.log('Docentes columns:', docCols);

        // 4. Insert/Verify Docente
        let docenteRes = await client.query('SELECT * FROM docentes WHERE usuario_uuid = $1', [userId]);

        if (docenteRes.rows.length === 0) {
            console.log('Inserting into docentes manually...');

            const docFields = ['usuario_uuid'];
            const docVals = [`'${userId}'`];

            // Add typical fields if they exist
            if (docCols.includes('departamento')) {
                docFields.push('departamento');
                docVals.push(`'Tecnologia'`);
            }
            if (docCols.includes('especialidade')) {
                docFields.push('especialidade');
                docVals.push(`'QA'`);
            }
            if (docCols.includes('matricula')) {
                docFields.push('matricula');
                docVals.push(`'${timestamp}'`);
            }
            // Avoid 'nif' unless present

            const docInsert = `
            INSERT INTO docentes (${docFields.join(', ')})
            VALUES (${docVals.join(', ')})
        `;

            await client.query(docInsert);
            console.log('Docente record inserted.');
        } else {
            console.log('Docente record exists (Trigger?):', docenteRes.rows[0]);
        }

        // 5. Verify Join
        const verifyRes = await client.query(`
        SELECT d.*, u.nome, u.tipo 
        FROM docentes d 
        JOIN usuarios u ON d.usuario_uuid = u.uuid 
        WHERE u.uuid = $1
    `, [userId]);

        if (verifyRes.rows.length === 0) throw new Error('Verification JOIN failed');
        if (verifyRes.rows[0].tipo !== 'DOCENTE') throw new Error(`User Type is ${verifyRes.rows[0].tipo}, expected DOCENTE`);

        console.log('Data Verified Successfully:', verifyRes.rows[0].nome, verifyRes.rows[0].tipo);

        // 6. Cleanup
        console.log('6. Cleanup...');
        await client.query('DELETE FROM docentes WHERE usuario_uuid = $1', [userId]);
        await client.query('DELETE FROM usuarios WHERE uuid = $1', [userId]);
        console.log('Cleanup done.');

        console.log('✅ VERIFICATION SUCCESSFUL: Full Docente Flow Checked.');

    } catch (err) {
        console.error('❌ VERIFICATION FAILED:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

verify();
