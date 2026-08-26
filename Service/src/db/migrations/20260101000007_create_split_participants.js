exports.up = function (knex) {
  return knex.schema.createTable('split_participants', (table) => {
    table.increments('id').primary();
    table.integer('transaction_id').unsigned().notNullable().references('id').inTable('transactions').onDelete('CASCADE');
    table.string('nome', 120).notNullable();
    table.decimal('valor', 14, 2).notNullable();
    table.boolean('pago').defaultTo(false);
    table.timestamp('pago_em').nullable();

    table.index(['transaction_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('split_participants');
};
