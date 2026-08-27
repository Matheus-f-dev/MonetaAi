exports.up = function (knex) {
  return knex.schema.createTable('password_resets', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    // Guarda o hash SHA-256 do token, nunca o token cru — se o banco
    // vazar, ninguém consegue reutilizar um link de redefinição a partir
    // do dump. O token em texto puro só existe no e-mail enviado ao usuário.
    table.string('token_hash', 64).notNullable().unique();
    table.timestamp('expira_em').notNullable();
    table.timestamp('usado_em').nullable();
    table.timestamp('criado_em').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('password_resets');
};
