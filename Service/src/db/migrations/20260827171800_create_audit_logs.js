exports.up = function (knex) {
  return knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('tabela', 60).notNullable();
    table.integer('registro_id').unsigned().notNullable();
    table.string('acao', 20).notNullable(); // insert | update | delete
    table.jsonb('dados_antigos').nullable();
    table.jsonb('dados_novos').nullable();
    table.timestamp('criado_em').defaultTo(knex.fn.now());

    table.index(['tabela', 'registro_id']);
    table.index(['user_id', 'criado_em']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('audit_logs');
};
