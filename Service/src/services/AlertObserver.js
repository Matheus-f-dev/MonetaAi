const { db } = require('../config/database');

class AlertObserver {
  async update(transaction) {
    if (transaction.tipo !== 'despesa') return;

    try {
      const userId = transaction.userId;
      const categoria = transaction.categoria;

      // Buscar alertas ativos para esta categoria
      const alerts = await db('alerts').where({ user_id: userId, categoria, ativo: true });
      if (alerts.length === 0) return;

      // Calcular total de gastos da categoria no mês atual. Antes isso
      // consultava uma coleção `transacoes` que nunca era escrita em lugar
      // nenhum (todo o resto do app usa `historico`/`transactions`) — esse
      // cálculo estava silenciosamente sempre zerado. Corrigido pra
      // consultar a tabela certa.
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const transacoesDoMes = await db('transactions')
        .where({ user_id: userId, categoria, tipo: 'despesa' })
        .whereRaw(
          "EXTRACT(MONTH FROM TO_DATE(SPLIT_PART(data_hora, ',', 1), 'DD/MM/YYYY')) = ? AND EXTRACT(YEAR FROM TO_DATE(SPLIT_PART(data_hora, ',', 1), 'DD/MM/YYYY')) = ?",
          [currentMonth, currentYear]
        );

      const totalGastos = transacoesDoMes.reduce((sum, t) => sum + Math.abs(parseFloat(t.valor) || 0), 0);

      alerts.forEach((alert) => {
        const limite = parseFloat(alert.valor);
        let alertTriggered = false;

        switch (alert.condicao) {
          case 'Maior que':
            alertTriggered = totalGastos > limite;
            break;
          case 'Menor que':
            alertTriggered = totalGastos < limite;
            break;
          case 'Igual a':
            alertTriggered = totalGastos === limite;
            break;
        }

        if (alertTriggered) {
          this.triggerAlert(userId, alert, totalGastos);
        }
      });

    } catch (error) {
      console.error('Erro no AlertObserver:', error);
    }
  }

  async triggerAlert(userId, alert, totalGastos) {
    await db('notifications').insert({
      user_id: userId,
      alert_id: alert.id,
      nome_alerta: alert.nome,
      categoria: alert.categoria,
      limite: alert.valor,
      total_gasto: totalGastos,
      condicao: alert.condicao,
      lido: false
    });

    console.log(`🚨 ALERTA DISPARADO: ${alert.nome} - ${alert.categoria} ${alert.condicao} R$ ${alert.valor}. Total atual: R$ ${totalGastos}`);
  }
}

module.exports = AlertObserver;
