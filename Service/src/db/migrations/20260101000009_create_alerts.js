exports.up = function (knex) {
  return knex.schema.createTable('alerts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('nome', 120).notNullable();
    table.string('condicao', 30).notNullable(); // "Maior que" | "Menor que" | "Igual a"
    table.decimal('valor', 14, 2).notNullable();
    table.string('categoria', 60).notNullable();
    table.boolean('ativo').defaultTo(true);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').nullable();

    table.index(['user_id', 'categoria', 'ativo']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('alerts');
};
