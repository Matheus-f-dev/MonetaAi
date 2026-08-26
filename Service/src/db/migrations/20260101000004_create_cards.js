exports.up = function (knex) {
  return knex.schema.createTable('cards', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('nome', 120).notNullable();
    table.string('instituicao', 120).defaultTo('');
    table.string('final', 4).defaultTo('');
    table.decimal('limite', 14, 2).defaultTo(0);
    table.integer('dia_fechamento').defaultTo(1);
    table.integer('dia_vencimento').defaultTo(10);
    table.string('cor', 30).defaultTo('roxo');
    table.boolean('ativo').defaultTo(true);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').nullable();
    table.timestamp('removido_em').nullable();

    table.index(['user_id', 'ativo']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('cards');
};
