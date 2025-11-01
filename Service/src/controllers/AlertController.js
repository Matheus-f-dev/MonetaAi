const { db } = require('../config/firebase');

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

      const alertData = {
        nome,
        condicao,
        valor: parseFloat(valor.replace('R$', '').replace(',', '.')),
        categoria,
        criadoEm: new Date().toISOString(),
        ativo: true
      };

      const docRef = await db.collection('usuarios').doc(userId).collection('alerta').add(alertData);

      res.status(201).json({
        success: true,
        message: 'Alerta criado com sucesso',
        alertId: docRef.id
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

      const snapshot = await db.collection('usuarios').doc(userId).collection('alerta')
        .where('ativo', '==', true)
        .get();

      const alerts = [];
      snapshot.forEach(doc => {
        alerts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      res.json({
        success: true,
        alerts: alerts || []
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

      const alertData = {
        nome,
        condicao,
        valor: parseFloat(valor.toString().replace('R$', '').replace(',', '.')),
        categoria,
        atualizadoEm: new Date().toISOString()
      };

      await db.collection('usuarios').doc(userId).collection('alerta').doc(alertId).update(alertData);

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

      await db.collection('usuarios').doc(userId).collection('alerta').doc(alertId).delete();

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

      const snapshot = await db.collection('usuarios').doc(userId).collection('notificacoes')
        .orderBy('disparadoEm', 'desc')
        .limit(50)
        .get();

      const notifications = [];
      snapshot.forEach(doc => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });

      res.json({
        success: true,
        notifications
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