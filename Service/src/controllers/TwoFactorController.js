const qrcode = require('qrcode');
const AuthService = require('../services/AuthService');

class TwoFactorController {
  // POST /api/2fa/setup -- gera um secret novo e o QR code pra escanear.
  // userId sempre de req.user.uid (rota autenticada). totp_ativo continua
  // false até o /confirm provar que o app autenticador foi configurado certo.
  static async setup(req, res) {
    try {
      const userId = req.user.uid;
      const { secret, otpauthUrl } = await AuthService.setupTotp(userId);
      const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

      res.json({
        success: true,
        secret,
        qrCode: qrCodeDataUrl
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro ao configurar 2FA' });
    }
  }

  // POST /api/2fa/confirm -- primeiro código gerado pelo app autenticador,
  // prova que o setup funcionou. Só aqui totp_ativo vira true.
  static async confirm(req, res) {
    try {
      const userId = req.user.uid;
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ success: false, message: 'code é obrigatório' });
      }

      await AuthService.confirmTotp(userId, code);
      res.json({ success: true, message: '2FA ativado com sucesso' });

    } catch (error) {
      const status = error.code === 'TOTP_NOT_SETUP' ? 400 : 400;
      res.status(status).json({ success: false, message: error.message || 'Erro ao confirmar 2FA' });
    }
  }

  // POST /api/2fa/disable -- exige o código TOTP atual, não só o JWT
  // (ver AuthService.disableTotp pra razão).
  static async disable(req, res) {
    try {
      const userId = req.user.uid;
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ success: false, message: 'code é obrigatório' });
      }

      await AuthService.disableTotp(userId, code);
      res.json({ success: true, message: '2FA desativado com sucesso' });

    } catch (error) {
      res.status(400).json({ success: false, message: error.message || 'Erro ao desativar 2FA' });
    }
  }
}

module.exports = TwoFactorController;
