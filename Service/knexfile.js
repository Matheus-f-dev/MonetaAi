// Configuração do Knex — mesmo motor (PostgreSQL) em dev local e produção,
// só troca host/usuário/senha via variáveis de ambiente. Evita o clássico
// bug de "funcionava no SQLite, quebrou no Postgres de produção".
require('dotenv').config();

const base = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'moneta_app',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'moneta',
    // Postgres já fala UTF-8 nativamente na conexão (client_encoding padrão
    // é UTF8) — nenhum charset extra precisa ser forçado como precisava no
    // mysql2.
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  },
  migrations: {
    directory: './src/db/migrations',
    tableName: 'knex_migrations'
  },
  pool: { min: 2, max: 10 }
};

module.exports = {
  development: base,
  production: base
};
