const express = require('express');
const router = express.Router();
const AuthViewController = require('../controllers/views/AuthViewController');
const TransactionViewController = require('../controllers/views/TransactionViewController');

// Rotas de autenticação
router.get('/login', AuthViewController.renderLogin);
router.post('/login/verificar-email', AuthViewController.verifyEmail);
router.post('/login', AuthViewController.login);

router.get('/cadastro', AuthViewController.renderCadastro);
router.post('/cadastro', AuthViewController.cadastro);

router.get('/cadastro-concluido', AuthViewController.renderCadastroConcluido);
router.get('/esqueci-senha', AuthViewController.renderEsqueciSenha);

// Rotas de transações
router.get('/historico-page', TransactionViewController.renderHistorico);

// Rota raiz
router.get('/', (req, res) => {
  res.redirect('/login');
});

module.exports = router;