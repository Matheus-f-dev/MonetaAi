const { db } = require('../config/database');

// Extraído do que já existia (duplicado) em AlertObserver.js -- "quanto já
// foi gasto numa categoria neste mês" é usado tanto pra disparar alerta
// quanto pra comparar com o limite de um orçamento (BudgetController), e
// não fazia sentido ter a mesma agregação escrita duas vezes.
async function totalGastoNoMes(userId, categoria, referencia = new Date()) {
  const mes = referencia.getMonth() + 1;
  const ano = referencia.getFullYear();

  const transacoes = await db('transactions')
    .where({ user_id: userId, categoria, tipo: 'despesa' })
    .whereRaw(
      "EXTRACT(MONTH FROM TO_DATE(SPLIT_PART(data_hora, ',', 1), 'DD/MM/YYYY')) = ? AND EXTRACT(YEAR FROM TO_DATE(SPLIT_PART(data_hora, ',', 1), 'DD/MM/YYYY')) = ?",
      [mes, ano]
    );

  return transacoes.reduce((sum, t) => sum + Math.abs(parseFloat(t.valor) || 0), 0);
}

module.exports = { totalGastoNoMes };
