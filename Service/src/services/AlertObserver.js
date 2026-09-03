const { db } = require('../config/database');
const EmailService = require('./EmailService');
const { totalGastoNoMes } = require('./CategorySpendingService');

class AlertObserver {
  async update(transaction) {
    if (transaction.tipo !== 'despesa') return;

    try {
      const userId = transaction.userId;
      const categoria = transaction.categoria;

      // Buscar alertas ativos para esta categoria
      const alerts = await db('alerts').where({ user_id: userId, categoria, ativo: true });
      if (alerts.length === 0) return;

      // Total de gastos da categoria no mês atual -- extraído pra
      // CategorySpendingService (era duplicado aqui e ia ser duplicado de
      // novo em BudgetController; agora as duas pontas usam a mesma query).
      const totalGastos = await totalGastoNoMes(userId, categoria);

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

    // Envio de e-mail é best-effort: o alerta já foi gravado em
    // `notifications` de qualquer forma (linha acima), então uma falha aqui
    // (SMTP fora do ar, credencial errada etc.) nunca pode derrubar o fluxo
    // que criou a transação que disparou o alerta.
    try {
      const user = await db('users').where({ id: userId }).first('email');
      if (user?.email) {
        await new EmailService().enviarAlertaDisparado(user.email, { ...alert, totalGasto: totalGastos });
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail de alerta (não bloqueia o fluxo):', error.message);
    }
  }
}

module.exports = AlertObserver;
