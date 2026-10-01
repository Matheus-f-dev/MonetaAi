const { fetchQuote } = require('../services/MarketDataService');

class MarketDataController {
  // GET /api/market/quote?tipo=acao|fii|cripto&ticker=PETR4
  // Não é escopado por usuário (cotação é pública, igual pra todo mundo) --
  // só exige estar autenticado, como o resto da API.
  static async getQuote(req, res) {
    try {
      const { tipo, ticker } = req.query;
      if (!tipo || !ticker) {
        return res.status(400).json({ success: false, message: 'Parâmetros "tipo" e "ticker" são obrigatórios.' });
      }

      const cotacao = await fetchQuote(tipo, ticker);
      res.json({ success: true, cotacao });
    } catch (error) {
      // Erro de API externa fora do ar/limite de requisição não é culpa de
      // quem chamou -- 502, não 500, pra distinguir "nosso bug" de "a fonte
      // de dados externa falhou agora".
      const status = error.status && error.status < 500 ? error.status : 502;
      res.status(status).json({ success: false, message: error.message || 'Erro ao buscar cotação.' });
    }
  }
}

module.exports = MarketDataController;
