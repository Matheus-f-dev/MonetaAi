const TransactionService = require('../services/TransactionService');

class TendenciasController {
  static async obterAnaliseTendencias(req, res) {
    try {
      const { userId } = req.params;
      const { period = 'Este Ano' } = req.query;
      
      const transacoes = await TransactionService.obterTransacoesPorUsuario(userId);
      const analise = TendenciasController.processarAnaliseTendencias(transacoes, period);
      
      res.json({
        success: true,
        data: analise
      });
    } catch (error) {
      console.error('Erro no controller de tendências:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao obter análise de tendências',
        details: error.message
      });
    }
  }

  static processarAnaliseTendencias(transacoes, period) {
    const dadosMensais = TendenciasController.gerarDadosMensais(transacoes, period);
    
    const tendenciaReceitas = TendenciasController.calcularTendencia(dadosMensais.map(d => d.receitas));
    const tendenciaDespesas = TendenciasController.calcularTendencia(dadosMensais.map(d => d.despesas));
    const tendenciaEconomias = TendenciasController.calcularTendencia(dadosMensais.map(d => d.economia));
    
    const previsaoProximoMes = TendenciasController.calcularPrevisao(dadosMensais);
    const categoriasEmAlta = TendenciasController.analisarCategoriasEmAlta(transacoes);
    const padroesSazonais = TendenciasController.identificarPadroesSazonais(dadosMensais);
    
    return {
      dadosMensais,
      tendencias: {
        receitas: tendenciaReceitas,
        despesas: tendenciaDespesas,
        economias: tendenciaEconomias
      },
      previsaoProximoMes,
      categoriasEmAlta,
      padroesSazonais,
      insights: TendenciasController.gerarInsights(tendenciaReceitas, tendenciaDespesas, tendenciaEconomias)
    };
  }

  static gerarDadosMensais(transacoes, period) {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const result = [];
    
    let meses = [];
    if (period === 'Este Ano') {
      meses = Array.from({length: 12}, (_, i) => i);
    } else {
      meses = Array.from({length: 6}, (_, i) => now.getMonth() - 5 + i);
    }
    
    meses.forEach(monthIndex => {
      const adjustedMonth = monthIndex < 0 ? 12 + monthIndex : monthIndex % 12;
      const year = monthIndex < 0 ? now.getFullYear() - 1 : now.getFullYear();
      
      const monthStart = new Date(year, adjustedMonth, 1);
      const monthEnd = new Date(year, adjustedMonth + 1, 0);
      
      const transacoesMes = transacoes.filter(t => {
        const date = TendenciasController.getTransactionDate(t);
        return date >= monthStart && date <= monthEnd;
      });
      
      const receitas = transacoesMes
        .filter(t => t.tipo?.toLowerCase() === 'receita')
        .reduce((sum, r) => sum + Math.abs(r.valor || 0), 0);
      
      const despesas = transacoesMes
        .filter(t => t.tipo?.toLowerCase() === 'despesa')
        .reduce((sum, d) => sum + Math.abs(d.valor || 0), 0);
      
      result.push({
        month: monthNames[adjustedMonth],
        receitas,
        despesas,
        economia: receitas - despesas,
        transacoes: transacoesMes.length
      });
    });
    
    return result;
  }

  static calcularTendencia(valores) {
    if (valores.length < 2) return { direcao: 'estável', percentual: 0, status: 'neutro' };
    
    const n = valores.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = valores;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const mediaY = sumY / n;
    
    const percentual = mediaY > 0 ? Math.abs((slope / mediaY) * 100) : 0;
    
    let direcao, status;
    if (slope > 0.1) {
      direcao = 'crescente';
      status = 'positivo';
    } else if (slope < -0.1) {
      direcao = 'decrescente';
      status = 'negativo';
    } else {
      direcao = 'estável';
      status = 'neutro';
    }
    
    return { direcao, percentual: Math.round(percentual * 100) / 100, status, slope };
  }

  static calcularPrevisao(dadosMensais) {
    if (dadosMensais.length < 3) return null;
    
    const ultimosTresMeses = dadosMensais.slice(-3);
    
    const mediaReceitas = ultimosTresMeses.reduce((sum, d) => sum + d.receitas, 0) / 3;
    const mediaDespesas = ultimosTresMeses.reduce((sum, d) => sum + d.despesas, 0) / 3;
    
    return {
      receitas: Math.round(mediaReceitas),
      despesas: Math.round(mediaDespesas),
      economia: Math.round(mediaReceitas - mediaDespesas)
    };
  }

  static analisarCategoriasEmAlta(transacoes) {
    const now = new Date();
    const mesAtual = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const mesAnteriorFim = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const categoriasAtual = {};
    const categoriasAnterior = {};
    
    transacoes.forEach(t => {
      const date = TendenciasController.getTransactionDate(t);
      const categoria = t.categoria || 'Outros';
      const valor = Math.abs(t.valor || 0);
      
      if (date >= mesAtual) {
        categoriasAtual[categoria] = (categoriasAtual[categoria] || 0) + valor;
      } else if (date >= mesAnterior && date <= mesAnteriorFim) {
        categoriasAnterior[categoria] = (categoriasAnterior[categoria] || 0) + valor;
      }
    });
    
    return Object.keys(categoriasAtual)
      .map(categoria => {
        const valorAtual = categoriasAtual[categoria] || 0;
        const valorAnterior = categoriasAnterior[categoria] || 0;
        const crescimento = valorAnterior > 0 ? ((valorAtual - valorAnterior) / valorAnterior) * 100 : 0;
        
        return {
          categoria,
          valorAtual,
          valorAnterior,
          crescimento: Math.round(crescimento * 100) / 100,
          status: crescimento > 10 ? 'alta' : crescimento < -10 ? 'baixa' : 'estável'
        };
      })
      .filter(c => c.crescimento > 5)
      .sort((a, b) => b.crescimento - a.crescimento)
      .slice(0, 5);
  }

  static identificarPadroesSazonais(dadosMensais) {
    if (dadosMensais.length < 6) return [];
    
    const padroes = [];
    
    // Identificar mês com maior gasto
    const maiorGasto = dadosMensais.reduce((max, atual) => 
      atual.despesas > max.despesas ? atual : max
    );
    
    // Identificar mês com maior receita
    const maiorReceita = dadosMensais.reduce((max, atual) => 
      atual.receitas > max.receitas ? atual : max
    );
    
    padroes.push({
      tipo: 'Pico de Gastos',
      mes: maiorGasto.month,
      valor: maiorGasto.despesas,
      descricao: `Maior volume de gastos em ${maiorGasto.month}`
    });
    
    padroes.push({
      tipo: 'Pico de Receitas',
      mes: maiorReceita.month,
      valor: maiorReceita.receitas,
      descricao: `Maior volume de receitas em ${maiorReceita.month}`
    });
    
    return padroes;
  }

  static gerarInsights(tendenciaReceitas, tendenciaDespesas, tendenciaEconomias) {
    const insights = [];
    
    if (tendenciaReceitas.direcao === 'crescente') {
      insights.push({
        tipo: 'positivo',
        titulo: 'Receitas em Crescimento',
        descricao: `Suas receitas estão crescendo ${tendenciaReceitas.percentual.toFixed(1)}% ao mês`
      });
    }
    
    if (tendenciaDespesas.direcao === 'crescente') {
      insights.push({
        tipo: 'atencao',
        titulo: 'Despesas em Alta',
        descricao: `Suas despesas estão aumentando ${tendenciaDespesas.percentual.toFixed(1)}% ao mês`
      });
    }
    
    if (tendenciaEconomias.direcao === 'decrescente') {
      insights.push({
        tipo: 'negativo',
        titulo: 'Economias em Declínio',
        descricao: 'Suas economias estão diminuindo. Considere revisar seus gastos'
      });
    }
    
    return insights;
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
}

module.exports = TendenciasController;