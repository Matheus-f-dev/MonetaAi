/**
 * AILayer — Camada de IA do agente Moneta AI.
 *
 * Responsabilidades:
 * - Enviar mensagem + prompt para a IA (xAI/Grok, Groq, OpenAI ou
 *   simulação local)
 * - Garantir que a resposta seja JSON válido
 * - Isolar completamente a lógica de IA do restante do sistema
 *
 * Pra usar IA de verdade, defina UMA das três no .env (nunca mais de
 * uma -- se existir mais de uma, a ordem abaixo decide qual ganha):
 *   XAI_API_KEY=xai-...       (console.x.ai -- Grok, da xAI/Elon Musk)
 *   GROQ_API_KEY=gsk_...      (console.groq.com/keys -- Groq, hospeda
 *                              Llama/Mixtral com inferência rápida --
 *                              nome parecido com "Grok" mas é outra
 *                              empresa, outro produto, cuidado ao copiar
 *                              a chave certa pra variável certa)
 *   OPENAI_API_KEY=sk-...     (platform.openai.com/api-keys)
 * Sem nenhuma das três, o sistema usa o interpretador local (regras por
 * regex, sem chamada de rede nenhuma -- é o que já rodava antes de
 * qualquer uma delas existir, continua funcionando igual).
 *
 * AI_AGENT_DISABLED=true força o interpretador local mesmo com uma
 * chave presente no .env -- pensado pro caso de já ter a chave (ex.:
 * conta criada, aguardando crédito/plano ativar do lado do provedor)
 * mas não querer que o sistema tente chamar a API nesse meio-tempo
 * (cada tentativa falhada é uma chamada de rede + o log de erro em
 * _chamarIA a mais, sem necessidade). Tirar essa variável (ou pôr
 * `false`) volta a tentar a chave normalmente, sem precisar mexer em
 * mais nada.
 *
 * As três APIs são compatíveis com o formato da OpenAI (mesmo corpo de
 * request/response, só a URL e o catálogo de modelos mudam) -- por isso
 * os três provedores dividem a mesma função de chamada (_chamarIA),
 * variando só baseURL/model/apiKey. Se a chamada falhar por qualquer
 * motivo (chave inválida, provedor fora do ar, limite de uso) o agente
 * cai pro interpretador local em vez de devolver erro pro usuário --
 * achado real: antes disso, uma chave errada travava a conversa inteira
 * com "Ocorreu um erro interno", em vez de simplesmente responder com
 * menos inteligência.
 */

const { SYSTEM_PROMPT } = require('./agentPrompt');

const PROVIDERS = {
  xai: {
    baseURL: 'https://api.x.ai/v1/chat/completions',
    defaultModel: 'grok-4-fast'
  },
  groq: {
    baseURL: 'https://api.groq.com/openai/v1/chat/completions',
    // Llama 3.3 70B -- bom equilíbrio custo/qualidade pra essa tarefa
    // (classificar intenção + devolver JSON curto), não o maior modelo
    // disponível na Groq (não precisa pra esse tamanho de prompt).
    defaultModel: 'llama-3.3-70b-versatile'
  },
  openai: {
    baseURL: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini'
  }
};

class AILayer {
  constructor() {
    this.provider = process.env.XAI_API_KEY
      ? 'xai'
      : process.env.GROQ_API_KEY
        ? 'groq'
        : process.env.OPENAI_API_KEY
          ? 'openai'
          : null;
    this.apiKey = this.provider ? process.env[`${this.provider.toUpperCase()}_API_KEY`] : null;
    this.useAI = Boolean(this.provider) && process.env.AI_AGENT_DISABLED !== 'true';

    if (this.useAI) {
      const config = PROVIDERS[this.provider];
      this.baseURL = config.baseURL;
      // XAI_MODEL/GROQ_MODEL/OPENAI_MODEL (conforme o provedor escolhido)
      // deixam trocar o modelo sem mexer em código.
      this.model = process.env[`${this.provider.toUpperCase()}_MODEL`] || config.defaultModel;
    }
  }

  /**
   * Interpreta a mensagem do usuário e retorna { acao, dados, resposta }
   * @param {string} mensagem
   * @param {Array} historico - mensagens anteriores para contexto
   * @returns {Promise<{acao: string, dados: object, resposta: string}>}
   */
  async interpretar(mensagem, historico = []) {
    if (this.useAI) {
      try {
        return await this._chamarIA(mensagem, historico);
      } catch (error) {
        // Loga o motivo de verdade (status HTTP, corpo do erro) pra dar
        // pra diagnosticar (chave errada vs. provedor fora do ar vs.
        // limite de uso) sem expor isso na resposta pro usuário -- ele só
        // recebe a resposta do interpretador local, como se a IA nunca
        // tivesse sido configurada.
        console.error(
          `[AILayer] Chamada pra ${this.provider} falhou (${error.response?.status || error.message}) -- caindo pro interpretador local.`
        );
        return this._interpretarLocal(mensagem);
      }
    }
    return this._interpretarLocal(mensagem);
  }

  // --- IA real (xAI, Groq ou OpenAI, mesmo formato de chamada) ---
  async _chamarIA(mensagem, historico) {
    const axios = require('axios');

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historico.slice(-6), // últimas 6 mensagens de contexto
      { role: 'user', content: mensagem }
    ];

    const response = await axios.post(
      this.baseURL,
      { model: this.model, messages, temperature: 0.2, max_tokens: 500 },
      { headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' } }
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
