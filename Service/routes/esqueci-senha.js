const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

router.get('/', (req, res) => {
  res.render('esqueci-senha', { erro: null, tipo: null, link: null });
});

router.post('/', async (req, res) => {
  const { email } = req.body;

  try {
    // Verifica se o e-mail existe
    await admin.auth().getUserByEmail(email);

    // se o usuário existir, gera o link de redefinição
    const resetLink = await admin.auth().generatePasswordResetLink(email);
    console.log('Link de redefinição:', resetLink);

    // redireciona para outra página que exibe o link
    res.redirect(`/esqueci-senha/link-redefinicao?link=${encodeURIComponent(resetLink)}`);

  } catch (error) {
    console.error('Erro ao gerar link:', error);

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

// rota para exibir o link 
router.get('/link-redefinicao', (req, res) => {
  const { link } = req.query;
  res.render('link-redefinicao', { link });
});

module.exports = router