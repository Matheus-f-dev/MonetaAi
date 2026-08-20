const { db } = require('../config/firebase');

function currentCompetencia() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

class FixedExpenseController {
  static async create(req, res) {
    try {
      const { userId, nome, valor, categoria, diaVencimento, icone } = req.body;

      if (!userId || !nome || !valor || !diaVencimento) {
        return res.status(400).json({
          success: false,
          message: 'userId, nome, valor e diaVencimento são obrigatórios'
        });
      }

      const fixedExpenseData = {
        nome,
        valor: parseFloat(valor) || 0,
        categoria: categoria || 'Outros',
        diaVencimento: Math.min(28, Math.max(1, parseInt(diaVencimento, 10) || 1)),
        icone: icone || '📌',
        ativo: true,
        criadoEm: new Date().toISOString()
      };

      const docRef = await db.collection('usuarios').doc(userId).collection('gastosFixos').add(fixedExpenseData);

      res.status(201).json({
        success: true,
        message: 'Gasto fixo cadastrado com sucesso',
        fixedExpense: { id: docRef.id, ...fixedExpenseData }
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  // Todos os gastos fixos ativos do usuário já com o status do mês atual
  // (pago / a vencer / atrasado) — extraído como helper reutilizável (usado
  // também pelo resumo financeiro consolidado de contas).
  static async getActiveWithStatus(userId) {
    const snapshot = await db.collection('usuarios').doc(userId).collection('gastosFixos')
      .where('ativo', '==', true)
      .get();

    const fixedExpenses = [];
    snapshot.forEach(doc => fixedExpenses.push({ id: doc.id, ...doc.data() }));

    const competencia = currentCompetencia();
    const today = new Date().getDate();

    return Promise.all(fixedExpenses.map(async (item) => {
      const launched = await db.collection('usuarios').doc(userId).collection('historico')
        .where('recurrenceId', '==', item.id)
        .where('competencia', '==', competencia)
        .limit(1)
        .get();

      let status = 'due';
      if (!launched.empty) {
        status = 'paid';
      } else if (item.diaVencimento < today) {
        status = 'late';
      }

      return { ...item, status, competencia };
    }));
  }

  // Lista os gastos fixos já com o status do mês atual (pago / a vencer / atrasado)
  static async getUserFixedExpenses(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
      }

      const withStatus = await FixedExpenseController.getActiveWithStatus(userId);

      res.json({ success: true, fixedExpenses: withStatus });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor', fixedExpenses: [] });
    }
  }

  static async update(req, res) {
    try {
      const { fixedExpenseId } = req.params;
      const { userId, nome, valor, categoria, diaVencimento, icone } = req.body;

      if (!userId || !nome || !valor || !diaVencimento) {
        return res.status(400).json({ success: false, message: 'Campos obrigatórios ausentes' });
      }

      await db.collection('usuarios').doc(userId).collection('gastosFixos').doc(fixedExpenseId).update({
        nome,
        valor: parseFloat(valor) || 0,
        categoria: categoria || 'Outros',
        diaVencimento: Math.min(28, Math.max(1, parseInt(diaVencimento, 10) || 1)),
        icone: icone || '📌',
        atualizadoEm: new Date().toISOString()
      });

      res.json({ success: true, message: 'Gasto fixo atualizado com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  static async delete(req, res) {
    try {
      const { fixedExpenseId } = req.params;
      const { userId } = req.body;

      if (!fixedExpenseId || !userId) {
        return res.status(400).json({ success: false, message: 'fixedExpenseId e userId são obrigatórios' });
      }

      await db.collection('usuarios').doc(userId).collection('gastosFixos').doc(fixedExpenseId).update({
        ativo: false,
        removidoEm: new Date().toISOString()
      });

      res.json({ success: true, message: 'Gasto fixo removido com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  // Lança o gasto fixo como uma transação normal no mês corrente (evita duplicar se já lançado)
  static async lancar(req, res) {
    try {
      const { fixedExpenseId } = req.params;
      const { userId } = req.body;

      if (!fixedExpenseId || !userId) {
        return res.status(400).json({ success: false, message: 'fixedExpenseId e userId são obrigatórios' });
      }

      const doc = await db.collection('usuarios').doc(userId).collection('gastosFixos').doc(fixedExpenseId).get();
      if (!doc.exists) {
        return res.status(404).json({ success: false, message: 'Gasto fixo não encontrado' });
      }
      const fixedExpense = doc.data();
      const competencia = currentCompetencia();

      const already = await db.collection('usuarios').doc(userId).collection('historico')
        .where('recurrenceId', '==', fixedExpenseId)
        .where('competencia', '==', competencia)
        .limit(1)
        .get();

      if (!already.empty) {
        return res.status(409).json({ success: false, message: 'Este gasto fixo já foi lançado neste mês' });
      }

      const now = new Date();
      const dataHora = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${now.toLocaleTimeString('pt-BR')}`;

      const transactionData = {
        tipo: 'despesa',
        valor: fixedExpense.valor,
        descricao: fixedExpense.nome,
        categoria: fixedExpense.categoria || 'Outros',
        dataHora,
        recurrenceId: fixedExpenseId,
        competencia,
        criadoEm: new Date().toISOString()
      };

      const docRef = await db.collection('usuarios').doc(userId).collection('historico').add(transactionData);

      res.status(201).json({
        success: true,
        message: 'Gasto fixo lançado com sucesso',
        transaction: { id: docRef.id, userId, ...transactionData }
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
}

module.exports = FixedExpenseController;
