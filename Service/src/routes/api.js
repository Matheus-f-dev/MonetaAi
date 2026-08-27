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
const FixedIncomeController = require('../controllers/FixedIncomeController');
const ReportExportController = require('../controllers/ReportExportController');
const TransactionImportController = require('../controllers/TransactionImportController');
const BudgetController = require('../controllers/BudgetController');
const SplitController = require('../controllers/SplitController');
const AccountController = require('../controllers/AccountController');
const { authenticateToken, ensureOwnUser } = require('../middleware/auth');
const { authLimiter, apiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// ── Rotas públicas (sem token — é aqui que ele é obtido). authLimiter é
// bem mais apertado que o resto da API: são as rotas naturais de
// brute-force/enumeração de e-mail (login, cadastro, reset de senha). ──
router.post('/cadastro', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/verificar-email', authLimiter, EmailController.verificarEmail);
router.post('/esqueci-senha', authLimiter, AuthController.esqueciSenha);
router.post('/redefinir-senha', authLimiter, AuthController.redefinirSenha);
router.get('/test', (req, res) => res.json({ message: 'API funcionando' }));

// ── A partir daqui, toda rota exige um token válido. Antes nenhuma rota
// exigia nada — qualquer request que soubesse um userId lia/escrevia os
// dados dele. Isso fecha esse buraco. ──
router.use(apiLimiter);
router.use(authenticateToken);

router.get('/user/:userId', ensureOwnUser(), AuthController.getUserById);

// Rotas de transações
router.post('/transactions', TransactionController.create);
router.get('/transactions/:userId', ensureOwnUser(), TransactionController.getUserTransactions);
router.get('/balance/:userId', ensureOwnUser(), TransactionController.getUserBalance);
router.get('/chart-data/:userId', ensureOwnUser(), TransactionController.getChartData);
router.get('/percentage-change/:userId', ensureOwnUser(), TransactionController.getPercentageChange);
router.put('/transactions/:id', TransactionController.update);
router.delete('/transactions/:id', TransactionController.delete);
router.post('/transactions/import/preview', TransactionImportController.preview);
router.post('/transactions/import/confirm', TransactionImportController.confirm);

// Rotas de alertas
router.post('/alerts', AlertController.create);
router.get('/alerts/:userId', ensureOwnUser(), AlertController.getUserAlerts);
router.put('/alerts/:alertId', AlertController.update);
router.delete('/alerts/:alertId', AlertController.delete);
router.get('/notifications/:userId', ensureOwnUser(), AlertController.getNotifications);

// Rotas de projeção de saldo
router.get('/projecao-saldo', ProjecaoSaldoController.obterProjecaoSaldo);
router.get('/projecao-saldo/:userId/:meses', ensureOwnUser(), ProjecaoSaldoController.calcularProjecao);
router.get('/projecao-saldo/:meses', ProjecaoSaldoController.calcularProjecao);
router.post('/projecao-saldo/:meses', ProjecaoSaldoController.calcularProjecao);

// Rotas de impacto financeiro
router.post('/impacto-financeiro', ImpactoFinanceiroController.calcularImpacto);

// Rotas de receitas
router.get('/receitas/:userId', ensureOwnUser(), ReceitasController.obterAnaliseReceitas);

// Rotas de economias
router.get('/economias/:userId', ensureOwnUser(), EconomiasController.obterAnaliseEconomias);

// Rotas de tendências
router.get('/tendencias/:userId', ensureOwnUser(), TendenciasController.obterAnaliseTendencias);

// Rotas de cartões
router.post('/cards', CardController.create);
router.get('/cards/:userId', ensureOwnUser(), CardController.getUserCards);
router.get('/cards/:userId/:cardId/invoice', ensureOwnUser(), CardController.getInvoice);
router.put('/cards/:cardId', CardController.update);
router.delete('/cards/:cardId', CardController.delete);

// Rotas de gastos fixos
router.post('/fixed-expenses', FixedExpenseController.create);
router.get('/fixed-expenses/:userId', ensureOwnUser(), FixedExpenseController.getUserFixedExpenses);
router.put('/fixed-expenses/:fixedExpenseId', FixedExpenseController.update);
router.delete('/fixed-expenses/:fixedExpenseId', FixedExpenseController.delete);
router.post('/fixed-expenses/:fixedExpenseId/lancar', FixedExpenseController.lancar);

// Rotas de receitas fixas (mesmo padrão de gastos fixos)
router.post('/fixed-incomes', FixedIncomeController.create);
router.get('/fixed-incomes/:userId', ensureOwnUser(), FixedIncomeController.getUserFixedIncomes);
router.put('/fixed-incomes/:fixedIncomeId', FixedIncomeController.update);
router.delete('/fixed-incomes/:fixedIncomeId', FixedIncomeController.delete);
router.post('/fixed-incomes/:fixedIncomeId/lancar', FixedIncomeController.lancar);

// Rotas de divisão de despesas (split entre pessoas)
router.get('/split/:userId/people', ensureOwnUser(), SplitController.getPeople);
router.put('/split/transactions/:transactionId/participants/:participantIndex', SplitController.setParticipantPaid);

// Rotas de contas e carteiras
router.post('/accounts', AccountController.create);
router.get('/accounts/:userId', ensureOwnUser(), AccountController.getUserAccounts);
router.get('/accounts/:userId/resumo', ensureOwnUser(), AccountController.getResumo);
router.post('/accounts/:userId/transfer', ensureOwnUser(), AccountController.transfer);
router.put('/accounts/:accountId', AccountController.update);
router.delete('/accounts/:accountId', AccountController.delete);

// Rotas de orçamento por categoria
router.post('/budgets', BudgetController.create);
router.get('/budgets/:userId', ensureOwnUser(), BudgetController.getUserBudgets);
router.get('/budgets/:userId/status', ensureOwnUser(), BudgetController.getStatus);
router.put('/budgets/:budgetId', BudgetController.update);
router.delete('/budgets/:budgetId', BudgetController.delete);

// Rota de exportação de relatórios (CSV/PDF)
router.get('/relatorios/:userId/export', ensureOwnUser(), ReportExportController.export);

// Rota do agente Moneta AI
router.post('/agent/chat', AgentController.chat);

module.exports = router;