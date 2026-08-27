const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async enviarLinkRedefinicao(email, resetLink) {
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

    return await this.transporter.sendMail(mailOptions);
  }

  // alerta: linha da tabela `alerts` (nome, categoria, condicao, valor) +
  // totalGasto calculado pelo AlertObserver no momento em que disparou.
  async enviarAlertaDisparado(email, alerta) {
    const valorLimite = parseFloat(alerta.valor).toFixed(2).replace('.', ',');
    const totalGasto = parseFloat(alerta.totalGasto).toFixed(2).replace('.', ',');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Alerta disparado: ${alerta.nome} - Moneta`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🚨 Alerta disparado - Moneta</h2>
          <p>Olá,</p>
          <p>O alerta <strong>${alerta.nome}</strong> foi disparado:</p>
          <p style="background-color: #fff3cd; padding: 12px; border-radius: 5px;">
            Categoria <strong>${alerta.categoria}</strong> ${alerta.condicao.toLowerCase()} R$ ${valorLimite}.<br>
            Total gasto no mês: <strong>R$ ${totalGasto}</strong>
          </p>
          <p>Atenciosamente,<br>Equipe Moneta</p>
        </div>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }
}

module.exports = EmailService;