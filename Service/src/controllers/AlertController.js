const { db } = require('../config/database');

function toApiShape(row) {
  return {
    id: row.id,
    userId: row.user_id,
    nome: row.nome,
    condicao: row.condicao,
    valor: parseFloat(row.valor) || 0,
    categoria: row.categoria,
    ativo: Boolean(row.ativo)
  };
}

function parseValorReais(valor) {
  return parseFloat(valor.toString().replace('R$', '').replace(',', '.'));
}

class AlertController {
  static async create(req, res) {
    try {
      const { userId, nome, condicao, valor, categoria } = req.body;

      if (!userId || !nome || !condicao || !valor || !categoria) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      const [{ id }] = await db('alerts').insert({
        user_id: userId,
        nome,
        condicao,
        valor: parseValorReais(valor),
        categoria
      }).returning('id');

      res.status(201).json({
        success: true,
        message: 'Alerta criado com sucesso',
        alertId: id
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  static async getUserAlerts(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID do usuário é obrigatório'
        });
      }

      const rows = await db('alerts').where({ user_id: userId, ativo: true });

      res.json({
        success: true,
        alerts: rows.map(toApiShape)
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        alerts: []
      });
    }
  }

  static async update(req, res) {
    try {
      const { alertId } = req.params;
      const { userId, nome, condicao, valor, categoria } = req.body;

      if (!userId || !nome || !condicao || !valor || !categoria) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      await db('alerts').where({ id: alertId, user_id: userId }).update({
        nome,
        condicao,
        valor: parseValorReais(valor),
        categoria,
        atualizado_em: db.fn.now()
      });

      res.json({
        success: true,
        message: 'Alerta atualizado com sucesso'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  static async delete(req, res) {
    try {
      const { alertId } = req.params;
      const { userId } = req.body;

      if (!alertId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'AlertId e userId são obrigatórios'
        });
      }

      await db('alerts').where({ id: alertId, user_id: userId }).del();

      res.json({
        success: true,
        message: 'Alerta excluído com sucesso'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  static async getNotifications(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID do usuário é obrigatório'
        });
      }

      const rows = await db('notifications')
        .where({ user_id: userId })
        .orderBy('disparado_em', 'desc')
        .limit(50);

      res.json({
        success: true,
        notifications: rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          alerteId: row.alert_id,
          nomeAlerta: row.nome_alerta,
          categoria: row.categoria,
          limite: parseFloat(row.limite) || 0,
          totalGasto: parseFloat(row.total_gasto) || 0,
          condicao: row.condicao,
          disparadoEm: row.disparado_em,
          lido: Boolean(row.lido)
        }))
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = AlertController;
