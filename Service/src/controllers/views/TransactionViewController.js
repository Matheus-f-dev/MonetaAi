class TransactionViewController {
  static renderHistorico(req, res) {
    res.render('historico');
  }

  static renderProjecaoSaldo(req, res) {
    res.render('projecao-saldo');
  }
}

module.exports = TransactionViewController;