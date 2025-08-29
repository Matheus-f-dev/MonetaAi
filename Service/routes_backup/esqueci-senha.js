const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
require('dotenv').config(); 


const transporter = nodemailer.createTransport({
  service: 'gmail', // pode colcar outros servicos
  auth: {
    user: process.env.EMAIL_USER, // email e senha
    pass: process.env.EMAIL_PASS  // moneta no arquivo .env
  }
});


router.get('/', (req, res) => {
  res.render('esqueci-senha', { erro: null, tipo: null, link: null });
});

// recebe email e envia link de redefinicao
router.post('/', async (req, res) => {
  const { email } = req.body;

  try {
    // verifica se o usuario existe no Firebase
    await admin.auth().getUserByEmail(email);

    const resetLink = await admin.auth().generatePasswordResetLink(email);
    console.log(`Link de redefinição de senha gerado para ${email}: ${resetLink}`);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email, // qualquer e-mail digitado pelo usuário
      subject: 'Redefinição de senha - Moneta ',
      html: `<p>Olá</p>
             <p>Clique no link abaixo para redefinir sua senha:</p>
             <a href="${resetLink}" target="_blank">${resetLink}</a>
             <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
             <p>Equipe Moneta</p>`
    };

    await transporter.sendMail(mailOptions);

    res.render('esqueci-senha', {
      erro: 'Link enviado por e-mail com sucesso!',
      tipo: 'sucesso',
      link: resetLink // link para teste
    });

  } catch (error) {
    console.error('Erro ao gerar link de redefinição ou enviar e-mail:', error);

    let mensagem = 'Erro inesperado. Tente novamente.';
    if (error.code === 'auth/user-not-found') {
      mensagem = 'E-mail não encontrado no sistema.';
    }

    res.render('esqueci-senha', {
      erro: mensagem,
      tipo: 'erro',
      link: null
    });
  }
});

module.exports = router;
