exports.up = function (knex) {
  return knex.schema.createTable('goals', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('account_id').unsigned().nullable().references('id').inTable('accounts').onDelete('SET NULL');
    table.string('nome', 150).notNullable();
    table.decimal('valor_alvo', 14, 2).notNullable();
    table.date('prazo').nullable();
    // Não estava na lista original da fase, mas toda outra entidade do
    // projeto (accounts, cards, fixed_expenses/incomes, alerts, budgets)
    // usa soft delete via `ativo` -- manter o mesmo padrão aqui em vez de
    // inventar um jeito novo só pra esta tabela.
    table.boolean('ativo').defaultTo(true);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').nullable();

    table.index(['user_id', 'ativo']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('goals');
};
