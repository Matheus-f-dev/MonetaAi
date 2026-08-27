const crypto = require('crypto');
const TransactionService = require('../services/TransactionService');
const TransactionFactory = require('../services/TransactionFactory');
const { TransactionSubject } = require('../services/TransactionObserver');
const { inferirCategoria } = require('../services/CategoryInference');
const AuditLogService = require('../services/AuditLogService');

const transactionSubject = new TransactionSubject();

class TransactionController {
  static async create(req, res) {
    try {
      // userId sempre vem da identidade do token, nunca do corpo da
      // requisição — senão qualquer usuário autenticado poderia gravar
      // transações em nome de outro (bastava mandar o userId de outra
      // pessoa no body).
      const transactionData = { ...req.body, userId: req.user.uid };

      // Preenchimento automático, nunca sobrescrita: só roda quando o
      // cliente não mandou categoria nenhuma ou mandou o genérico padrão.
      // Uma categoria explícita do usuário sempre vence.
      if (!transactionData.categoria || transactionData.categoria === 'Outros') {
        const inferida = inferirCategoria(transactionData.descricao);
        if (inferida) transactionData.categoria = inferida;
      }

      // Factory Method Pattern - Criar transação baseada no tipo
      const transactionType = transactionData.tipo?.toLowerCase() === 'receita' ? 'income' : 'expense';
      const factoryTransaction = TransactionFactory.createTransaction(transactionType, {
        amount: transactionData.valor,
        description: transactionData.descricao,
        category: transactionData.categoria,
        date: transactionData.dataHora
      });


      const transactionService = new TransactionService();
      const parcelas = parseInt(transactionData.parcelas, 10) || 1;

      // Compra parcelada no cartão: gera uma transação por mês, todas ligadas por compraId
      if (parcelas > 1 && transactionData.cardId) {
        const compraId = crypto.randomUUID();
        const valorParcela = parseFloat(transactionData.valor) / parcelas;
        const [dia, mes, ano] = (transactionData.dataHora || '').split(', ')[0]?.split('/') || [];
        const baseDate = dia ? new Date(ano, mes - 1, dia) : new Date();

        const created = [];
        for (let i = 0; i < parcelas; i++) {
          const parcelaDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, baseDate.getDate());
          const dataHora = `${String(parcelaDate.getDate()).padStart(2, '0')}/${String(parcelaDate.getMonth() + 1).padStart(2, '0')}/${parcelaDate.getFullYear()}, ${new Date().toLocaleTimeString('pt-BR')}`;

          const transaction = await transactionService.createTransaction({
            ...transactionData,
            valor: valorParcela,
            dataHora,
            compraId,
            parcelaAtual: i + 1,
            parcelaTotal: parcelas
          });
          created.push(transaction);
          await AuditLogService.registrar(null, {
            userId: transactionData.userId,
            tabela: 'transactions',
            registroId: transaction.id,
            acao: 'insert',
            dadosNovos: transaction.toJSON ? transaction.toJSON() : transaction
          });
        }

        transactionSubject.notify(transactionData);

        return res.status(201).json({
          success: true,
          message: `Compra parcelada em ${parcelas}x criada com sucesso!`,
          transaction: created[0],
          installments: created
        });
      }

      const transaction = await transactionService.createTransaction(transactionData);

      await AuditLogService.registrar(null, {
        userId: transactionData.userId,
        tabela: 'transactions',
        registroId: transaction.id,
        acao: 'insert',
        dadosNovos: transaction.toJSON ? transaction.toJSON() : transaction
      });

      // Notificar observers sobre a nova transação
      transactionSubject.notify(transactionData);

      res.status(201).json({
        success: true,
        message: 'Transação criada com sucesso!',
        transaction
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  static async getUserTransactions(req, res) {
    try {
      const transactionService = new TransactionService();
      const { userId } = req.params;
      const { filter, startDate, endDate, category, type, accountId } = req.query;

      const transactions = await transactionService.getUserTransactions(userId, {
        filter,
        startDate,
        endDate,
        category,
        type,
        accountId
      });

      res.json({
        success: true,
        transactions
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar transações'
      });
    }
  }

  static async getUserBalance(req, res) {
    try {
      const transactionService = new TransactionService();
      const { userId } = req.params;
      const { filter, startDate, endDate, category, type } = req.query;
      
      const balance = await transactionService.getUserBalance(userId, {
        filter,
        startDate,
        endDate,
        category,
        type
      });

      res.json({
        success: true,
        balance
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Erro ao calcular saldo'
      });
    }
  }
  
  static async getChartData(req, res) {
    try {
      const transactionService = new TransactionService();
      const { userId } = req.params;
      const { filter } = req.query;
      
      const chartData = await transactionService.getChartData(userId, filter);

      res.json({
        success: true,
        chartData
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar dados do gráfico'
      });
    }
  }
  
  static async getPercentageChange(req, res) {
    try {
      const transactionService = new TransactionService();
      const { userId } = req.params;
      const { period } = req.query;
      
      const percentageChange = await transactionService.getPercentageChange(userId, period);

      res.json({
        success: true,
        percentageChange
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Erro ao calcular porcentagens'
      });
    }
  }

  static async update(req, res) {
    try {
      const transactionService = new TransactionService();
      const { id } = req.params;
      // userId vem do token (req.user.uid), não do body — senão qualquer
      // usuário autenticado poderia editar transação de outra pessoa
      // (bastava mandar o userId da vítima no corpo da requisição).
      const { userId: _ignored, ...updateData } = req.body;
      const userId = req.user.uid;

      const antes = await transactionService.getTransactionById(userId, id);
      const transaction = await transactionService.updateTransaction(userId, id, updateData);

      await AuditLogService.registrar(null, {
        userId,
        tabela: 'transactions',
        registroId: id,
        acao: 'update',
        dadosAntigos: antes?.toJSON ? antes.toJSON() : antes,
        dadosNovos: transaction?.toJSON ? transaction.toJSON() : transaction
      });

      res.json({
        success: true,
        message: 'Transação atualizada com sucesso!',
        transaction
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message || 'Erro ao atualizar transação'
      });
    }
  }

  static async delete(req, res) {
    try {
      const transactionService = new TransactionService();
      const { id } = req.params;
      // userId vem do token, não do body — mesma razão do update() acima.
      const userId = req.user.uid;

      const antes = await transactionService.getTransactionById(userId, id);
      await transactionService.deleteTransaction(userId, id);

      await AuditLogService.registrar(null, {
        userId,
        tabela: 'transactions',
        registroId: id,
        acao: 'delete',
        dadosAntigos: antes?.toJSON ? antes.toJSON() : antes
      });

      res.json({
        success: true,
        message: 'Transação excluída com sucesso!'
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message || 'Erro ao excluir transação'
      });
    }
  }
}

module.exports = TransactionController;