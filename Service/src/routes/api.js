const express = require('express');
const AuthController = require('../controllers/AuthController');
const TransactionController = require('../controllers/TransactionController');
const EmailController = require('../controllers/EmailController');
const AlertController = require('../controllers/AlertController');
const ProjecaoSaldoController = require('../controllers/ProjecaoSaldoController');

const router = express.Router();

// Rotas de autenticação
router.post('/cadastro', AuthController.register);
router.post('/login', AuthController.login);
router.get('/user/:userId', AuthController.getUserById);
router.post('/verificar-email', EmailController.verificarEmail);
router.post('/esqueci-senha', EmailController.enviarLinkRedefinicao);

// Rotas de transações
router.post('/transactions', TransactionController.create);
router.get('/transactions/:userId', TransactionController.getUserTransactions);
router.get('/balance/:userId', TransactionController.getUserBalance);
router.put('/transactions/:id', TransactionController.update);
router.delete('/transactions/:id', TransactionController.delete);

// Rotas de alertas
router.post('/alerts', AlertController.create);
router.get('/alerts/:userId', AlertController.getUserAlerts);
router.put('/alerts/:alertId', AlertController.update);
router.delete('/alerts/:alertId', AlertController.delete);

// Rotas de projeção de saldo
router.get('/projecao-saldo', ProjecaoSaldoController.obterProjecaoSaldo);
router.post('/projecao-saldo/:meses', ProjecaoSaldoController.calcularProjecao);

// Debug route
router.get('/test', (req, res) => {
  res.json({ message: 'API funcionando' });
});

module.exports = router;