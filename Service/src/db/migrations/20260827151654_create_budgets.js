// Mesmo padrão de alerts -- recorrente mês a mês, sem coluna de "mês" (o
// mês corrente é sempre calculado na consulta, igual ao padrão de alertas).
exports.up = function (knex) {
  return knex.schema.createTable('budgets', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('categoria', 60).notNullable();
    table.decimal('limite_mensal', 14, 2).notNullable();
    table.boolean('ativo').defaultTo(true);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').nullable();

    table.index(['user_id', 'categoria', 'ativo']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('budgets');
};
