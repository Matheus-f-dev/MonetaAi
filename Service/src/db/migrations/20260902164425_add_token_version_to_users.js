// Achado #11 do relatório de auditoria: JWT sem revogação -- um token
// continuava válido até expirar sozinho mesmo depois de troca de senha ou
// exclusão de conta. `token_version` embutido no JWT no momento da emissão;
// incrementar essa coluna invalida instantaneamente qualquer token emitido
// antes disso, sem precisar de blacklist.
exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.integer('token_version').notNullable().defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('token_version');
  });
};
