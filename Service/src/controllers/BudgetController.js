const { db } = require('../config/database');
const { totalGastoNoMes } = require('../services/CategorySpendingService');

function toApiShape(row) {
  return {
    id: row.id,
    userId: row.user_id,
    categoria: row.categoria,
    limiteMensal: parseFloat(row.limite_mensal) || 0,
    ativo: Boolean(row.ativo)
  };
}

class BudgetController {
  static async create(req, res) {
    try {
      // userId sempre vem do token — nunca do body (mesmo padrão de
      // AlertController).
      const userId = req.user.uid;
      const { categoria, limiteMensal } = req.body;

      if (!userId || !categoria || !limiteMensal) {
        return res.status(400).json({
          success: false,
          message: 'categoria e limiteMensal são obrigatórios'
        });
      }

      const [{ id }] = await db('budgets').insert({
        user_id: userId,
        categoria,
        limite_mensal: parseFloat(limiteMensal) || 0
      }).returning('id');

      const row = await db('budgets').where({ id }).first();

      res.status(201).json({
        success: true,
        message: 'Orçamento criado com sucesso',
        budget: toApiShape(row)
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  static async getUserBudgets(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
      }

      const rows = await db('budgets').where({ user_id: userId, ativo: true });

      res.json({ success: true, budgets: rows.map(toApiShape) });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor', budgets: [] });
    }
  }

  static async update(req, res) {
    try {
      const { budgetId } = req.params;
      const userId = req.user.uid;
      const { categoria, limiteMensal } = req.body;

      if (!userId || !categoria || !limiteMensal) {
        return res.status(400).json({ success: false, message: 'categoria e limiteMensal são obrigatórios' });
      }

      await db('budgets').where({ id: budgetId, user_id: userId }).update({
        categoria,
        limite_mensal: parseFloat(limiteMensal) || 0,
        atualizado_em: db.fn.now()
      });

      res.json({ success: true, message: 'Orçamento atualizado com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  static async delete(req, res) {
    try {
      const { budgetId } = req.params;
      const userId = req.user.uid;

      if (!budgetId) {
        return res.status(400).json({ success: false, message: 'budgetId é obrigatório' });
      }

      await db('budgets').where({ id: budgetId, user_id: userId }).update({ ativo: false });

      res.json({ success: true, message: 'Orçamento removido com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  // GET /api/budgets/:userId/status -- quanto já foi gasto por categoria
  // no mês corrente vs o limite de cada orçamento ativo. Reaproveita
  // CategorySpendingService.totalGastoNoMes (mesma agregação usada pelo
  // AlertObserver pra disparar alerta), não recalcula nada na mão de novo.
  static async getStatus(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
      }

      const budgets = await db('budgets').where({ user_id: userId, ativo: true });

      const status = await Promise.all(budgets.map(async (budget) => {
        const gasto = await totalGastoNoMes(userId, budget.categoria);
        const limite = parseFloat(budget.limite_mensal) || 0;

        return {
          ...toApiShape(budget),
          gastoNoMes: gasto,
          percentualUsado: limite > 0 ? Math.round((gasto / limite) * 10000) / 100 : 0,
          estourado: gasto > limite
        };
      }));

      res.json({ success: true, status });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor', status: [] });
    }
  }
}

module.exports = BudgetController;
