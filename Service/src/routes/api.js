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
const AgentController = require('../agent/AgentController');
const CardController = require('../controllers/CardController');
const FixedExpenseController = require('../controllers/FixedExpenseController');
const SplitController = require('../controllers/SplitController');
const AccountController = require('../controllers/AccountController');

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

// Rotas de cartões
router.post('/cards', CardController.create);
router.get('/cards/:userId', CardController.getUserCards);
router.get('/cards/:userId/:cardId/invoice', CardController.getInvoice);
router.put('/cards/:cardId', CardController.update);
router.delete('/cards/:cardId', CardController.delete);

// Rotas de gastos fixos
router.post('/fixed-expenses', FixedExpenseController.create);
router.get('/fixed-expenses/:userId', FixedExpenseController.getUserFixedExpenses);
router.put('/fixed-expenses/:fixedExpenseId', FixedExpenseController.update);
router.delete('/fixed-expenses/:fixedExpenseId', FixedExpenseController.delete);
router.post('/fixed-expenses/:fixedExpenseId/lancar', FixedExpenseController.lancar);

// Rotas de divisão de despesas (split entre pessoas)
router.get('/split/:userId/people', SplitController.getPeople);
router.put('/split/transactions/:transactionId/participants/:participantIndex', SplitController.setParticipantPaid);

// Rotas de contas e carteiras
router.post('/accounts', AccountController.create);
router.get('/accounts/:userId', AccountController.getUserAccounts);
router.get('/accounts/:userId/resumo', AccountController.getResumo);
router.post('/accounts/:userId/transfer', AccountController.transfer);
router.put('/accounts/:accountId', AccountController.update);
router.delete('/accounts/:accountId', AccountController.delete);

// Rota do agente Moneta AI
router.post('/agent/chat', AgentController.chat);

// Debug route
router.get('/test', (req, res) => {
  res.json({ message: 'API funcionando' });
});

module.exports = router;