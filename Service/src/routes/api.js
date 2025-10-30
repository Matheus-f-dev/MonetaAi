const express = require('express');
const AuthController = require('../controllers/AuthController');
const TransactionController = require('../controllers/TransactionController');
const EmailController = require('../controllers/EmailController');
const AlertController = require('../controllers/AlertController');
const ProjecaoSaldoController = require('../controllers/ProjecaoSaldoController');
const ImpactoFinanceiroController = require('../controllers/ImpactoFinanceiroController');
const ReceitasController = require('../controllers/ReceitasController');
const EconomiasController = require('../controllers/EconomiasController');
const TendenciasController = require('../controllers/TendenciasController');

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
router.get('/chart-data/:userId', TransactionController.getChartData);
router.get('/percentage-change/:userId', TransactionController.getPercentageChange);
router.put('/transactions/:id', TransactionController.update);
router.delete('/transactions/:id', TransactionController.delete);

// Rotas de alertas
router.post('/alerts', AlertController.create);
router.get('/alerts/:userId', AlertController.getUserAlerts);
router.put('/alerts/:alertId', AlertController.update);
router.delete('/alerts/:alertId', AlertController.delete);
router.get('/notifications/:userId', AlertController.getNotifications);

// Rotas de projeção de saldo
router.get('/projecao-saldo', ProjecaoSaldoController.obterProjecaoSaldo);
router.get('/projecao-saldo/:userId/:meses', ProjecaoSaldoController.calcularProjecao);
router.get('/projecao-saldo/:meses', ProjecaoSaldoController.calcularProjecao);
router.post('/projecao-saldo/:meses', ProjecaoSaldoController.calcularProjecao);

// Rotas de impacto financeiro
router.post('/impacto-financeiro', ImpactoFinanceiroController.calcularImpacto);

// Rotas de receitas
router.get('/receitas/:userId', ReceitasController.obterAnaliseReceitas);

// Rotas de economias
router.get('/economias/:userId', EconomiasController.obterAnaliseEconomias);

// Rotas de tendências
router.get('/tendencias/:userId', TendenciasController.obterAnaliseTendencias);

// Debug route
router.get('/test', (req, res) => {
  res.json({ message: 'API funcionando' });
});

module.exports = router;