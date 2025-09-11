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
        alerts
      });

    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = AlertController;