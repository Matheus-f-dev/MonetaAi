/**
 * ActionExecutor — Camada de execução de ações do agente.
 *
 * Recebe { acao, dados } interpretados pela IA e executa
 * as funções correspondentes no sistema real (MySQL, via TransactionService).
 *
 * Cada método retorna { sucesso, resultado, mensagem }.
 */

const TransactionService = require('../services/TransactionService');
const { inferirCategoria } = require('../services/CategoryInference');

class ActionExecutor {
  constructor(userId) {
    this.userId = userId;
    this.transactionService = new TransactionService();
  }

  /**
   * Despacha a ação correta com base no campo "acao"
   * @param {string} acao
   * @param {object} dados
   */
  async executar(acao, dados) {
    const acoes = {
      registrarGasto: () => this.registrarGasto(dados),
      registrarReceita: () => this.registrarReceita(dados),
      listarGastos: () => this.listarGastos(dados),
      gerarRelatorio: () => this.gerarRelatorio(dados),
      sugerirEconomia: () => this.sugerirEconomia(),
      responderGeral: () => ({ sucesso: true, resultado: null }),
    };

    const fn = acoes[acao];
    if (!fn) return { sucesso: false, mensagem: `Ação desconhecida: ${acao}` };

    try {
      return await fn();
    } catch (error) {
      return { sucesso: false, mensagem: error.message };
    }
  }

  // --- Registrar Gasto ---
  async registrarGasto({ valor, descricao, categoria, data }) {
    if (!valor || valor <= 0) return { sucesso: false, mensagem: 'Valor inválido para o gasto.' };

    // A IA já manda a categoria na maioria dos casos (segue as regras do
    // próprio prompt), mas se vier vazia, cai no mesmo inferidor usado no
    // cadastro manual em vez de ir direto pro genérico "Outros".
    const categoriaFinal = categoria || inferirCategoria(descricao) || 'Outros';

    const transaction = await this.transactionService.createTransaction({
      userId: this.userId,
      tipo: 'despesa',
      valor: parseFloat(valor),
      descricao: descricao || categoriaFinal || 'Gasto',
      categoria: categoriaFinal,
      dataHora: data || new Date().toLocaleDateString('pt-BR'),
    });

    return {
      sucesso: true,
      resultado: transaction,
      mensagem: `Gasto de R$ ${parseFloat(valor).toFixed(2).replace('.', ',')} em ${categoriaFinal} registrado!`
    };
  }

  // --- Registrar Receita ---
  async registrarReceita({ valor, descricao, categoria, data }) {
    if (!valor || valor <= 0) return { sucesso: false, mensagem: 'Valor inválido para a receita.' };

    // Receita usa "Renda" como fallback (não "Outros") -- mas ainda tenta a
    // inferência primeiro, caso a descrição bata com alguma regra específica.
    const categoriaFinal = categoria || inferirCategoria(descricao) || 'Renda';

    const transaction = await this.transactionService.createTransaction({
      userId: this.userId,
      tipo: 'receita',
      valor: parseFloat(valor),
      descricao: descricao || categoriaFinal || 'Receita',
      categoria: categoriaFinal,
      dataHora: data || new Date().toLocaleDateString('pt-BR'),
    });

    return {
      sucesso: true,
      resultado: transaction,
      mensagem: `Receita de R$ ${parseFloat(valor).toFixed(2).replace('.', ',')} registrada!`
    };
  }

  // --- Listar Gastos ---
  async listarGastos({ periodo = 'mes', categoria = null }) {
    const filtros = this._periodoParaFiltro(periodo);
    if (categoria) filtros.category = categoria;
    filtros.type = 'despesa';

    const transactions = await this.transactionService.getUserTransactions(this.userId, filtros);

    const total = transactions.reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
    const porCategoria = transactions.reduce((acc, t) => {
      const cat = t.categoria || 'Outros';
      acc[cat] = (acc[cat] || 0) + Math.abs(t.valor || 0);
      return acc;
    }, {});

    return {
      sucesso: true,
      resultado: { transactions, total, porCategoria, periodo },
      mensagem: `${transactions.length} gasto(s) encontrado(s). Total: R$ ${total.toFixed(2).replace('.', ',')}`
    };
  }

