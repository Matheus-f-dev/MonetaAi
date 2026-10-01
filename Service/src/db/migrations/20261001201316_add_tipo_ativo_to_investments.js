exports.up = function (knex) {
  return knex.schema.alterTable('investments', (table) => {
    // 'renda_fixa'/'imovel'/'outro' continuam usando o modelo manual que já
    // existia (valor_inicial/aporte_mensal/taxa_retorno_anual + projeção de
    // juros compostos). 'acao'/'fii'/'cripto' são ATIVOS DE MERCADO -- o
    // valor não é mais digitado à mão, vem de quantidade * cotação ao vivo
    // (brapi.dev pra ação/fii, CoinGecko pra cripto -- ver MarketDataService).
    table.string('tipo_ativo', 20).notNullable().defaultTo('renda_fixa');
    // Código da ação na B3 (ex.: "PETR4") ou o id da moeda no CoinGecko
    // (ex.: "bitcoin") -- null pros tipos que não têm cotação de mercado.
    table.string('ticker', 30).nullable();
    // Quantas unidades/cotas/moedas a pessoa tem -- decimal com bastante
    // casa (18,8) porque cripto se divide em frações bem pequenas
    // (0.00000001 BTC, por exemplo), diferente de dinheiro normal.
    table.decimal('quantidade', 18, 8).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('investments', (table) => {
    table.dropColumn('tipo_ativo');
    table.dropColumn('ticker');
    table.dropColumn('quantidade');
  });
};
