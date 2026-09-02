// Achado #3 da sessão de segurança de storage: `salario` é um dado pessoal
// sensível (LGPD) gravado em texto puro. Passa a ser armazenado cifrado
// (AES-256-GCM, ver CryptoService) -- exige SALARY_ENCRYPTION_KEY já
// configurada no ambiente ANTES de rodar esta migration (mesmo padrão de
// JWT_SECRET: falha alto, sem fallback, se faltar).
//
// Reaproveita a coluna `salario` (mesmo nome, tipo muda de numeric pra
// text) em vez de manter duas colunas -- User.js já centraliza toda leitura
// /escrita desse campo, então não tem consumidor direto de SQL pra quebrar.
const CryptoService = require('../../services/CryptoService');

exports.up = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.text('salario_encrypted');
  });

  const users = await knex('users').select('id', 'salario');
  for (const u of users) {
    const encrypted = CryptoService.encrypt(String(u.salario ?? 0));
    await knex('users').where({ id: u.id }).update({ salario_encrypted: encrypted });
  }

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('salario');
  });
  await knex.schema.alterTable('users', (table) => {
    table.renameColumn('salario_encrypted', 'salario');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.decimal('salario_plain', 12, 2);
  });

  const users = await knex('users').select('id', 'salario');
  for (const u of users) {
    const decrypted = u.salario ? Number(CryptoService.decrypt(u.salario)) : 0;
    await knex('users').where({ id: u.id }).update({ salario_plain: decrypted });
  }

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('salario');
  });
  await knex.schema.alterTable('users', (table) => {
    table.renameColumn('salario_plain', 'salario');
  });
};
