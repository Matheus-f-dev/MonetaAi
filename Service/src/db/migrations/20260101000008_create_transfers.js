exports.up = function (knex) {
  return knex.schema.createTable('transfers', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('idempotency_key', 100).notNullable().unique(); // reenvio da mesma key nunca duplica
    table.integer('from_account_id').unsigned().notNullable().references('id').inTable('accounts');
    table.integer('to_account_id').unsigned().notNullable().references('id').inTable('accounts');
    table.decimal('valor', 14, 2).notNullable();
    table.string('descricao', 255).defaultTo('');
    table.integer('from_transaction_id').unsigned().nullable().references('id').inTable('transactions');
    table.integer('to_transaction_id').unsigned().nullable().references('id').inTable('transactions');
    table.timestamp('criado_em').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('transfers');
};
