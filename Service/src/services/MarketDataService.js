// Cotação ao vivo pra ação/fii (brapi.dev, bolsa brasileira) e cripto
// (CoinGecko) -- é isso que faz a "área de investimentos calcular o
// juros automático em base em alguma rota de API e a bolsa de valores"
// (pedido do usuário): pra ativo de mercado, o valor não é mais digitado
// à mão, vem de quantidade × cotação atual, buscada aqui.

const BRAPI_BASE_URL = 'https://brapi.dev/api/v2/stocks/quote';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3/simple/price';

// brapi funciona sem token pros tickers de teste (PETR4, MGLU3, VALE3,
// ITUB4) com um limite bem apertado de requisições -- mesmo raciocínio
// de graceful degradation que o AILayer já usa pra IA: funciona sem
// configuração nenhuma pra começar a testar, fica melhor (sem limite tão
// curto) com BRAPI_TOKEN configurado.
async function fetchStockQuote(ticker) {
  const url = `${BRAPI_BASE_URL}?symbols=${encodeURIComponent(ticker)}`;
  const headers = process.env.BRAPI_TOKEN ? { Authorization: `Bearer ${process.env.BRAPI_TOKEN}` } : {};

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const err = new Error(`brapi respondeu ${response.status} pra "${ticker}"`);
    err.status = response.status;
    throw err;
  }

  const body = await response.json();
  const resultado = body?.results?.[0];
  if (!resultado?.data) {
    const err = new Error(`Ticker "${ticker}" não encontrado na B3`);
    err.status = 404;
    throw err;
  }

  const { data } = resultado;
  return {
    nome: data.shortName || ticker,
    preco: data.regularMarketPrice ?? 0,
    variacaoPercentual: data.regularMarketChangePercent ?? 0,
    moeda: data.currency || 'BRL',
    atualizadoEm: data.regularMarketTime || new Date().toISOString()
  };
}

// CoinGecko identifica a moeda pelo ID interno (ex.: "bitcoin"), não pelo
// ticker (ex.: "BTC") -- por isso o campo "ticker" de um investimento
// tipo cripto guarda esse id direto (ver CRYPTO_OPTIONS no frontend, que
// já oferece só ids válidos pra não precisar resolver símbolo -> id aqui).
async function fetchCryptoPrice(coinId) {
  const url = `${COINGECKO_BASE_URL}?ids=${encodeURIComponent(coinId)}&vs_currencies=brl&include_24hr_change=true`;

  const response = await fetch(url);
  if (!response.ok) {
    const err = new Error(`CoinGecko respondeu ${response.status} pra "${coinId}"`);
    err.status = response.status;
    throw err;
  }

  const body = await response.json();
  const dado = body?.[coinId];
  if (!dado || typeof dado.brl !== 'number') {
    const err = new Error(`Moeda "${coinId}" não encontrada`);
    err.status = 404;
    throw err;
  }

  return {
    nome: coinId,
    preco: dado.brl,
    variacaoPercentual: dado.brl_24h_change ?? 0,
    moeda: 'BRL',
    atualizadoEm: new Date().toISOString()
  };
}

async function fetchQuote(tipoAtivo, ticker) {
  if (!ticker) {
    const err = new Error('Ticker é obrigatório pra buscar cotação.');
    err.status = 400;
    throw err;
  }

  if (tipoAtivo === 'acao' || tipoAtivo === 'fii') {
    return fetchStockQuote(ticker);
  }
  if (tipoAtivo === 'cripto') {
    return fetchCryptoPrice(ticker);
  }

  const err = new Error(`Tipo de ativo "${tipoAtivo}" não tem cotação de mercado.`);
  err.status = 400;
  throw err;
}

module.exports = { fetchQuote, fetchStockQuote, fetchCryptoPrice };
