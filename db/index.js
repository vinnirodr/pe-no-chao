const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // 🔥 IGNORA todas variáveis PG* do Railway
    host: undefined,
    port: undefined,
    user: undefined,
    password: undefined,
    database: undefined
});

module.exports = { pool };
