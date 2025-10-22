const { db } = require('../config/firebase');

class AlertObserver {
  async update(transaction) {
    if (transaction.tipo !== 'despesa') return;
    
    try {
      const userId = transaction.userId;
      const categoria = transaction.categoria;
      const valor = Math.abs(transaction.valor);
      
      // Buscar alertas ativos para esta categoria
      const alertsSnapshot = await db.collection('usuarios').doc(userId).collection('alerta')
        .where('categoria', '==', categoria)
        .where('ativo', '==', true)
        .get();
      
      if (alertsSnapshot.empty) return;
      
      // Calcular total de gastos da categoria no mês atual
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const transactionsSnapshot = await db.collection('usuarios').doc(userId).collection('transacoes')
        .where('categoria', '==', categoria)
        .where('tipo', '==', 'despesa')
        .get();
      
      let totalGastos = 0;
      transactionsSnapshot.forEach(doc => {
        const transactionData = doc.data();
        const dateField = transactionData.dataHora;
        
        if (dateField && typeof dateField === 'string' && dateField.includes('/')) {
          const [datePart] = dateField.split(', ');
          const [day, month, year] = datePart.split('/');
          
          if (parseInt(month) === currentMonth && parseInt(year) === currentYear) {
            totalGastos += Math.abs(transactionData.valor);
          }
        }
      });
      
      // Verificar cada alerta
      alertsSnapshot.forEach(alertDoc => {
        const alert = { ...alertDoc.data(), id: alertDoc.id };
        const limite = alert.valor;
        const condicao = alert.condicao;
        
        let alertTriggered = false;
        
        switch (condicao) {
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
    const alertData = {
      alerteId: alert.id,
      nomeAlerta: alert.nome,
      categoria: alert.categoria,
      limite: alert.valor,
      totalGasto: totalGastos,
      condicao: alert.condicao,
      disparadoEm: new Date().toISOString(),
      lido: false
    };
    
    // Salvar notificação no banco
    await db.collection('usuarios').doc(userId).collection('notificacoes').add(alertData);
    
    console.log(`🚨 ALERTA DISPARADO: ${alert.nome} - ${alert.categoria} ${alert.condicao} R$ ${alert.valor}. Total atual: R$ ${totalGastos}`);
  }
}

module.exports = AlertObserver;