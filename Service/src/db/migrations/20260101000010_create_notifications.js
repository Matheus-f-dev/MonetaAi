exports.up = function (knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('alert_id').unsigned().nullable().references('id').inTable('alerts').onDelete('SET NULL');
    table.string('nome_alerta', 120).defaultTo('Alerta sem nome');
    table.string('categoria', 60).notNullable();
    table.decimal('limite', 14, 2).notNullable();
    table.decimal('total_gasto', 14, 2).notNullable();
    table.string('condicao', 30).notNullable();
    table.timestamp('disparado_em').defaultTo(knex.fn.now());
    table.boolean('lido').defaultTo(false);

    table.index(['user_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('notifications');
};
