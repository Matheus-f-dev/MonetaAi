const TransactionService = require('../services/TransactionService');

class EconomiasController {
  static async obterAnaliseEconomias(req, res) {
    try {
      const { userId } = req.params;
      const { period = 'Este Mês' } = req.query;
      
      const transacoes = await TransactionService.obterTransacoesPorUsuario(userId);
      const analise = EconomiasController.processarAnaliseEconomias(transacoes, period);
      
      res.json({
        success: true,
        data: analise
      });
    } catch (error) {
      console.error('Erro no controller de economias:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao obter análise de economias',
        details: error.message
      });
    }
  }

  static processarAnaliseEconomias(transacoes, period) {
    const transacoesFiltradas = EconomiasController.filtrarPorPeriodo(transacoes, period);
    
    const receitas = transacoesFiltradas.filter(t => t.tipo?.toLowerCase() === 'receita');
    const despesas = transacoesFiltradas.filter(t => t.tipo?.toLowerCase() === 'despesa');
    
    const totalReceitas = receitas.reduce((sum, r) => sum + Math.abs(r.valor || 0), 0);
    const totalDespesas = despesas.reduce((sum, d) => sum + Math.abs(d.valor || 0), 0);
    const totalEconomias = totalReceitas - totalDespesas;
    
    const taxaEconomia = totalReceitas > 0 ? ((totalEconomias / totalReceitas) * 100) : 0;
    
    // Análise por categoria de economia
    const categoriasEconomia = EconomiasController.analisarCategoriasEconomia(despesas, totalReceitas);
    
    // Evolução das economias
    const evolutionData = EconomiasController.gerarEvolucaoEconomias(transacoes, period);
    
    // Meta de economia (30% da receita como padrão)
    const metaEconomia = totalReceitas * 0.3;
    const progressoMeta = metaEconomia > 0 ? Math.min((totalEconomias / metaEconomia) * 100, 100) : 0;
    
    return {
      totalEconomias,
      totalReceitas,
      totalDespesas,
      taxaEconomia: Math.round(taxaEconomia * 100) / 100,
      metaEconomia,
      progressoMeta: Math.round(progressoMeta * 100) / 100,
      categoriasEconomia,
      evolutionData,
      status: EconomiasController.getStatusEconomia(taxaEconomia)
    };
  }

  static analisarCategoriasEconomia(despesas, totalReceitas) {
    const categorias = {};
    despesas.forEach(d => {
      const categoria = d.categoria || 'Outros';
      categorias[categoria] = (categorias[categoria] || 0) + Math.abs(d.valor || 0);
    });

    return Object.entries(categorias)
      .map(([name, gasto]) => {
        const potencialEconomia = gasto * 0.2; // 20% de economia potencial
        return {
          name,
          gastoAtual: gasto,
          potencialEconomia,
          percentualReceita: totalReceitas > 0 ? Math.round((gasto / totalReceitas) * 100) : 0,
          color: EconomiasController.getCategoryColor(name)
        };
      })
      .sort((a, b) => b.potencialEconomia - a.potencialEconomia)
      .slice(0, 5);
  }

  static gerarEvolucaoEconomias(transacoes, period) {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const result = [];
    
    let meses = [];
    if (period === 'Este Mês') {
      meses = [now.getMonth()];
    } else if (period === 'Últimos 3 Meses') {
      meses = [now.getMonth() - 2, now.getMonth() - 1, now.getMonth()];
    } else {
      meses = Array.from({length: 12}, (_, i) => i);
    }
    
    meses.forEach(monthIndex => {
      const adjustedMonth = monthIndex < 0 ? 12 + monthIndex : monthIndex;
      const year = monthIndex < 0 ? now.getFullYear() - 1 : now.getFullYear();
      
      const monthStart = new Date(year, adjustedMonth, 1);
      const monthEnd = new Date(year, adjustedMonth + 1, 0);
      
      const transacoesMes = transacoes.filter(t => {
        const date = EconomiasController.getTransactionDate(t);
        return date >= monthStart && date <= monthEnd;
      });
      
      const receitasMes = transacoesMes
        .filter(t => t.tipo?.toLowerCase() === 'receita')
        .reduce((sum, r) => sum + Math.abs(r.valor || 0), 0);
      
      const despesasMes = transacoesMes
        .filter(t => t.tipo?.toLowerCase() === 'despesa')
        .reduce((sum, d) => sum + Math.abs(d.valor || 0), 0);
      
      const economiaMes = receitasMes - despesasMes;
      
      result.push({
        month: monthNames[adjustedMonth],
        economia: economiaMes,
        receita: receitasMes,
        despesa: despesasMes
      });
    });
    
    return result;
  }

  static filtrarPorPeriodo(transacoes, period) {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'Este Mês':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'Últimos 3 Meses':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'Este Ano':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        return transacoes;
    }

    return transacoes.filter(t => {
      const date = EconomiasController.getTransactionDate(t);
      return date >= startDate && date <= endDate;
    });
  }

  static getTransactionDate(transaction) {
    const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
    if (!dateField) return new Date();
    
    if (typeof dateField === 'string' && dateField.includes('/')) {
      const [datePart] = dateField.split(', ');
      const [day, month, year] = datePart.split('/');
      return new Date(year, month - 1, day);
    }
    return new Date(dateField);
  }

  static getStatusEconomia(taxaEconomia) {
    if (taxaEconomia >= 20) return { status: 'Excelente', color: '#10B981' };
    if (taxaEconomia >= 10) return { status: 'Bom', color: '#3B82F6' };
    if (taxaEconomia >= 0) return { status: 'Regular', color: '#F59E0B' };
    return { status: 'Atenção', color: '#EF4444' };
  }

  static getCategoryColor(category) {
    const colors = {
      'Alimentação': '#EF4444',
      'Transporte': '#F59E0B',
      'Lazer': '#8B5CF6',
      'Saúde': '#10B981',
      'Educação': '#3B82F6',
      'Casa': '#6366F1',
      'Outros': '#6B7280'
    };
    return colors[category] || '#6B7280';
  }
}

module.exports = EconomiasController;