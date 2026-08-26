exports.up = function (knex) {
  return knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enu('tipo', ['receita', 'despesa']).notNullable();
    table.decimal('valor', 14, 2).notNullable();
    table.string('descricao', 255).defaultTo('Sem descrição');
    table.string('categoria', 60).defaultTo('Outros');
    table.string('data_hora', 40).notNullable(); // mantém o formato dd/mm/yyyy, HH:MM:SS já usado em todo o app (bot incluso)
    table.timestamp('criado_em').defaultTo(knex.fn.now());

    // cartão / parcelamento (opcionais)
    table.integer('card_id').unsigned().nullable().references('id').inTable('cards').onDelete('SET NULL');
    table.string('compra_id', 40).nullable(); // agrupa as parcelas de uma mesma compra
    table.integer('parcela_atual').nullable();
    table.integer('parcela_total').nullable();

    // gasto fixo / recorrência (opcionais)
    table.integer('recurrence_id').unsigned().nullable().references('id').inTable('fixed_expenses').onDelete('SET NULL');
    table.string('competencia', 7).nullable(); // "YYYY-MM"

    // conta / transferência (opcionais)
    table.integer('account_id').unsigned().nullable().references('id').inTable('accounts').onDelete('SET NULL');
    table.boolean('is_transferencia').defaultTo(false);
    table.string('transfer_id', 60).nullable();

    table.index(['user_id', 'data_hora']);
    table.index(['card_id']);
    table.index(['recurrence_id', 'competencia']);
    table.index(['account_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('transactions');
};
