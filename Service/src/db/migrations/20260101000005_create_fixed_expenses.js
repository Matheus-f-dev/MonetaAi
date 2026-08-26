exports.up = function (knex) {
  return knex.schema.createTable('fixed_expenses', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('nome', 150).notNullable();
    table.decimal('valor', 14, 2).notNullable();
    table.string('categoria', 60).defaultTo('Outros');
    table.integer('dia_vencimento').notNullable();
    table.string('icone', 10).defaultTo('📌');
    table.boolean('ativo').defaultTo(true);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').nullable();
    table.timestamp('removido_em').nullable();

    table.index(['user_id', 'ativo']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('fixed_expenses');
};
