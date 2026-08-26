exports.up = function (knex) {
  return knex.schema.createTable('accounts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('nome', 120).notNullable();
    table.string('tipo', 30).notNullable().defaultTo('corrente');
    table.decimal('saldo_inicial', 14, 2).defaultTo(0);
    table.string('instituicao', 120).defaultTo('');
    table.string('cor', 30).defaultTo('roxo');
    table.boolean('liquidez').defaultTo(true);
    table.boolean('principal').defaultTo(false);
    table.boolean('ativo').defaultTo(true);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').nullable();
    table.timestamp('removido_em').nullable();

    table.index(['user_id', 'ativo']);
  }).then(() => knex.raw(`
    ALTER TABLE accounts
    ADD COLUMN principal_marker INT GENERATED ALWAYS AS (IF(principal, user_id, NULL)) VIRTUAL,
    ADD UNIQUE KEY uniq_principal_por_usuario (principal_marker)
  `));
  // Segunda camada de proteção contra duas "Conta Principal" pro mesmo
  // usuário (além do lock de aplicação em AccountController): coluna
  // gerada que só existe quando principal=true, com índice único — MySQL
  // ignora NULLs num índice único, então só reclama se alguém tentar
  // inserir um SEGUNDO principal=true pro mesmo usuário, não importa a
  // corrida entre requisições.
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('accounts');
};
