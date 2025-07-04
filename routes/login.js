const express = require('express');
const router = express.Router();

// Página de login
router.get('/', (req, res) => {
  res.render('login', { erro: null, tipo: null});
});

// verificando se o email existe
router.post('/verificar-email', async (req, res) => {
  const { email } = req.body;
  const auth = req.app.locals.auth;

  try {
    await auth.getUserByEmail(email);
    return res.status(200).json({ ok: true }); // o e-mail existe
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      return res.status(404).json({ erro: '❌ E-mail não cadastrado. Cadastre-se.' });
    }

    console.error('Erro ao verificar e-mail:', err);
    return res.status(500).json({ erro: 'Erro ao verificar e-mail. Tente novamente.' });
  }
});

// rota de login
router.post('/', async (req, res) => {
  const { email, senha } = req.body;
  const auth = req.app.locals.auth;

  try {
    const user = await auth.getUserByEmail(email);

    if (!user) {
      return res.render('login', { erro: '❌ E-mail não cadastrado. Cadastre-se.', tipo: 'erro' });
    }

    // aqui seria a validaçao da senha, porem so com react

    // entao irei validar (por enquanto) so o email, ai vai exibir uma mensagem
    return res.render('login', { erro: '✅ Login efetuado. Seja bem-vindo!', tipo: 'sucesso'});

  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      return res.render('login', { erro: '❌ E-mail não cadastrado. Cadastre-se.', tipo: 'erro' });
    }

    console.error('Erro ao autenticar:', err);
    return res.render('login', { erro: '❌ Erro ao verificar login.', tipo: 'erro'});
  }
});

module.exports = router;
