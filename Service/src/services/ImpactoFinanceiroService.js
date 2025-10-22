const TransactionService = require('./TransactionService');

class ImpactoFinanceiroService {
  static async analisarImpacto(userId, produto, valor) {
    const transactionService = new TransactionService();
    
    // Buscar transações dos últimos 3 meses
    const now = new Date();
    const filters = {
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0],
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    };
    
    const transactions = await transactionService.getUserTransactions(userId, filters);
    
    // Calcular médias mensais
    const receitas = transactions.filter(t => t.tipo?.toLowerCase() === 'receita');
    const despesas = transactions.filter(t => t.tipo?.toLowerCase() === 'despesa');
    
    const receitaMedia = receitas.reduce((sum, t) => sum + Math.abs(t.valor), 0) / 3;
    const despesaMedia = despesas.reduce((sum, t) => sum + Math.abs(t.valor), 0) / 3;
    const economiaMedia = receitaMedia - despesaMedia;
    
    // Análise de impacto
    const tempoParaJuntar = economiaMedia > 0 ? Math.ceil(valor / economiaMedia) : null;
    const percentualRenda = receitaMedia > 0 ? (valor / receitaMedia) * 100 : 0;
    const impactoOrcamento = despesaMedia > 0 ? (valor / despesaMedia) * 100 : 0;
    
    // Recomendações
    const recomendacoes = this.gerarRecomendacoes(valor, receitaMedia, despesaMedia, economiaMedia);
    
    return {
      produto,
      valor,
      analise: {
        receitaMedia: Math.round(receitaMedia),
        despesaMedia: Math.round(despesaMedia),
        economiaMedia: Math.round(economiaMedia),
        tempoParaJuntar,
        percentualRenda: Math.round(percentualRenda),
        impactoOrcamento: Math.round(impactoOrcamento)
      },
      recomendacoes
    };
  }
  
  static gerarRecomendacoes(valor, receita, despesa, economia) {
    const recomendacoes = [];
    
    if (economia <= 0) {
      recomendacoes.push({
        tipo: 'alerta',
        mensagem: 'Você está gastando mais do que ganha. Reduza despesas antes de fazer esta compra.'
      });
    } else if (valor > economia * 6) {
      recomendacoes.push({
        tipo: 'cuidado',
        mensagem: 'Esta compra levará mais de 6 meses para ser paga. Considere economizar mais.'
      });
    } else if (valor > receita * 0.5) {
      recomendacoes.push({
        tipo: 'atencao',
        mensagem: 'Esta compra representa mais de 50% da sua renda mensal.'
      });
    } else {
      recomendacoes.push({
        tipo: 'positivo',
        mensagem: 'Esta compra está dentro do seu orçamento atual.'
      });
    }
    
    if (economia > 0) {
      const mesesEconomia = Math.ceil(valor / economia);
      recomendacoes.push({
        tipo: 'dica',
        mensagem: `Economize R$ ${Math.ceil(valor / mesesEconomia)} por mês durante ${mesesEconomia} meses.`
      });
    }
    
    return recomendacoes;
  }
}

module.exports = ImpactoFinanceiroService;