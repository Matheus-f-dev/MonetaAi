exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('nome', 150).notNullable();
    table.string('email', 190).notNullable().unique();
    table.string('senha_hash', 100).nullable(); // null = conta só-Google
    table.string('google_id', 190).nullable().unique();
    table.decimal('salario', 12, 2).defaultTo(0);
    table.boolean('perfil_completo').defaultTo(false);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('users');
};
