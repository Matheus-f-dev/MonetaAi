exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.string('totp_secret', 100).nullable(); // nunca sai em toJSON(), mesmo tratamento de senha_hash
    table.boolean('totp_ativo').defaultTo(false).notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('totp_secret');
    table.dropColumn('totp_ativo');
  });
};
