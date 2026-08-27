const { db } = require('../config/database');

// Registrado na camada de aplicação (dentro dos controllers que já fazem
// update/delete de transactions e accounts) -- de propósito, não trigger de
// banco, pra ficar consistente com o resto do stack (tudo em Knex/JS).
// Escopo inicial: só transactions e accounts, onde o dinheiro de fato muda
// de mãos -- tabela de configuração (alerts/budgets/etc.) fica de fora
// por enquanto.
//
// Passa `trx` quando a mutação já roda dentro de uma db.transaction() (ex.:
// AccountController.delete) -- o log entra na mesma transação, então ou os
// dois são gravados juntos ou nenhum é.
async function registrar(trx, { userId, tabela, registroId, acao, dadosAntigos, dadosNovos }) {
  const conexao = trx || db;
  await conexao('audit_logs').insert({
    user_id: userId,
    tabela,
    registro_id: registroId,
    acao,
    dados_antigos: dadosAntigos ? JSON.stringify(dadosAntigos) : null,
    dados_novos: dadosNovos ? JSON.stringify(dadosNovos) : null
  });
}

module.exports = { registrar };
