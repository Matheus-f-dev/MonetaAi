// recurrence_id (já existente) tem FK só pra fixed_expenses -- não dá pra
// reaproveitar pra apontar pra fixed_incomes sem violar essa constraint.
// Coluna irmã, mesmo padrão (nullable, SET NULL ao apagar o gasto fixo
// original, índice composto com competencia pra achar "já foi lançado
// esse mês" rapidinho).
exports.up = function (knex) {
  return knex.schema.alterTable('transactions', (table) => {
    table.integer('income_recurrence_id').unsigned().nullable()
      .references('id').inTable('fixed_incomes').onDelete('SET NULL');
    table.index(['income_recurrence_id', 'competencia']);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('transactions', (table) => {
    table.dropColumn('income_recurrence_id');
  });
};
