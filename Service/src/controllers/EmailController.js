const { auth } = require('../config/firebase');

class EmailController {
  static async verificarEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email é obrigatório.' 
        });
      }

      await auth.getUserByEmail(email);
      
      res.json({
        success: false,
        exists: true,
        message: 'Este email já está em uso.'
      });

    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        res.json({
          success: true,
          exists: false,
          message: 'Email disponível.'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro ao verificar email.'
        });
      }
    }
  }
}

module.exports = EmailController;