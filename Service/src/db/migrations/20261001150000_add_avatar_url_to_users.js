exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    // Caminho servido pelo próprio Express (ver app.js -- /api/uploads),
    // nunca a URL absoluta: assim funciona igual em dev (localhost:3000) e
    // produção (monetaai.joaopaseixas.com.br) sem gravar host nenhum no banco.
    table.string('avatar_url', 255).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('avatar_url');
  });
};