  // --- Gerar Relatório ---
  async gerarRelatorio({ periodo = 'mes' }) {
    const filtros = this._periodoParaFiltro(periodo);
    const transactions = await this.transactionService.getUserTransactions(this.userId, filtros);

    const receitas = transactions.filter(t => t.tipo === 'receita').reduce((s, t) => s + Math.abs(t.valor || 0), 0);
    const despesas = transactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Math.abs(t.valor || 0), 0);
    const saldo = receitas - despesas;

    const porCategoria = transactions
      .filter(t => t.tipo === 'despesa')
      .reduce((acc, t) => {
        const cat = t.categoria || 'Outros';
        acc[cat] = (acc[cat] || 0) + Math.abs(t.valor || 0);
        return acc;
      }, {});

    // Categoria com maior gasto
    const maiorGasto = Object.entries(porCategoria).sort((a, b) => b[1] - a[1])[0];

    return {
      sucesso: true,
      resultado: { receitas, despesas, saldo, porCategoria, totalTransacoes: transactions.length, periodo },
      mensagem: `Relatório do ${periodo}: Receitas R$ ${receitas.toFixed(3).replace('.', ',')} | Despesas R$ ${despesas.toFixed(2).replace('.', ',')} | Saldo R$ ${saldo.toFixed(2).replace('.', ',')}${maiorGasto ? ` | Maior gasto: ${maiorGasto[0]}` : ''}`
    };
  }

  // --- Sugerir Economia ---
  async sugerirEconomia() {
    const filtros = this._periodoParaFiltro('mes');
    const transactions = await this.transactionService.getUserTransactions(this.userId, filtros);

    const despesas = transactions.filter(t => t.tipo === 'despesa');
    const totalDespesas = despesas.reduce((s, t) => s + Math.abs(t.valor || 0), 0);

    const porCategoria = despesas.reduce((acc, t) => {
      const cat = t.categoria || 'Outros';
      acc[cat] = (acc[cat] || 0) + Math.abs(t.valor || 0);
      return acc;
    }, {});

    const sugestoes = this._gerarSugestoes(porCategoria, totalDespesas);

    return {
      sucesso: true,
      resultado: { sugestoes, porCategoria, totalDespesas },
      mensagem: sugestoes.length > 0
        ? `Encontrei ${sugestoes.length} oportunidade(s) de economia para você!`
        : 'Seus gastos estão bem distribuídos! Continue assim.'
    };
  }

  // Gera sugestões baseadas nos gastos por categoria
  _gerarSugestoes(porCategoria, total) {
    const sugestoes = [];
    const limites = {
      Alimentação: 0.35,
      Lazer: 0.15,
      Assinaturas: 0.10,
      Transporte: 0.20,
    };

    for (const [cat, valor] of Object.entries(porCategoria)) {
      const percentual = total > 0 ? valor / total : 0;
      const limite = limites[cat];
      if (limite && percentual > limite) {
        sugestoes.push({
          categoria: cat,
          valor: valor.toFixed(2),
          percentual: (percentual * 100).toFixed(0),
          dica: this._dicaPorCategoria(cat, percentual)
        });
      }
    }

    return sugestoes;
  }

  _dicaPorCategoria(categoria, percentual) {
    const dicas = {
      Alimentação: 'Considere cozinhar mais em casa e reduzir pedidos de delivery.',
      Lazer: 'Busque opções de lazer gratuitas ou de baixo custo na sua cidade.',
      Assinaturas: 'Revise suas assinaturas e cancele as que você usa pouco.',
      Transporte: 'Considere usar transporte público ou caronas compartilhadas.',
    };
    return dicas[categoria] || `Seus gastos com ${categoria} estão acima do recomendado.`;
  }

  // Converte período em filtros do TransactionService
  _periodoParaFiltro(periodo) {
    const now = new Date();
    switch (periodo) {
      case 'hoje':
        return {
          startDate: now.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
      case 'semana':
        return {
          startDate: new Date(now - 7 * 86400000).toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
      case 'ano':
        return {
          startDate: `${now.getFullYear()}-01-01`,
          endDate: now.toISOString().split('T')[0]
        };
      case 'mes':
      default:
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
    }
  }
}

module.exports = ActionExecutor;
