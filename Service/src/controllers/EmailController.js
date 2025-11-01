const { auth } = require('../config/firebase');
const nodemailer = require('nodemailer');
require('dotenv').config();

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

  static async enviarLinkRedefinicao(req, res) {
    try {
      const { email } = req.body;
      console.log('Recebendo requisição para:', email);

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email é obrigatório.'
        });
      }

      // Verifica se o usuário existe
      console.log('Verificando se usuário existe...');
      await auth.getUserByEmail(email);
      console.log('Usuário encontrado');

      // Gera link de redefinição
      console.log('Gerando link de redefinição...');
      const resetLink = await auth.generatePasswordResetLink(email);
      console.log('Link gerado:', resetLink);

      // Envia email
      console.log('Enviando email...');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Redefinição de senha - Moneta',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Redefinição de senha - Moneta</h2>
            <p>Olá,</p>
            <p>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:</p>
            <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Redefinir Senha</a>
            <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
            <p>Atenciosamente,<br>Equipe Moneta</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Email enviado com sucesso');

      res.json({
        success: true,
        message: 'Link de redefinição enviado para seu email.'
      });

    } catch (error) {
      console.error('Erro detalhado:', error);
      
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({
          success: false,
          message: 'Email não encontrado no sistema.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro ao enviar link de redefinição: ' + error.message
      });
    }
  }
}

module.exports = EmailController;