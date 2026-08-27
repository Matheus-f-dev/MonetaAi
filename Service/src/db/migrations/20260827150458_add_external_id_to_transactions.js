// Identificador vindo do arquivo importado (FITID do OFX, ou uma linha do
// CSV) -- só preenchido em transações importadas, nunca em lançamento
// manual. Índice único composto com user_id: a MESMA transação bancária
// não pode ser importada duas vezes para o mesmo usuário, mas nada impede
// dois usuários diferentes terem o mesmo FITID (não é global).
exports.up = function (knex) {
  return knex.schema.alterTable('transactions', (table) => {
    table.string('external_id', 120).nullable();
    table.unique(['user_id', 'external_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('transactions', (table) => {
    table.dropUnique(['user_id', 'external_id']);
    table.dropColumn('external_id');
  });
};
