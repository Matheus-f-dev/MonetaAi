exports.up = function (knex) {
  return knex.schema.createTable('investments', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('nome', 150).notNullable();
    // Categoria livre (texto, não enum/FK) -- a lista sugerida no
    // frontend (Carro, Casa/Apartamento, Aposentadoria...) é só pra
    // ajudar a escolher, não trava o usuário numa lista fixa que exigiria
    // migration toda vez que alguém quisesse uma categoria nova.
    table.string('categoria', 60).notNullable().defaultTo('Outro');
    // 'unico' (um aporte só, sem contribuição recorrente) ou 'mensal'
    // (aporte todo mês, com ou sem valor inicial).
    table.string('tipo_aporte', 20).notNullable().defaultTo('mensal');
    table.decimal('valor_inicial', 14, 2).notNullable().defaultTo(0);
    table.decimal('aporte_mensal', 14, 2).notNullable().defaultTo(0);
    // Taxa de retorno ANUAL esperada, em % (ex.: 8.5 = 8,5% ao ano) --
    // a projeção (calculada no frontend, puro cálculo de juros compostos,
    // sem precisar de dado nenhum do backend) converte pra taxa mensal
    // equivalente na hora de desenhar o gráfico.
    table.decimal('taxa_retorno_anual', 6, 3).notNullable().defaultTo(0);
    table.date('data_inicio').notNullable().defaultTo(knex.fn.now());
    // Mesmo padrão de soft delete que accounts/cards/goals/etc já usam.
    table.boolean('ativo').defaultTo(true);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').nullable();

    table.index(['user_id', 'ativo']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('investments');
};
