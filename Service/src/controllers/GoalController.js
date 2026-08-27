const { db } = require('../config/database');
const AccountController = require('./AccountController');

function toApiShape(row) {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    nome: row.nome,
    valorAlvo: parseFloat(row.valor_alvo) || 0,
    prazo: row.prazo,
    ativo: Boolean(row.ativo)
  };
}

class GoalController {
  static async create(req, res) {
    try {
      // userId sempre vem do token — nunca do body.
      const userId = req.user.uid;
      const { accountId, nome, valorAlvo, prazo } = req.body;

      if (!userId || !nome || !valorAlvo) {
        return res.status(400).json({ success: false, message: 'nome e valorAlvo são obrigatórios' });
      }

      // Se veio accountId, confirma que a conta é do próprio usuário —
      // senão dava pra vincular a meta na conta de outra pessoa só
      // adivinhando o id.
      if (accountId) {
        const conta = await db('accounts').where({ id: accountId, user_id: userId }).first();
        if (!conta) {
          return res.status(404).json({ success: false, message: 'Conta vinculada não encontrada' });
        }
      }

      const [{ id }] = await db('goals').insert({
        user_id: userId,
        account_id: accountId || null,
        nome,
        valor_alvo: parseFloat(valorAlvo) || 0,
        prazo: prazo || null
      }).returning('id');

      const row = await db('goals').where({ id }).first();

      res.status(201).json({
        success: true,
        message: 'Meta criada com sucesso',
        goal: toApiShape(row)
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  static async getUserGoals(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
      }

      const rows = await db('goals').where({ user_id: userId, ativo: true });

      res.json({ success: true, goals: rows.map(toApiShape) });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor', goals: [] });
    }
  }

  static async update(req, res) {
    try {
      const { goalId } = req.params;
      const userId = req.user.uid;
      const { accountId, nome, valorAlvo, prazo } = req.body;

      if (!userId || !nome || !valorAlvo) {
        return res.status(400).json({ success: false, message: 'nome e valorAlvo são obrigatórios' });
      }

      if (accountId) {
        const conta = await db('accounts').where({ id: accountId, user_id: userId }).first();
        if (!conta) {
          return res.status(404).json({ success: false, message: 'Conta vinculada não encontrada' });
        }
      }

      await db('goals').where({ id: goalId, user_id: userId }).update({
        account_id: accountId || null,
        nome,
        valor_alvo: parseFloat(valorAlvo) || 0,
        prazo: prazo || null,
        atualizado_em: db.fn.now()
      });

      res.json({ success: true, message: 'Meta atualizada com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  static async delete(req, res) {
    try {
      const { goalId } = req.params;
      const userId = req.user.uid;

      if (!goalId) {
        return res.status(400).json({ success: false, message: 'goalId é obrigatório' });
      }

      await db('goals').where({ id: goalId, user_id: userId }).update({ ativo: false });

      res.json({ success: true, message: 'Meta removida com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  // GET /api/goals/:userId/progress -- reaproveita
  // AccountController.getAccountsWithBalances (mesmo cálculo de saldo usado
  // em todo o resto do app) em vez de somar transações de novo aqui.
  // Meta sem accountId vinculado usa o saldo total de todas as contas
  // (patrimônio geral) como base do progresso.
  static async getProgress(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
      }

      const goals = await db('goals').where({ user_id: userId, ativo: true });
      const { accounts } = await AccountController.getAccountsWithBalances(userId);
      const saldoTotal = accounts.reduce((sum, a) => sum + a.saldoAtual, 0);

      const progresso = goals.map((goal) => {
        const valorAlvo = parseFloat(goal.valor_alvo) || 0;
        const saldoAtual = goal.account_id
          ? (accounts.find((a) => a.id === goal.account_id)?.saldoAtual ?? 0)
          : saldoTotal;

        return {
          ...toApiShape(goal),
          saldoAtual,
          percentualAtingido: valorAlvo > 0 ? Math.round((saldoAtual / valorAlvo) * 10000) / 100 : 0,
          concluida: saldoAtual >= valorAlvo
        };
      });

      res.json({ success: true, progresso });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor', progresso: [] });
    }
  }
}

module.exports = GoalController;
