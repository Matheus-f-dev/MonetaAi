const { db } = require('../config/database');
const AccountController = require('./AccountController');

class ReconciliationController {
  // POST /api/accounts/:userId/:accountId/reconciliar
  // Body: { saldoInformado } -- o saldo que o usuário conferiu no
  // extrato/app do banco. Compara com o mesmo cálculo de saldo usado em
  // todo o resto do app (AccountController.getAccountsWithBalances) e
  // grava o histórico -- útil pra ver se a divergência é recorrente.
  static async reconciliar(req, res) {
    try {
      const { userId, accountId } = req.params;
      const { saldoInformado } = req.body;

      if (saldoInformado === undefined || saldoInformado === null) {
        return res.status(400).json({ success: false, message: 'saldoInformado é obrigatório' });
      }

      const { accounts } = await AccountController.getAccountsWithBalances(userId);
      const conta = accounts.find((a) => a.id === Number(accountId));

      if (!conta) {
        return res.status(404).json({ success: false, message: 'Conta não encontrada' });
      }

      const saldoCalculado = conta.saldoAtual;
      const informado = parseFloat(saldoInformado) || 0;
      const diferenca = Math.round((informado - saldoCalculado) * 100) / 100;

      const [{ id }] = await db('reconciliations').insert({
        account_id: accountId,
        saldo_informado: informado,
        saldo_calculado: saldoCalculado,
        diferenca
      }).returning('id');

      res.status(201).json({
        success: true,
        reconciliation: {
          id,
          accountId: Number(accountId),
          saldoInformado: informado,
          saldoCalculado,
          diferenca,
          bate: diferenca === 0
        }
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  // GET /api/accounts/:userId/:accountId/reconciliations -- histórico, pra
  // ver se a mesma divergência se repete toda vez.
  static async getHistorico(req, res) {
    try {
      const { userId, accountId } = req.params;

      // Confirma que a conta é do usuário antes de expor o histórico --
      // sem isso qualquer usuário autenticado veria reconciliações de
      // contas de outra pessoa só adivinhando o accountId.
      const conta = await db('accounts').where({ id: accountId, user_id: userId }).first();
      if (!conta) {
        return res.status(404).json({ success: false, message: 'Conta não encontrada' });
      }

      const rows = await db('reconciliations')
        .where({ account_id: accountId })
        .orderBy('criado_em', 'desc');

      res.json({
        success: true,
        reconciliations: rows.map((r) => ({
          id: r.id,
          accountId: r.account_id,
          saldoInformado: parseFloat(r.saldo_informado),
          saldoCalculado: parseFloat(r.saldo_calculado),
          diferenca: parseFloat(r.diferenca),
          criadoEm: r.criado_em
        }))
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor', reconciliations: [] });
    }
  }
}

module.exports = ReconciliationController;
