class Transaction {
  constructor(data) {
    this._id = data.id;
    this._userId = data.userId ?? data.user_id;
    // Suporte aos novos campos em inglês
    this._tipo = (data.type || data.tipo)?.toLowerCase();
    this._valor = Math.abs(parseFloat(data.amount ?? data.valor ?? 0));
    this._descricao = (data.description || data.descricao)?.trim();
    this._categoria = data.category || data.categoria || 'Outros';
    this._dataHora = data.date || data.dataHora || data.data_hora;
    this._criadoEm = data.criadoEm ?? data.criado_em;

    // Vínculo com cartão e parcelamento (opcional)
    this._cardId = data.cardId ?? data.card_id ?? null;
    this._compraId = data.compraId ?? data.compra_id ?? null;
    this._parcelaAtual = data.parcelaAtual ?? data.parcela_atual ?? null;
    this._parcelaTotal = data.parcelaTotal ?? data.parcela_total ?? null;

    // Vínculo com gasto fixo/recorrente (opcional)
    this._recurrenceId = data.recurrenceId ?? data.recurrence_id ?? null;
    this._competencia = data.competencia ?? null;

    // Vínculo com conta/carteira de origem (opcional — transações sem conta
    // caem na conta principal do usuário no cálculo de saldo por conta)
    this._accountId = data.accountId ?? data.account_id ?? null;
    this._isTransferencia = Boolean(data.isTransferencia ?? data.is_transferencia);
    this._transferId = data.transferId ?? data.transfer_id ?? null;

    // Divisão da despesa com outras pessoas (opcional, carregada à parte
    // da tabela split_participants e anexada aqui pelo repository)
    this._split = data.split || null;

    // Converter tipos em inglês para português
    if (this._tipo === 'income') this._tipo = 'receita';
    if (this._tipo === 'expense') this._tipo = 'despesa';

    this._validate();
  }

  get id() { return this._id; }
  get userId() { return this._userId; }
  get tipo() { return this._tipo; }
  get valor() { return this._valor; }
  get descricao() { return this._descricao; }
  get categoria() { return this._categoria; }
  get dataHora() { return this._dataHora; }
  get criadoEm() { return this._criadoEm; }
  get cardId() { return this._cardId; }
  get compraId() { return this._compraId; }
  get parcelaAtual() { return this._parcelaAtual; }
  get parcelaTotal() { return this._parcelaTotal; }
  get recurrenceId() { return this._recurrenceId; }
  get competencia() { return this._competencia; }
  get split() { return this._split; }
  get accountId() { return this._accountId; }
  get isTransferencia() { return this._isTransferencia; }
  get transferId() { return this._transferId; }

  isReceita() { return this._tipo === 'receita'; }
  isDespesa() { return this._tipo === 'despesa'; }
  getValorComSinal() { return this.isReceita() ? this._valor : -this._valor; }
  getValorFormatado() { return `R$ ${this._valor.toFixed(2).replace('.', ',')}`; }

  _validate() {
    if (!this._userId) this._userId = 'unknown';
    if (!this._tipo || !['receita', 'despesa'].includes(this._tipo)) {
      this._tipo = 'despesa';
    }
    if (!this._descricao) this._descricao = 'Sem descrição';
    if (this._valor <= 0) this._valor = 0;
  }

  toJSON() {
    return {
      id: this._id,
      userId: this._userId,
      tipo: this._tipo,
      valor: this._valor,
      descricao: this._descricao,
      categoria: this._categoria,
      dataHora: this._dataHora,
      criadoEm: this._criadoEm,
      cardId: this._cardId,
      compraId: this._compraId,
      parcelaAtual: this._parcelaAtual,
      parcelaTotal: this._parcelaTotal,
      recurrenceId: this._recurrenceId,
      competencia: this._competencia,
      split: this._split,
      accountId: this._accountId,
      isTransferencia: this._isTransferencia,
      transferId: this._transferId
    };
  }

  static fromRepository(data) {
    return new Transaction(data);
  }

  // Formato de linha da tabela `transactions` (snake_case, sem os campos
  // que o MySQL já preenche sozinho: id, criado_em)
  toPersistence() {
    return {
      user_id: this._userId,
      tipo: this._tipo,
      valor: this._valor,
      descricao: this._descricao,
      categoria: this._categoria,
      data_hora: this._dataHora,
      card_id: this._cardId || null,
      compra_id: this._compraId || null,
      parcela_atual: this._parcelaAtual || null,
      parcela_total: this._parcelaTotal || null,
      recurrence_id: this._recurrenceId || null,
      competencia: this._competencia || null,
      account_id: this._accountId || null,
      is_transferencia: this._isTransferencia || false,
      transfer_id: this._transferId || null
    };
  }
}

module.exports = Transaction;
