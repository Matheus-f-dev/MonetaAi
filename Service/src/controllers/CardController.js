const { db } = require('../config/database');

function toApiShape(row) {
  return {
    id: row.id,
    userId: row.user_id,
    nome: row.nome,
    instituicao: row.instituicao,
    final: row.final,
    limite: parseFloat(row.limite) || 0,
    diaFechamento: row.dia_fechamento,
    diaVencimento: row.dia_vencimento,
    cor: row.cor,
    ativo: Boolean(row.ativo)
  };
}

class CardController {
  static async create(req, res) {
    try {
      // userId sempre vem do token — nunca do body (senão dava pra criar
      // cartão em nome de outro usuário).
      const userId = req.user.uid;
      const { nome, instituicao, final, limite, diaFechamento, diaVencimento, cor } = req.body;

      if (!userId || !nome) {
        return res.status(400).json({
          success: false,
          message: 'userId e nome do cartão são obrigatórios'
        });
      }

      const [{ id }] = await db('cards').insert({
        user_id: userId,
        nome,
        instituicao: instituicao || '',
        final: (final || '').toString().slice(-4),
        limite: parseFloat(limite) || 0,
        dia_fechamento: parseInt(diaFechamento, 10) || 1,
        dia_vencimento: parseInt(diaVencimento, 10) || 10,
        cor: cor || 'roxo'
      }).returning('id');

      const row = await db('cards').where({ id }).first();

      res.status(201).json({
        success: true,
        message: 'Cartão cadastrado com sucesso',
        card: toApiShape(row)
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  static async getUserCards(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
      }

      const rows = await db('cards').where({ user_id: userId, ativo: true });
      res.json({ success: true, cards: rows.map(toApiShape) });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor', cards: [] });
    }
  }

  static async update(req, res) {
    try {
      const { cardId } = req.params;
      // userId vem do token — mesma razão do create() acima.
      const userId = req.user.uid;
      const { nome, instituicao, final, limite, diaFechamento, diaVencimento, cor } = req.body;

      if (!userId || !nome) {
        return res.status(400).json({ success: false, message: 'userId e nome do cartão são obrigatórios' });
      }

      await db('cards').where({ id: cardId, user_id: userId }).update({
        nome,
        instituicao: instituicao || '',
        final: (final || '').toString().slice(-4),
        limite: parseFloat(limite) || 0,
        dia_fechamento: parseInt(diaFechamento, 10) || 1,
        dia_vencimento: parseInt(diaVencimento, 10) || 10,
        cor: cor || 'roxo',
        atualizado_em: db.fn.now()
      });

      res.json({ success: true, message: 'Cartão atualizado com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  static async delete(req, res) {
    try {
      const { cardId } = req.params;
      // userId vem do token — mesma razão do create() acima.
      const userId = req.user.uid;

      if (!cardId) {
        return res.status(400).json({ success: false, message: 'cardId é obrigatório' });
      }

      // Soft delete: mantém o histórico de transações já vinculadas ao cartão íntegro
      await db('cards').where({ id: cardId, user_id: userId }).update({
        ativo: false,
        removido_em: db.fn.now()
      });

      res.json({ success: true, message: 'Cartão removido com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  // Fatura do cartão: soma das transações do período de fechamento atual.
  // Extraído como helper reutilizável (usado também pelo resumo de contas) —
  // não é um handler de rota, recebe os dados já buscados pra evitar 2 leituras.
  static async computeInvoice(userId, cardId, card) {
    const rows = await db('transactions').where({ user_id: userId, card_id: cardId });

    let total = 0;
    const transactions = rows.map((row) => {
      total += Math.abs(parseFloat(row.valor) || 0);
      return row;
    });

    const limite = parseFloat(card.limite) || 0;

    return {
      total,
      limite,
      usoPercentual: limite ? Math.min(100, Math.round((total / limite) * 100)) : 0,
      diaFechamento: card.dia_fechamento ?? card.diaFechamento,
      diaVencimento: card.dia_vencimento ?? card.diaVencimento,
      transactions
    };
  }

  static async getInvoice(req, res) {
    try {
      const { userId, cardId } = req.params;

      const card = await db('cards').where({ id: cardId, user_id: userId }).first();
      if (!card) {
        return res.status(404).json({ success: false, message: 'Cartão não encontrado' });
      }

      const invoice = await CardController.computeInvoice(userId, cardId, card);

      res.json({ success: true, invoice });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  // Todos os cartões ativos do usuário já com a fatura calculada — usado pelo
  // resumo financeiro consolidado (limite de crédito disponível / comprometido).
  static async getActiveCardsWithInvoices(userId) {
    const cards = await db('cards').where({ user_id: userId, ativo: true });

    return Promise.all(cards.map(async (card) => ({
      ...toApiShape(card),
      invoice: await CardController.computeInvoice(userId, card.id, card)
    })));
  }
}

module.exports = CardController;
