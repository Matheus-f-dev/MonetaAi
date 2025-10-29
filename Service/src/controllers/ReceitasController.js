const TransactionService = require('../services/TransactionService');

class ReceitasController {
  static async obterAnaliseReceitas(req, res) {
    try {
      const { userId } = req.params;
      const { period = 'Este Mês' } = req.query;
      
      const transacoes = await TransactionService.obterTransacoesPorUsuario(userId);
      const receitas = transacoes.filter(t => t.tipo?.toLowerCase() === 'receita');
      const analise = ReceitasController.processarAnaliseReceitas(receitas, period);
      
      res.json({
        success: true,
        data: analise
      });
    } catch (error) {
      console.error('Erro no controller de receitas:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao obter análise de receitas',
        details: error.message
      });
    }
  }

  static processarAnaliseReceitas(receitas, period) {
    const receitasFiltradas = ReceitasController.filtrarPorPeriodo(receitas, period);
    
    const totalReceitas = receitasFiltradas.reduce((sum, r) => sum + Math.abs(r.valor || 0), 0);
    
    // Análise por categoria
    const categorias = {};
    receitasFiltradas.forEach(r => {
      const categoria = r.categoria || 'Outros';
      categorias[categoria] = (categorias[categoria] || 0) + Math.abs(r.valor || 0);
    });

    const categoryData = Object.entries(categorias)
      .map(([name, total]) => ({
        name,
        total,
        percentage: totalReceitas > 0 ? Math.round((total / totalReceitas) * 100) : 0,
        color: ReceitasController.getCategoryColor(name)
      }))
      .sort((a, b) => b.total - a.total);

    // Evolução mensal
    const evolutionData = ReceitasController.gerarEvolucaoMensal(receitasFiltradas, period);
    
    // Receita média
    const diasNoPeriodo = ReceitasController.getDiasNoPeriodo(period);
    const receitaMediaDiaria = totalReceitas / diasNoPeriodo;
    
    // Maior fonte de receita
    const maiorFonte = categoryData[0] || { name: 'Sem dados', total: 0, percentage: 0 };
    
    return {
      totalReceitas,
      receitaMediaDiaria,
      maiorFonte,
      categoryData: categoryData.length > 0 ? categoryData : [
        { name: 'Sem dados', total: 0, percentage: 100, color: '#6B7280' }
      ],
      evolutionData
    };
  }

  static filtrarPorPeriodo(receitas, period) {
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
        return receitas;
    }

    return receitas.filter(r => {
      const date = ReceitasController.getTransactionDate(r);
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

  static gerarEvolucaoMensal(receitas, period) {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const result = [];
    
    if (period === 'Este Mês') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const monthIncome = receitas
        .filter(r => {
          const date = ReceitasController.getTransactionDate(r);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, r) => sum + Math.abs(r.valor || 0), 0);
      
      result.push({
        month: monthNames[now.getMonth()],
        value: monthIncome
      });
    } else if (period === 'Últimos 3 Meses') {
      for (let i = 2; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        
        const monthIncome = receitas
          .filter(r => {
            const date = ReceitasController.getTransactionDate(r);
            return date >= monthStart && date <= monthEnd;
          })
          .reduce((sum, r) => sum + Math.abs(r.valor || 0), 0);
        
        result.push({
          month: monthNames[targetDate.getMonth()],
          value: monthIncome
        });
      }
    } else {
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(now.getFullYear(), i, 1);
        const monthEnd = new Date(now.getFullYear(), i + 1, 0);
        
        const monthIncome = receitas
          .filter(r => {
            const date = ReceitasController.getTransactionDate(r);
            return date >= monthStart && date <= monthEnd;
          })
          .reduce((sum, r) => sum + Math.abs(r.valor || 0), 0);
        
        result.push({
          month: monthNames[i],
          value: monthIncome
        });
      }
    }
    
    return result;
  }

  static getDiasNoPeriodo(period) {
    const now = new Date();
    switch (period) {
      case 'Este Mês':
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      case 'Últimos 3 Meses':
        return 90;
      case 'Este Ano':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
      default:
        return 30;
    }
  }

  static getCategoryColor(category) {
    const colors = {
      'Salário': '#10B981',
      'Freelance': '#3B82F6', 
      'Investimentos': '#8B5CF6',
      'Vendas': '#F59E0B',
      'Outros': '#6B7280'
    };
    return colors[category] || '#6B7280';
  }
}

module.exports = ReceitasController;