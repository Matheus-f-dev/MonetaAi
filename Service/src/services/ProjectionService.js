class ProjectionService {
  static calculateAdvancedProjection(transactions, period = 12) {
    if (!transactions || transactions.length === 0) {
      const emptyProjection = [{ month: 0, balance: 0 }];
      return {
        currentBalance: 0,
        scenarios: {
          optimistic: emptyProjection,
          realistic: emptyProjection,
          pessimistic: emptyProjection
        },
        trend: 'estável'
      };
    }
    
    const balance = this.getCurrentBalance(transactions);
    const monthlyData = this.groupTransactionsByMonth(transactions);
    const trend = this.calculateTrend(transactions);
    const scenarios = this.calculateScenarios(monthlyData, trend, period, balance);
    
    return {
      currentBalance: balance,
      scenarios,
      trend: this.getTrendStatus(trend)
    };
  }

  static getCurrentBalance(transactions) {
    return transactions.reduce((acc, t) => {
      return acc + (t.tipo?.toLowerCase() === 'receita' ? 
        Math.abs(parseFloat(t.valor) || 0) : 
        -Math.abs(parseFloat(t.valor) || 0));
    }, 0);
  }

  static groupTransactionsByMonth(transactions) {
    const monthlyData = {};
    const recent = transactions.slice(-90); // Últimos 90 dias mais relevantes
    
    recent.forEach(t => {
      const month = this.extractMonth(t);
      if (!monthlyData[month]) {
        monthlyData[month] = { receitas: 0, despesas: 0, count: 0 };
      }
      
      const valor = Math.abs(parseFloat(t.valor) || 0);
      if (t.tipo?.toLowerCase() === 'receita') {
        monthlyData[month].receitas += valor;
      } else {
        monthlyData[month].despesas += valor;
      }
      monthlyData[month].count++;
    });
    
    return monthlyData;
  }

  static calculateTrend(transactions) {
    if (transactions.length < 6) return 0;
    
    const recent = transactions.slice(-60); // Últimos 60 dias
    const older = transactions.slice(-120, -60); // 60 dias anteriores
    
    const recentNet = this.getNetValue(recent);
    const olderNet = this.getNetValue(older);
    
    return olderNet === 0 ? 0 : (recentNet - olderNet) / Math.abs(olderNet);
  }

  static getNetValue(transactions) {
    return transactions.reduce((acc, t) => {
      return acc + (t.tipo?.toLowerCase() === 'receita' ? 
        Math.abs(parseFloat(t.valor) || 0) : 
        -Math.abs(parseFloat(t.valor) || 0));
    }, 0);
  }

  static calculateScenarios(monthlyData, trend, period, balance) {
    const avgIncome = this.getAverage(monthlyData, 'receitas');
    const avgExpenses = this.getAverage(monthlyData, 'despesas');
    const baseNet = avgIncome - avgExpenses;

    const seasonalFactors = [0.9, 1.0, 1.0, 1.1, 1.0, 1.1, 1.0, 1.0, 1.0, 1.1, 1.2, 1.4];
    const currentMonth = new Date().getMonth();

    return {
      optimistic: this.projectScenario(balance, baseNet * 1.1, trend * 0.5, period, seasonalFactors, currentMonth),
      realistic: this.projectScenario(balance, baseNet, trend, period, seasonalFactors, currentMonth),
      pessimistic: this.projectScenario(balance, baseNet * 0.9, trend * 1.5, period, seasonalFactors, currentMonth)
    };
  }

  static projectScenario(balance, baseNet, trend, period, seasonalFactors, currentMonth) {
    const projection = [{ month: 0, balance: Math.round(balance * 100) / 100 }];
    let currentBalance = balance;

    for (let i = 1; i <= period; i++) {
      const futureMonth = (currentMonth + i) % 12;
      const seasonalFactor = seasonalFactors[futureMonth];
      const trendAdjustment = 1 + (trend * i * 0.05); // Tendência mais suave
      const monthlyNet = baseNet * seasonalFactor * trendAdjustment;
      
      // Adiciona variação aleatória pequena para realismo
      const randomVariation = (Math.random() - 0.5) * Math.abs(baseNet) * 0.1;
      currentBalance += monthlyNet + randomVariation;
      
      projection.push({ 
        month: i, 
        balance: Math.round(currentBalance * 100) / 100 
      });
    }

    return projection;
  }

  static getAverage(monthlyData, field) {
    const values = Object.values(monthlyData).filter(m => m[field] > 0);
    if (values.length === 0) return 0;
    
    // Média ponderada dando mais peso aos meses recentes
    const weightedSum = values.reduce((sum, m, index) => {
      const weight = (index + 1) / values.length; // Peso crescente
      return sum + (m[field] * weight);
    }, 0);
    
    const totalWeight = values.reduce((sum, _, index) => sum + ((index + 1) / values.length), 0);
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  static getTrendStatus(trend) {
    if (trend > 0.1) return 'crescendo';
    if (trend < -0.1) return 'decaindo';
    return 'estável';
  }

  static extractMonth(transaction) {
    const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
    if (dateField && typeof dateField === 'string' && dateField.includes('/')) {
      const [datePart] = dateField.split(', ');
      const [, monthStr] = datePart.split('/');
      return parseInt(monthStr) - 1;
    }
    return new Date().getMonth();
  }
}

module.exports = ProjectionService;