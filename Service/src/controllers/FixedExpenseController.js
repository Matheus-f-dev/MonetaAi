const { db } = require('../config/database');

function currentCompetencia() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function toApiShape(row) {
  return {
    id: row.id,
    userId: row.user_id,
    nome: row.nome,
    valor: parseFloat(row.valor) || 0,
    categoria: row.categoria,
    diaVencimento: row.dia_vencimento,
    icone: row.icone,
    ativo: Boolean(row.ativo)
  };
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

      const [id] = await db('fixed_expenses').insert({
        user_id: userId,
        nome,
        valor: parseFloat(valor) || 0,
        categoria: categoria || 'Outros',
        dia_vencimento: Math.min(28, Math.max(1, parseInt(diaVencimento, 10) || 1)),
        icone: icone || '📌'
      });

      const row = await db('fixed_expenses').where({ id }).first();

      res.status(201).json({
        success: true,
        message: 'Gasto fixo cadastrado com sucesso',
        fixedExpense: toApiShape(row)
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  // Todos os gastos fixos ativos do usuário já com o status do mês atual
  // (pago / a vencer / atrasado) — extraído como helper reutilizável (usado
  // também pelo resumo financeiro consolidado de contas).
  static async getActiveWithStatus(userId) {
    const fixedExpenses = await db('fixed_expenses').where({ user_id: userId, ativo: true });

    const competencia = currentCompetencia();
    const today = new Date().getDate();

    return Promise.all(fixedExpenses.map(async (item) => {
      const launched = await db('transactions')
        .where({ recurrence_id: item.id, competencia })
        .first();

      let status = 'due';
      if (launched) {
        status = 'paid';
      } else if (item.dia_vencimento < today) {
        status = 'late';
      }

      return { ...toApiShape(item), status, competencia };
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

      await db('fixed_expenses').where({ id: fixedExpenseId, user_id: userId }).update({
        nome,
        valor: parseFloat(valor) || 0,
        categoria: categoria || 'Outros',
        dia_vencimento: Math.min(28, Math.max(1, parseInt(diaVencimento, 10) || 1)),
        icone: icone || '📌',
        atualizado_em: db.fn.now()
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

      await db('fixed_expenses').where({ id: fixedExpenseId, user_id: userId }).update({
        ativo: false,
        removido_em: db.fn.now()
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

      const fixedExpense = await db('fixed_expenses').where({ id: fixedExpenseId, user_id: userId }).first();
      if (!fixedExpense) {
        return res.status(404).json({ success: false, message: 'Gasto fixo não encontrado' });
      }
      const competencia = currentCompetencia();

      const already = await db('transactions')
        .where({ recurrence_id: fixedExpenseId, competencia })
        .first();

      if (already) {
        return res.status(409).json({ success: false, message: 'Este gasto fixo já foi lançado neste mês' });
      }

      const now = new Date();
      const dataHora = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${now.toLocaleTimeString('pt-BR')}`;

      const [transactionId] = await db('transactions').insert({
        user_id: userId,
        tipo: 'despesa',
        valor: fixedExpense.valor,
        descricao: fixedExpense.nome,
        categoria: fixedExpense.categoria || 'Outros',
        data_hora: dataHora,
        recurrence_id: fixedExpenseId,
        competencia
      });

      res.status(201).json({
        success: true,
        message: 'Gasto fixo lançado com sucesso',
        transaction: {
          id: transactionId,
          userId,
          tipo: 'despesa',
          valor: parseFloat(fixedExpense.valor),
          descricao: fixedExpense.nome,
          categoria: fixedExpense.categoria || 'Outros',
          dataHora,
          recurrenceId: fixedExpenseId,
          competencia
        }
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
}

module.exports = FixedExpenseController;
