const User = require('../models/User');

class EmailController {
  // Checagem ao vivo (onBlur no cadastro) se o e-mail já está cadastrado.
  static async verificarEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email é obrigatório.'
        });
      }

      const user = await User.findByEmail(email);

      if (user) {
        return res.json({
          success: false,
          exists: true,
          message: 'Este email já está em uso.'
        });
      }

      res.json({
        success: true,
        exists: false,
        message: 'Email disponível.'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar email.'
      });
    }
  }
}

module.exports = EmailController;
