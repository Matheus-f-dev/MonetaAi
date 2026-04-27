/**
 * AgentService — Orquestrador central do agente Moneta AI.
 *
 * Fluxo:
 * 1. Recebe mensagem do usuário
 * 2. Envia para AILayer → obtém { acao, dados, resposta }
 * 3. Passa para ActionExecutor → executa no sistema real
 * 4. Monta resposta final enriquecida para o usuário
 */

const AILayer = require('./AILayer');
const ActionExecutor = require('./ActionExecutor');

class AgentService {
  constructor() {
    this.ai = new AILayer();
  }

  /**
   * Processa uma mensagem do usuário e retorna a resposta do agente.
   * @param {string} mensagem
   * @param {string} userId
   * @param {Array} historico - histórico de mensagens para contexto
   */
  async processar(mensagem, userId, historico = []) {
    // 1. IA interpreta a mensagem
    const interpretacao = await this.ai.interpretar(mensagem, historico);
    const { acao, dados, resposta: respostaIA } = interpretacao;

    // 2. Executor roda a ação no sistema
    const executor = new ActionExecutor(userId);
    const execucao = await executor.executar(acao, dados);

    // 3. Monta resposta final
    return this._montarResposta(acao, dados, respostaIA, execucao);
  }

  _montarResposta(acao, dados, respostaIA, execucao) {
    // Se a execução falhou, informa o usuário
    if (!execucao.sucesso) {
      return {
        acao,
        resposta: `Não consegui completar a ação. ${execucao.mensagem || 'Tente novamente.'}`,
        dados: null
      };
    }

    // Para ações que retornam dados estruturados, enriquece a resposta
    const resultado = execucao.resultado;

    switch (acao) {
      case 'listarGastos':
        return {
          acao,
          resposta: this._formatarListaGastos(resultado, respostaIA),
          dados: resultado
        };

      case 'gerarRelatorio':
        return {
          acao,
          resposta: this._formatarRelatorio(resultado, respostaIA),
          dados: resultado
        };

      case 'sugerirEconomia':
        return {
          acao,
          resposta: this._formatarSugestoes(resultado, respostaIA),
          dados: resultado
        };

      default:
        // registrarGasto, registrarReceita, responderGeral
        return {
          acao,
          resposta: respostaIA,
          dados: resultado
        };
    }
  }

  _formatarListaGastos(resultado, fallback) {
    if (!resultado || !resultado.transactions?.length) {
      return 'Nenhum gasto encontrado no período. 🎉';
    }
    const { transactions, total, porCategoria, periodo } = resultado;
    const periodoLabel = { hoje: 'hoje', semana: 'esta semana', mes: 'este mês', tudo: 'no total' }[periodo] || periodo;

    let texto = `📊 Seus gastos ${periodoLabel}:\n\n`;
    texto += `💸 Total: R$ ${total.toFixed(2).replace('.', ',')}\n`;
    texto += `📝 Transações: ${transactions.length}\n\n`;
    texto += `Por categoria:\n`;
    for (const [cat, val] of Object.entries(porCategoria).sort((a, b) => b[1] - a[1])) {
      const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
      texto += `• ${cat}: R$ ${val.toFixed(2).replace('.', ',')} (${pct}%)\n`;
    }
    return texto;
  }

  _formatarRelatorio(resultado, fallback) {
    if (!resultado) return fallback;
    const { receitas, despesas, saldo, porCategoria, totalTransacoes, periodo } = resultado;
    const periodoLabel = { semana: 'da semana', mes: 'do mês', ano: 'do ano' }[periodo] || '';

    let texto = `📈 Relatório financeiro ${periodoLabel}:\n\n`;
    texto += `✅ Receitas: R$ ${receitas.toFixed(2).replace('.', ',')}\n`;
    texto += `❌ Despesas: R$ ${despesas.toFixed(2).replace('.', ',')}\n`;
    texto += `${saldo >= 0 ? '💚' : '🔴'} Saldo: R$ ${saldo.toFixed(2).replace('.', ',')}\n`;
    texto += `📝 Total de transações: ${totalTransacoes}\n`;

    if (Object.keys(porCategoria).length > 0) {
      texto += `\nGastos por categoria:\n`;
      for (const [cat, val] of Object.entries(porCategoria).sort((a, b) => b[1] - a[1])) {
        texto += `• ${cat}: R$ ${val.toFixed(2).replace('.', ',')}\n`;
      }
    }

    if (saldo < 0) texto += `\n⚠️ Atenção: suas despesas superaram as receitas este período.`;
    return texto;
  }

  _formatarSugestoes(resultado, fallback) {
    if (!resultado?.sugestoes?.length) {
      return '✨ Seus gastos estão bem equilibrados! Continue assim e mantenha o controle financeiro.';
    }
    const { sugestoes, totalDespesas } = resultado;

    let texto = `💡 Sugestões de economia personalizadas:\n\n`;
    texto += `Total de despesas no mês: R$ ${parseFloat(totalDespesas).toFixed(2).replace('.', ',')}\n\n`;
    for (const s of sugestoes) {
      texto += `📌 ${s.categoria} (${s.percentual}% dos gastos — R$ ${s.valor})\n`;
      texto += `   → ${s.dica}\n\n`;
    }
    return texto;
  }
}

module.exports = AgentService;
