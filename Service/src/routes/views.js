const express = require('express');
const router = express.Router();
const TransactionViewController = require('../controllers/views/TransactionViewController');

// As views EJS de autenticação (login/cadastro/completar-perfil) foram
// removidas — duplicavam (mal) o fluxo real de auth da API usado pela SPA
// em React, e o login dessa versão EJS não conferia senha nenhuma (só
// existência do e-mail). O produto de verdade é a SPA em Client/Front.

// Rotas de transações (páginas EJS legadas, sem dependência de dados)
router.get('/historico-page', TransactionViewController.renderHistorico);
router.get('/projecao-saldo-page', TransactionViewController.renderProjecaoSaldo);

// Rota raiz
router.get('/', (req, res) => {
  res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
});

module.exports = router;
