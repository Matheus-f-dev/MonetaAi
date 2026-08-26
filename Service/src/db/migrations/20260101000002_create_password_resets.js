exports.up = function (knex) {
  return knex.schema.createTable('password_resets', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token', 100).notNullable().unique();
    table.timestamp('expira_em').notNullable();
    table.timestamp('usado_em').nullable();
    table.timestamp('criado_em').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('password_resets');
};
