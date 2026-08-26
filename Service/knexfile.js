// Configuração do Knex — mesmo motor (MySQL) em dev local e produção,
// só troca host/usuário/senha via variáveis de ambiente. Evita o clássico
// bug de "funcionava no SQLite, quebrou no MySQL de produção".
require('dotenv').config();

const base = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'moneta',
    timezone: 'Z',
    // Sem isso o mysql2 não força utf8mb4 na sessão da conexão — acentos
    // (ç, ã, é...) chegam certos do Node mas são decodificados errado pelo
    // MySQL e viram U+FFFD (replacement character) já na gravação.
    charset: 'utf8mb4'
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
