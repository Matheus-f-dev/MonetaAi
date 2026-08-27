const TransactionService = require('../services/TransactionService');
const { gerarCSV, gerarPDF } = require('../services/ReportExportService');

const ROTULOS_PERIODO = { mes: 'Este mês', ano: 'Este ano', tudo: 'Todo o histórico' };

function filtrosPorPeriodo(periodo) {
  const now = new Date();
  switch (periodo) {
    case 'ano':
      return {
        startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
      };
    case 'tudo':
      return {};
    case 'mes':
    default:
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      };
  }
}

class ReportExportController {
  // GET /api/relatorios/:userId/export?formato=csv|pdf&periodo=mes|ano|tudo
  // Não recalcula nada -- reaproveita TransactionService, a mesma fonte de
  // dados que os controllers de analytics (Economias/Receitas/Tendências/
  // ImpactoFinanceiro) já usam.
  static async export(req, res) {
    try {
      const { userId } = req.params;
      const formato = (req.query.formato || 'csv').toLowerCase();
      const periodo = (req.query.periodo || 'mes').toLowerCase();

      if (!['csv', 'pdf'].includes(formato)) {
        return res.status(400).json({ success: false, message: "formato deve ser 'csv' ou 'pdf'" });
      }
      if (!ROTULOS_PERIODO[periodo]) {
        return res.status(400).json({ success: false, message: "periodo deve ser 'mes', 'ano' ou 'tudo'" });
      }

      const transactionService = new TransactionService();
      const filtros = filtrosPorPeriodo(periodo);

      const transactions = await transactionService.getUserTransactions(userId, filtros);
      const naoTransferencia = transactions.filter((t) => !t.isTransferencia);
      const resumo = await transactionService.getUserBalance(userId, filtros);

      const dataArquivo = new Date().toISOString().split('T')[0];

      if (formato === 'csv') {
        const csv = gerarCSV(naoTransferencia);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-moneta-${periodo}-${dataArquivo}.csv"`);
        // BOM na frente -- sem isso o Excel abre acentuação errada em UTF-8
        return res.send('﻿' + csv);
      }

      const pdfBuffer = await gerarPDF(naoTransferencia, resumo, ROTULOS_PERIODO[periodo]);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-moneta-${periodo}-${dataArquivo}.pdf"`);
      return res.send(pdfBuffer);

    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      res.status(500).json({ success: false, message: 'Erro ao gerar relatório' });
    }
  }
}

module.exports = ReportExportController;
