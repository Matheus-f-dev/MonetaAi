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
    diaRecebimento: row.dia_recebimento,
    icone: row.icone,
    ativo: Boolean(row.ativo)
  };
}

class FixedIncomeController {
  static async create(req, res) {
    try {
      // userId sempre vem do token — nunca do body (senão dava pra criar
      // receita fixa em nome de outro usuário).
      const userId = req.user.uid;
      const { nome, valor, categoria, diaRecebimento, icone } = req.body;

      if (!userId || !nome || !valor || !diaRecebimento) {
        return res.status(400).json({
          success: false,
          message: 'userId, nome, valor e diaRecebimento são obrigatórios'
        });
      }

      const [{ id }] = await db('fixed_incomes').insert({
        user_id: userId,
        nome,
        valor: parseFloat(valor) || 0,
        categoria: categoria || 'Renda',
        dia_recebimento: Math.min(28, Math.max(1, parseInt(diaRecebimento, 10) || 1)),
        icone: icone || '💰'
      }).returning('id');

      const row = await db('fixed_incomes').where({ id }).first();

      res.status(201).json({
        success: true,
        message: 'Receita fixa cadastrada com sucesso',
        fixedIncome: toApiShape(row)
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  // Todas as receitas fixas ativas do usuário já com o status do mês atual
  // (recebido / a receber / atrasado) — mesmo padrão de
  // FixedExpenseController.getActiveWithStatus.
  static async getActiveWithStatus(userId) {
    const fixedIncomes = await db('fixed_incomes').where({ user_id: userId, ativo: true });

    const competencia = currentCompetencia();
    const today = new Date().getDate();

    return Promise.all(fixedIncomes.map(async (item) => {
      const launched = await db('transactions')
        .where({ income_recurrence_id: item.id, competencia })
        .first();

      let status = 'due';
      if (launched) {
        status = 'paid';
      } else if (item.dia_recebimento < today) {
        status = 'late';
      }

      return { ...toApiShape(item), status, competencia };
    }));
  }

  static async getUserFixedIncomes(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
      }

      const withStatus = await FixedIncomeController.getActiveWithStatus(userId);

      res.json({ success: true, fixedIncomes: withStatus });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor', fixedIncomes: [] });
    }
  }

  static async update(req, res) {
    try {
      const { fixedIncomeId } = req.params;
      // userId vem do token — mesma razão do create() acima.
      const userId = req.user.uid;
      const { nome, valor, categoria, diaRecebimento, icone } = req.body;

      if (!userId || !nome || !valor || !diaRecebimento) {
        return res.status(400).json({ success: false, message: 'Campos obrigatórios ausentes' });
      }

      await db('fixed_incomes').where({ id: fixedIncomeId, user_id: userId }).update({
        nome,
        valor: parseFloat(valor) || 0,
        categoria: categoria || 'Renda',
        dia_recebimento: Math.min(28, Math.max(1, parseInt(diaRecebimento, 10) || 1)),
        icone: icone || '💰',
        atualizado_em: db.fn.now()
      });

      res.json({ success: true, message: 'Receita fixa atualizada com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  static async delete(req, res) {
    try {
      const { fixedIncomeId } = req.params;
      // userId vem do token — mesma razão do create() acima.
      const userId = req.user.uid;

      if (!fixedIncomeId) {
        return res.status(400).json({ success: false, message: 'fixedIncomeId é obrigatório' });
      }

      await db('fixed_incomes').where({ id: fixedIncomeId, user_id: userId }).update({
        ativo: false,
        removido_em: db.fn.now()
      });

      res.json({ success: true, message: 'Receita fixa removida com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  // Lança a receita fixa como uma transação normal no mês corrente (evita
  // duplicar se já lançada) — espelha FixedExpenseController.lancar, só que
  // tipo: 'receita' e ligado por income_recurrence_id em vez de recurrence_id.
  static async lancar(req, res) {
    try {
      const { fixedIncomeId } = req.params;
      // userId vem do token — mesma razão do create() acima.
      const userId = req.user.uid;

      if (!fixedIncomeId) {
        return res.status(400).json({ success: false, message: 'fixedIncomeId é obrigatório' });
      }

      const fixedIncome = await db('fixed_incomes').where({ id: fixedIncomeId, user_id: userId }).first();
      if (!fixedIncome) {
        return res.status(404).json({ success: false, message: 'Receita fixa não encontrada' });
      }
      const competencia = currentCompetencia();

      const already = await db('transactions')
        .where({ income_recurrence_id: fixedIncomeId, competencia })
        .first();

      if (already) {
        return res.status(409).json({ success: false, message: 'Esta receita fixa já foi lançada neste mês' });
      }

      const now = new Date();
      const dataHora = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${now.toLocaleTimeString('pt-BR')}`;

      const [{ id: transactionId }] = await db('transactions').insert({
        user_id: userId,
        tipo: 'receita',
        valor: fixedIncome.valor,
        descricao: fixedIncome.nome,
        categoria: fixedIncome.categoria || 'Renda',
        data_hora: dataHora,
        income_recurrence_id: fixedIncomeId,
        competencia
      }).returning('id');

      res.status(201).json({
        success: true,
        message: 'Receita fixa lançada com sucesso',
        transaction: {
          id: transactionId,
          userId,
          tipo: 'receita',
          valor: parseFloat(fixedIncome.valor),
          descricao: fixedIncome.nome,
          categoria: fixedIncome.categoria || 'Renda',
          dataHora,
          incomeRecurrenceId: fixedIncomeId,
          competencia
        }
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
}

module.exports = FixedIncomeController;
