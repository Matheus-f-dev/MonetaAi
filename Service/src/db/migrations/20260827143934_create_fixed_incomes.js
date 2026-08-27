// Espelha fixed_expenses (20260101000005) -- tabela separada em vez de
// generalizar fixed_expenses com uma coluna `tipo`. Ver justificativa no
// resumo da Fase 1: menos risco de quebrar o que já usa fixed_expenses hoje
// (FixedExpenseController, AlertObserver, resumo de contas), zero ALTER TABLE
// em produção, e o contrato de API de fixed-expenses não muda uma vírgula.
exports.up = function (knex) {
  return knex.schema.createTable('fixed_incomes', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('nome', 150).notNullable();
    table.decimal('valor', 14, 2).notNullable();
    table.string('categoria', 60).defaultTo('Renda');
    table.integer('dia_recebimento').notNullable();
    table.string('icone', 10).defaultTo('💰');
    table.boolean('ativo').defaultTo(true);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').nullable();
    table.timestamp('removido_em').nullable();

    table.index(['user_id', 'ativo']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('fixed_incomes');
};
