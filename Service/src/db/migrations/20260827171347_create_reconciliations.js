// Sem user_id direto de propósito -- a posse é sempre checada via
// accounts.user_id (join), igual o resto do app já faz pra recursos que
// pendem de uma conta (ex.: split_participants -> transactions.user_id).
exports.up = function (knex) {
  return knex.schema.createTable('reconciliations', (table) => {
    table.increments('id').primary();
    table.integer('account_id').unsigned().notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    table.decimal('saldo_informado', 14, 2).notNullable();
    table.decimal('saldo_calculado', 14, 2).notNullable();
    table.decimal('diferenca', 14, 2).notNullable();
    table.timestamp('criado_em').defaultTo(knex.fn.now());

    table.index(['account_id', 'criado_em']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('reconciliations');
};
