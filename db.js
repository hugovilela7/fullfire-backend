const { Pool } = require('pg');

// Usa a variável de ambiente do Render ou conexão local como fallback
const connectionString = process.env.DATABASE_URL || 'postgres://usuario:senha@localhost:5432/fullfire';

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};