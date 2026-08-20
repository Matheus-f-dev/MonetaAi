const { db } = require('../config/firebase');
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
  // sem accountId (histórico antigo, lançamentos do bot do WhatsApp) caem na
  // conta principal — não existe migração manual, a conta principal absorve
  // tudo que não tem dono explícito.
  static async getAccountsWithBalances(userId) {
    const contasCol = db.collection('usuarios').doc(userId).collection('contas');

    let snapshot = await contasCol.where('ativo', '==', true).get();
    let accounts = [];
    snapshot.forEach(doc => accounts.push({ id: doc.id, ...doc.data() }));

    // Nenhuma conta ainda: provisiona a Conta Principal automaticamente.
    // Feito dentro de uma transação (checa de novo por dentro) pra não criar
    // duas "Conta Principal" quando duas requisições chegam ao mesmo tempo
    // (ex.: StrictMode do React disparando o efeito 2x, ou duas abas abertas).
    if (accounts.length === 0) {
      accounts = await db.runTransaction(async (tx) => {
        const recheck = await tx.get(contasCol.where('ativo', '==', true));
        if (!recheck.empty) {
          return recheck.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        const principal = new Account({ userId, nome: 'Conta Principal', tipo: 'corrente', saldoInicial: 0, principal: true });
        const ref = contasCol.doc();
        tx.set(ref, principal.toPersistence());
        return [{ id: ref.id, ...principal.toPersistence() }];
      });
    }

    const principalAccount = accounts.find(a => a.principal) || accounts[0];

    const historicoSnapshot = await db.collection('usuarios').doc(userId).collection('historico').get();
    const byAccount = {};
    historicoSnapshot.forEach(doc => {
      const t = doc.data();
      const key = t.accountId || '__sem_conta__';
      if (!byAccount[key]) byAccount[key] = [];
      byAccount[key].push(t);
    });

    const withBalances = accounts.map(account => {
      const own = byAccount[account.id] || [];
      const legacy = account.id === principalAccount.id ? (byAccount['__sem_conta__'] || []) : [];
      const sum = [...own, ...legacy].reduce((acc, t) => {
        const valor = Math.abs(parseFloat(t.valor) || 0);
        if (t.tipo === 'receita') return acc + valor;
        if (t.tipo === 'despesa') return acc - valor;
        return acc;
      }, 0);

      return { ...account, saldoAtual: (account.saldoInicial || 0) + sum };
    });

    return { accounts: withBalances, principalAccountId: principalAccount.id };
  }

  static async create(req, res) {
    try {
      const { userId, nome, tipo, saldoInicial, instituicao, cor } = req.body;

      if (!userId || !nome) {
        return res.status(400).json({ success: false, message: 'userId e nome da conta são obrigatórios' });
      }

      const existing = await db.collection('usuarios').doc(userId).collection('contas')
        .where('ativo', '==', true)
        .limit(1)
        .get();

      const account = new Account({ userId, nome, tipo, saldoInicial, instituicao, cor, principal: existing.empty });

      const docRef = await db.collection('usuarios').doc(userId).collection('contas').add(account.toPersistence());

      res.status(201).json({
        success: true,
        message: 'Conta cadastrada com sucesso',
        account: { id: docRef.id, ...account.toPersistence() }
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
      await db.collection('usuarios').doc(userId).collection('contas').doc(accountId).update({
        ...account.toPersistence(),
        atualizadoEm: new Date().toISOString()
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

      const snapshot = await db.collection('usuarios').doc(userId).collection('contas')
        .where('ativo', '==', true)
        .get();

      const accounts = [];
      snapshot.forEach(doc => accounts.push({ id: doc.id, ...doc.data() }));

      if (accounts.length <= 1) {
        return res.status(400).json({ success: false, message: 'Você precisa ter ao menos uma conta ativa' });
      }

      const target = accounts.find(a => a.id === accountId);
      const batch = db.batch();
      const targetRef = db.collection('usuarios').doc(userId).collection('contas').doc(accountId);
      batch.update(targetRef, { ativo: false, removidoEm: new Date().toISOString() });

      // Se a conta removida era a principal, promove outra pra assumir o papel
      if (target?.principal) {
        const promoted = accounts.find(a => a.id !== accountId);
        if (promoted) {
          const promotedRef = db.collection('usuarios').doc(userId).collection('contas').doc(promoted.id);
          batch.update(promotedRef, { principal: true });
        }
      }

      await batch.commit();

      res.json({ success: true, message: 'Conta removida com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  // Transferência entre contas — idempotente (idempotencyKey vindo do cliente)
  // e atômica (as duas pernas + o log de idempotência são gravados juntos ou
  // nenhum é gravado).
  static async transfer(req, res) {
    try {
      const { userId } = req.params;
      const { fromAccountId, toAccountId, valor, descricao, idempotencyKey } = req.body;

      if (!userId || !fromAccountId || !toAccountId || !valor) {
        return res.status(400).json({ success: false, message: 'fromAccountId, toAccountId e valor são obrigatórios' });
      }
      if (fromAccountId === toAccountId) {
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
      const userRef = db.collection('usuarios').doc(userId);
      const logRef = userRef.collection('transferencias').doc(key);
      const historicoCol = userRef.collection('historico');

      const result = await db.runTransaction(async (tx) => {
        const logDoc = await tx.get(logRef);
        const fromRef = userRef.collection('contas').doc(fromAccountId);
        const toRef = userRef.collection('contas').doc(toAccountId);
        const fromDoc = await tx.get(fromRef);
        const toDoc = await tx.get(toRef);

        if (logDoc.exists) {
          return { alreadyProcessed: true, transferId: key };
        }

        if (!fromDoc.exists || !toDoc.exists) {
          throw new Error('Conta de origem ou destino não encontrada');
        }

        const dataHora = nowDataHora();
        const criadoEm = new Date().toISOString();
        const fromTxRef = historicoCol.doc();
        const toTxRef = historicoCol.doc();

        tx.set(fromTxRef, {
          tipo: 'despesa',
          valor: valorNum,
          descricao: descricao || `Transferência para ${toDoc.data().nome}`,
          categoria: 'Transferência',
          dataHora,
          criadoEm,
          accountId: fromAccountId,
          isTransferencia: true,
          transferId: key
        });

        tx.set(toTxRef, {
          tipo: 'receita',
          valor: valorNum,
          descricao: descricao || `Transferência de ${fromDoc.data().nome}`,
          categoria: 'Transferência',
          dataHora,
          criadoEm,
          accountId: toAccountId,
          isTransferencia: true,
          transferId: key
        });

        tx.set(logRef, {
          userId, fromAccountId, toAccountId, valor: valorNum, descricao: descricao || '',
          criadoEm, fromTransactionId: fromTxRef.id, toTransactionId: toTxRef.id
        });

        return { alreadyProcessed: false, transferId: key };
      });

      res.status(result.alreadyProcessed ? 200 : 201).json({
        success: true,
        message: result.alreadyProcessed
          ? 'Transferência já havia sido processada (reenvio ignorado)'
          : 'Transferência realizada com sucesso',
        transferId: result.transferId
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
      const saldoDisponivel = accounts.filter(a => a.liquidez).reduce((sum, a) => sum + a.saldoAtual, 0);

      const comprometidoCartoes = cardsWithInvoices.reduce((sum, c) => sum + (c.invoice?.total || 0), 0);
      const limiteCreditoDisponivel = cardsWithInvoices.reduce((sum, c) => sum + Math.max(0, (c.limite || 0) - (c.invoice?.total || 0)), 0);

      const comprometidoFixos = fixedExpenses
        .filter(f => f.status !== 'paid')
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

module.exports = AccountController;
