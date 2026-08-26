const { db } = require('../config/database');
const crypto = require('crypto');
const Account = require('../models/Account');
const TransactionFactory = require('../services/TransactionFactory');
const CardController = require('./CardController');
const FixedExpenseController = require('./FixedExpenseController');

function nowDataHora() {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${now.toLocaleTimeString('pt-BR')}`;
}

class AccountController {
  // Busca as contas ativas do usuário já com o saldo atual calculado
  // (saldoInicial + soma assinada das transações daquela conta). Transações
  // sem account_id (histórico antigo, lançamentos do bot do WhatsApp) caem
  // na conta principal — sem migração manual, ela absorve tudo que não tem
  // dono explícito.
  static async getAccountsWithBalances(userId) {
    let accounts = await db('accounts').where({ user_id: userId, ativo: true });

    // Nenhuma conta ainda: provisiona a Conta Principal. Feito dentro de uma
    // transação (checa de novo por dentro) pra não criar duas "Conta
    // Principal" quando duas requisições chegam ao mesmo tempo (o mesmo bug
    // de corrida já resolvido uma vez na versão Firestore — mesma correção,
    // agora com transação de banco de verdade).
    if (accounts.length === 0) {
      accounts = await db.transaction(async (trx) => {
        // Trava a própria linha do usuário primeiro — como o `accounts`
        // ainda não tem a linha que a corrida está disputando, um SELECT...
        // FOR UPDATE nele não travaria nada (não existe o que travar).
        // Travando `users` (que já existe, garantido), a segunda
        // requisição concorrente espera a primeira terminar e commitar
        // antes de conferir de novo — aí já encontra a conta criada.
        await trx('users').where({ id: userId }).forUpdate();

        const recheck = await trx('accounts').where({ user_id: userId, ativo: true });
        if (recheck.length > 0) return recheck;

        const principal = new Account({ userId, nome: 'Conta Principal', tipo: 'corrente', saldoInicial: 0, principal: true });
        const [id] = await trx('accounts').insert({ user_id: userId, ...principal.toPersistence() });
        return trx('accounts').where({ id });
      });
    }

    const principalAccount = accounts.find((a) => a.principal) || accounts[0];

    const transactions = await db('transactions').where({ user_id: userId });
    const byAccount = {};
    transactions.forEach((t) => {
      const key = t.account_id || '__sem_conta__';
      if (!byAccount[key]) byAccount[key] = [];
      byAccount[key].push(t);
    });

    const withBalances = accounts.map((account) => {
      const own = byAccount[account.id] || [];
      const legacy = account.id === principalAccount.id ? (byAccount['__sem_conta__'] || []) : [];
      const sum = [...own, ...legacy].reduce((acc, t) => {
        const valor = Math.abs(parseFloat(t.valor) || 0);
        if (t.tipo === 'receita') return acc + valor;
        if (t.tipo === 'despesa') return acc - valor;
        return acc;
      }, 0);

      return { ...toApiShape(account), saldoAtual: (parseFloat(account.saldo_inicial) || 0) + sum };
    });

    return { accounts: withBalances, principalAccountId: principalAccount.id };
  }

  static async create(req, res) {
    try {
      const { userId, nome, tipo, saldoInicial, instituicao, cor } = req.body;

      if (!userId || !nome) {
        return res.status(400).json({ success: false, message: 'userId e nome da conta são obrigatórios' });
      }

      const existing = await db('accounts').where({ user_id: userId, ativo: true }).first();
      const account = new Account({ userId, nome, tipo, saldoInicial, instituicao, cor, principal: !existing });

      const [id] = await db('accounts').insert({ user_id: userId, ...account.toPersistence() });
      const row = await db('accounts').where({ id }).first();

      res.status(201).json({
        success: true,
        message: 'Conta cadastrada com sucesso',
        account: toApiShape(row)
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  static async getUserAccounts(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
      }

      const { accounts } = await AccountController.getAccountsWithBalances(userId);
      res.json({ success: true, accounts });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor', accounts: [] });
    }
  }

  static async update(req, res) {
    try {
      const { accountId } = req.params;
      const { userId, nome, tipo, saldoInicial, instituicao, cor } = req.body;

      if (!userId || !nome) {
        return res.status(400).json({ success: false, message: 'userId e nome da conta são obrigatórios' });
      }

      const account = new Account({ userId, nome, tipo, saldoInicial, instituicao, cor });
      await db('accounts').where({ id: accountId, user_id: userId }).update({
        ...account.toPersistence(),
        atualizado_em: db.fn.now()
      });

      res.json({ success: true, message: 'Conta atualizada com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  static async delete(req, res) {
    try {
      const { accountId } = req.params;
      const { userId } = req.body;

      if (!accountId || !userId) {
        return res.status(400).json({ success: false, message: 'accountId e userId são obrigatórios' });
      }

      const accounts = await db('accounts').where({ user_id: userId, ativo: true });

      if (accounts.length <= 1) {
        return res.status(400).json({ success: false, message: 'Você precisa ter ao menos uma conta ativa' });
      }

      const target = accounts.find((a) => a.id === Number(accountId));

      await db.transaction(async (trx) => {
        await trx('accounts').where({ id: accountId }).update({ ativo: false, removido_em: trx.fn.now() });

        // Se a conta removida era a principal, promove outra pra assumir o papel
        if (target?.principal) {
          const promoted = accounts.find((a) => a.id !== Number(accountId));
          if (promoted) {
            await trx('accounts').where({ id: promoted.id }).update({ principal: true });
          }
        }
      });

      res.json({ success: true, message: 'Conta removida com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  // Transferência entre contas — idempotente (idempotencyKey vindo do
  // cliente) e atômica (as duas pernas + o log de idempotência são
  // gravados juntos ou nenhum é gravado — db.transaction faz o papel do
  // antigo db.runTransaction do Firestore).
  static async transfer(req, res) {
    try {
      const { userId } = req.params;
      const { fromAccountId, toAccountId, valor, descricao, idempotencyKey } = req.body;

      if (!userId || !fromAccountId || !toAccountId || !valor) {
        return res.status(400).json({ success: false, message: 'fromAccountId, toAccountId e valor são obrigatórios' });
      }
      if (String(fromAccountId) === String(toAccountId)) {
        return res.status(400).json({ success: false, message: 'Conta de origem e destino não podem ser a mesma' });
      }
      const valorNum = Math.abs(parseFloat(valor)) || 0;
      if (valorNum <= 0) {
        return res.status(400).json({ success: false, message: 'Valor da transferência deve ser maior que zero' });
      }

      // Valida o formato reaproveitando o Factory Method já existente
      // (branch 'transfer', antes código morto)
      TransactionFactory.createTransaction('transfer', {
        amount: valorNum,
        fromAccount: fromAccountId,
        toAccount: toAccountId,
        description: descricao,
        date: nowDataHora()
      });

      const key = idempotencyKey || crypto.randomUUID();

      const result = await db.transaction(async (trx) => {
        const existingLog = await trx('transfers').where({ idempotency_key: key }).first();
        if (existingLog) {
          return { alreadyProcessed: true };
        }

        const fromAccount = await trx('accounts').where({ id: fromAccountId, user_id: userId }).first();
        const toAccount = await trx('accounts').where({ id: toAccountId, user_id: userId }).first();
        if (!fromAccount || !toAccount) {
          throw new Error('Conta de origem ou destino não encontrada');
        }

        const dataHora = nowDataHora();

        const [fromTransactionId] = await trx('transactions').insert({
          user_id: userId,
          tipo: 'despesa',
          valor: valorNum,
          descricao: descricao || `Transferência para ${toAccount.nome}`,
          categoria: 'Transferência',
          data_hora: dataHora,
          account_id: fromAccountId,
          is_transferencia: true,
          transfer_id: key
        });

        const [toTransactionId] = await trx('transactions').insert({
          user_id: userId,
          tipo: 'receita',
          valor: valorNum,
          descricao: descricao || `Transferência de ${fromAccount.nome}`,
          categoria: 'Transferência',
          data_hora: dataHora,
          account_id: toAccountId,
          is_transferencia: true,
          transfer_id: key
        });

        await trx('transfers').insert({
          user_id: userId,
          idempotency_key: key,
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          valor: valorNum,
          descricao: descricao || '',
          from_transaction_id: fromTransactionId,
          to_transaction_id: toTransactionId
        });

        return { alreadyProcessed: false };
      });

      res.status(result.alreadyProcessed ? 200 : 201).json({
        success: true,
        message: result.alreadyProcessed
          ? 'Transferência já havia sido processada (reenvio ignorado)'
          : 'Transferência realizada com sucesso',
        transferId: key
      });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message || 'Erro interno do servidor' });
    }
  }

  // Resumo financeiro consolidado: saldo total, disponível, comprometido,
  // previsto e limite de crédito disponível. Reaproveita os cálculos que já
  // existem em CardController (fatura) e FixedExpenseController (status do mês).
  static async getResumo(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
      }

      const [{ accounts }, cardsWithInvoices, fixedExpenses] = await Promise.all([
        AccountController.getAccountsWithBalances(userId),
        CardController.getActiveCardsWithInvoices(userId),
        FixedExpenseController.getActiveWithStatus(userId)
      ]);

      const saldoTotal = accounts.reduce((sum, a) => sum + a.saldoAtual, 0);
      const saldoDisponivel = accounts.filter((a) => a.liquidez).reduce((sum, a) => sum + a.saldoAtual, 0);

      const comprometidoCartoes = cardsWithInvoices.reduce((sum, c) => sum + (c.invoice?.total || 0), 0);
      const limiteCreditoDisponivel = cardsWithInvoices.reduce((sum, c) => sum + Math.max(0, (c.limite || 0) - (c.invoice?.total || 0)), 0);

      const comprometidoFixos = fixedExpenses
        .filter((f) => f.status !== 'paid')
        .reduce((sum, f) => sum + (f.valor || 0), 0);

      const saldoComprometido = comprometidoCartoes + comprometidoFixos;
      const saldoPrevisto = saldoTotal - saldoComprometido;

      res.json({
        success: true,
        resumo: {
          saldoTotal,
          saldoDisponivel,
          saldoComprometido,
          saldoPrevisto,
          limiteCreditoDisponivel,
          detalhes: { comprometidoCartoes, comprometidoFixos }
        }
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
}

// Linhas do MySQL vêm em snake_case — a API sempre respondeu em camelCase
// (contrato que o frontend já consome), então convertemos na borda.
function toApiShape(row) {
  return {
    id: row.id,
    userId: row.user_id,
    nome: row.nome,
    tipo: row.tipo,
    saldoInicial: parseFloat(row.saldo_inicial) || 0,
    instituicao: row.instituicao,
    cor: row.cor,
    liquidez: Boolean(row.liquidez),
    principal: Boolean(row.principal),
    ativo: Boolean(row.ativo)
  };
}

module.exports = AccountController;
