const AuthService = require('../services/AuthService');

class AuthViewController {
  constructor() {
    this.authService = new AuthService();
  }

  async login(req, res) {
    try {
      const { email, senha } = req.body;
      const result = await this.authService.login(email, senha);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  async register(req, res) {
    try {
      const result = await this.authService.register(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await this.authService.resetPassword(email);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { email } = req.body;
      const result = await this.authService.verifyEmail(email);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
}

module.exports = AuthViewController;