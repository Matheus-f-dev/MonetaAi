const { db } = require('../config/firebase');

class CardController {
  static async create(req, res) {
    try {
      const { userId, nome, instituicao, final, limite, diaFechamento, diaVencimento, cor } = req.body;

      if (!userId || !nome) {
        return res.status(400).json({
          success: false,
          message: 'userId e nome do cartão são obrigatórios'
        });
      }

      const cardData = {
        nome,
        instituicao: instituicao || '',
        final: (final || '').toString().slice(-4),
        limite: parseFloat(limite) || 0,
        diaFechamento: parseInt(diaFechamento, 10) || 1,
        diaVencimento: parseInt(diaVencimento, 10) || 10,
        cor: cor || 'roxo',
        ativo: true,
        criadoEm: new Date().toISOString()
      };

      const docRef = await db.collection('usuarios').doc(userId).collection('cartoes').add(cardData);

      res.status(201).json({
        success: true,
        message: 'Cartão cadastrado com sucesso',
        card: { id: docRef.id, ...cardData }
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

      const snapshot = await db.collection('usuarios').doc(userId).collection('cartoes')
        .where('ativo', '==', true)
        .get();

      const cards = [];
      snapshot.forEach(doc => cards.push({ id: doc.id, ...doc.data() }));

      res.json({ success: true, cards });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor', cards: [] });
    }
  }

  static async update(req, res) {
    try {
      const { cardId } = req.params;
      const { userId, nome, instituicao, final, limite, diaFechamento, diaVencimento, cor } = req.body;

      if (!userId || !nome) {
        return res.status(400).json({ success: false, message: 'userId e nome do cartão são obrigatórios' });
      }

      const cardData = {
        nome,
        instituicao: instituicao || '',
        final: (final || '').toString().slice(-4),
        limite: parseFloat(limite) || 0,
        diaFechamento: parseInt(diaFechamento, 10) || 1,
        diaVencimento: parseInt(diaVencimento, 10) || 10,
        cor: cor || 'roxo',
        atualizadoEm: new Date().toISOString()
      };

      await db.collection('usuarios').doc(userId).collection('cartoes').doc(cardId).update(cardData);

      res.json({ success: true, message: 'Cartão atualizado com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  static async delete(req, res) {
    try {
      const { cardId } = req.params;
      const { userId } = req.body;

      if (!cardId || !userId) {
        return res.status(400).json({ success: false, message: 'cardId e userId são obrigatórios' });
      }

      // Soft delete: mantém o histórico de transações já vinculadas ao cartão íntegro
      await db.collection('usuarios').doc(userId).collection('cartoes').doc(cardId).update({
        ativo: false,
        removidoEm: new Date().toISOString()
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
    const snapshot = await db.collection('usuarios').doc(userId).collection('historico')
      .where('cardId', '==', cardId)
      .get();

    let total = 0;
    const transactions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      total += Math.abs(parseFloat(data.valor) || 0);
      transactions.push({ id: doc.id, ...data });
    });

    return {
      total,
      limite: card.limite || 0,
      usoPercentual: card.limite ? Math.min(100, Math.round((total / card.limite) * 100)) : 0,
      diaFechamento: card.diaFechamento,
      diaVencimento: card.diaVencimento,
      transactions
    };
  }

  static async getInvoice(req, res) {
    try {
      const { userId, cardId } = req.params;

      const cardDoc = await db.collection('usuarios').doc(userId).collection('cartoes').doc(cardId).get();
      if (!cardDoc.exists) {
        return res.status(404).json({ success: false, message: 'Cartão não encontrado' });
      }

      const invoice = await CardController.computeInvoice(userId, cardId, cardDoc.data());

      res.json({ success: true, invoice });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  // Todos os cartões ativos do usuário já com a fatura calculada — usado pelo
  // resumo financeiro consolidado (limite de crédito disponível / comprometido).
  static async getActiveCardsWithInvoices(userId) {
    const snapshot = await db.collection('usuarios').doc(userId).collection('cartoes')
      .where('ativo', '==', true)
      .get();

    const cards = [];
    snapshot.forEach(doc => cards.push({ id: doc.id, ...doc.data() }));

    return Promise.all(cards.map(async (card) => ({
      ...card,
      invoice: await CardController.computeInvoice(userId, card.id, card)
    })));
  }
}

module.exports = CardController;
