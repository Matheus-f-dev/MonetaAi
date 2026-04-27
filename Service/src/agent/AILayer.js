/**
 * AILayer — Camada de IA do agente Moneta AI.
 *
 * Responsabilidades:
 * - Enviar mensagem + prompt para a IA (OpenAI ou simulação local)
 * - Garantir que a resposta seja JSON válido
 * - Isolar completamente a lógica de IA do restante do sistema
 *
 * Para usar OpenAI real: defina OPENAI_API_KEY no .env
 * Sem a chave, o sistema usa o interpretador local (simulação inteligente).
 */

const { SYSTEM_PROMPT } = require('./agentPrompt');

class AILayer {
  constructor() {
    this.useOpenAI = !!process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  /**
   * Interpreta a mensagem do usuário e retorna { acao, dados, resposta }
   * @param {string} mensagem
   * @param {Array} historico - mensagens anteriores para contexto
   * @returns {Promise<{acao: string, dados: object, resposta: string}>}
   */
  async interpretar(mensagem, historico = []) {
    if (this.useOpenAI) {
      return this._chamarOpenAI(mensagem, historico);
    }
    return this._interpretarLocal(mensagem);
  }

  // --- OpenAI real ---
  async _chamarOpenAI(mensagem, historico) {
    const axios = require('axios');

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historico.slice(-6), // últimas 6 mensagens de contexto
      { role: 'user', content: mensagem }
    ];

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model: this.model, messages, temperature: 0.2, max_tokens: 500 },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
    );

    const content = response.data.choices[0].message.content.trim();
    return this._parseJSON(content, mensagem);
  }

  // --- Interpretador local (simulação inteligente sem API) ---
  _interpretarLocal(mensagem) {
    const texto = mensagem.toLowerCase().trim();
    const hoje = new Date().toLocaleDateString('pt-BR');

    // Detectar valor monetário na mensagem
    const valorMatch = texto.match(/r?\$?\s*(\d+(?:[.,]\d{1,2})?)/);
    const valor = valorMatch ? parseFloat(valorMatch[1].replace(',', '.')) : 0;

    // --- Registrar Gasto ---
    if (/gastei|paguei|comprei|despesa|saiu|cobrado|debitou/.test(texto)) {
      const categoria = this._inferirCategoria(texto);
      const descricao = this._gerarDescricao(texto, categoria);
      return {
        acao: 'registrarGasto',
        dados: { valor, descricao, categoria, data: hoje },
        resposta: valor > 0
          ? `Gasto de R$ ${valor.toFixed(2).replace('.', ',')} em ${categoria} registrado com sucesso! ✅`
          : 'Qual foi o valor do gasto?'
      };
    }

    // --- Registrar Receita ---
    if (/recebi|salário|salario|entrada|receita|pagamento recebido|caiu na conta|renda/.test(texto)) {
      const categoria = 'Renda';
      const descricao = this._gerarDescricao(texto, categoria);
      return {
        acao: 'registrarReceita',
        dados: { valor, descricao, categoria, data: hoje },
        resposta: valor > 0
          ? `Receita de R$ ${valor.toFixed(2).replace('.', ',')} registrada com sucesso! 💰`
          : 'Qual foi o valor recebido?'
      };
    }

    // --- Listar Gastos ---
    if (/gasto|gastei|histórico|historico|extrato|listar|quanto gastei|minhas despesas/.test(texto)) {
      const periodo = /hoje/.test(texto) ? 'hoje'
        : /semana/.test(texto) ? 'semana'
        : /ano/.test(texto) ? 'tudo'
        : 'mes';
      return {
        acao: 'listarGastos',
        dados: { periodo, categoria: null },
        resposta: 'Buscando seus gastos...'
      };
    }

    // --- Gerar Relatório ---
    if (/relatório|relatorio|resumo|análise|analise|dashboard|balanço|balanco/.test(texto)) {
      const periodo = /semana/.test(texto) ? 'semana' : /ano/.test(texto) ? 'ano' : 'mes';
      return {
        acao: 'gerarRelatorio',
        dados: { periodo },
        resposta: 'Gerando seu relatório financeiro...'
      };
    }

    // --- Sugerir Economia ---
    if (/economizar|economia|dica|sugestão|sugestao|cortar|reduzir|poupar/.test(texto)) {
      return {
        acao: 'sugerirEconomia',
        dados: {},
        resposta: 'Analisando seu perfil financeiro para sugestões personalizadas...'
      };
    }

    // --- Resposta Geral ---
    return {
      acao: 'responderGeral',
      dados: {},
      resposta: 'Olá! Sou o Moneta AI 💡 Posso te ajudar a registrar gastos e receitas, ver seu histórico, gerar relatórios e dar dicas de economia. O que você precisa?'
    };
  }

  // Infere categoria a partir do texto
  _inferirCategoria(texto) {
    const mapa = [
      [/uber|taxi|táxi|ônibus|onibus|metrô|metro|combustível|combustivel|gasolina|estacionamento/, 'Transporte'],
      [/mercado|supermercado|restaurante|lanche|comida|ifood|delivery|padaria|açougue|hortifruti/, 'Alimentação'],
      [/netflix|spotify|amazon|disney|hbo|streaming|assinatura|prime/, 'Assinaturas'],
      [/farmácia|farmacia|médico|medico|hospital|remédio|remedio|consulta|plano de saúde/, 'Saúde'],
      [/luz|água|agua|internet|aluguel|condomínio|condominio|gás|gas/, 'Moradia'],
      [/academia|cinema|show|viagem|bar|balada|lazer|jogo|game/, 'Lazer'],
      [/escola|curso|livro|faculdade|universidade|educação|educacao/, 'Educação'],
      [/roupa|sapato|vestuário|vestuario|loja|shopping/, 'Vestuário'],
    ];
    for (const [regex, categoria] of mapa) {
      if (regex.test(texto)) return categoria;
    }
    return 'Outros';
  }

  // Gera descrição legível a partir do texto
  _gerarDescricao(texto, categoria) {
    const palavrasChave = {
      Transporte: ['uber', 'taxi', 'ônibus', 'metrô', 'combustível', 'gasolina'],
      Alimentação: ['mercado', 'restaurante', 'ifood', 'lanche', 'delivery', 'padaria'],
      Assinaturas: ['netflix', 'spotify', 'amazon', 'disney'],
      Saúde: ['farmácia', 'médico', 'hospital', 'remédio'],
      Moradia: ['aluguel', 'condomínio', 'luz', 'água', 'internet'],
      Lazer: ['academia', 'cinema', 'show', 'viagem'],
      Educação: ['curso', 'escola', 'faculdade', 'livro'],
    };
    const chaves = palavrasChave[categoria] || [];
    for (const chave of chaves) {
      if (texto.includes(chave)) {
        return chave.charAt(0).toUpperCase() + chave.slice(1);
      }
    }
    return categoria;
  }

  // Garante que a resposta da IA seja JSON válido
  _parseJSON(content, mensagemOriginal) {
    try {
      // Remove possíveis blocos de código markdown
      const limpo = content.replace(/```json|```/g, '').trim();
      return JSON.parse(limpo);
    } catch {
      // Fallback se a IA retornar texto inválido
      return {
        acao: 'responderGeral',
        dados: {},
        resposta: content || 'Desculpe, não entendi. Pode reformular?'
      };
    }
  }
}

module.exports = AILayer;
