const { db } = require('../config/firebase');

class AlertController {
  static async create(req, res) {
    try {
      const { userId, nome, condicao, valor } = req.body;

      if (!userId || !nome || !condicao || !valor) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      const alertData = {
        nome,
        condicao,
        valor: parseFloat(valor.replace('R$', '').replace(',', '.')),
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
      console.error('Erro ao criar alerta:', error);
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

      console.log('Buscando alertas para userId:', userId);
      
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

      console.log('Alertas encontrados:', alerts.length);

      res.json({
        success: true,
        alerts: alerts || []
      });

    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
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
      const { userId, nome, condicao, valor } = req.body;

      if (!userId || !nome || !condicao || !valor) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      const alertData = {
        nome,
        condicao,
        valor: parseFloat(valor.toString().replace('R$', '').replace(',', '.')),
        atualizadoEm: new Date().toISOString()
      };

      await db.collection('usuarios').doc(userId).collection('alerta').doc(alertId).update(alertData);

      res.json({
        success: true,
        message: 'Alerta atualizado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao atualizar alerta:', error);
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
      console.error('Erro ao excluir alerta:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = AlertController;