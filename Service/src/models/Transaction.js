const { db } = require('../config/firebase');

class Transaction {
  constructor(data) {
    this._id = data.id;
    this._userId = data.userId;
    // Suporte aos novos campos em inglês
    this._tipo = (data.type || data.tipo)?.toLowerCase();
    this._valor = Math.abs(parseFloat(data.amount || data.valor || 0));
    this._descricao = (data.description || data.descricao)?.trim();
    this._categoria = data.category || data.categoria || 'Outros';
    this._dataHora = data.date || data.dataHora;
    this._criadoEm = data.criadoEm;

    // Vínculo com cartão e parcelamento (opcional)
    this._cardId = data.cardId || null;
    this._compraId = data.compraId || null;
    this._parcelaAtual = data.parcelaAtual || null;
    this._parcelaTotal = data.parcelaTotal || null;

    // Vínculo com gasto fixo/recorrente (opcional)
    this._recurrenceId = data.recurrenceId || null;
    this._competencia = data.competencia || null;

    // Vínculo com conta/carteira de origem (opcional — transações sem conta
    // caem na conta principal do usuário no cálculo de saldo por conta)
    this._accountId = data.accountId || null;
    this._isTransferencia = Boolean(data.isTransferencia);
    this._transferId = data.transferId || null;

    // Divisão da despesa com outras pessoas (opcional)
    // split.participantes: [{ nome, valor, pago, pagoEm }]
    this._split = data.split && Array.isArray(data.split.participantes)
      ? {
          participantes: data.split.participantes.map(p => ({
            nome: (p.nome || '').trim(),
            valor: Math.abs(parseFloat(p.valor) || 0),
            pago: Boolean(p.pago),
            pagoEm: p.pagoEm || null
          })).filter(p => p.nome)
        }
      : null;

    // Converter tipos em inglês para português
    if (this._tipo === 'income') this._tipo = 'receita';
    if (this._tipo === 'expense') this._tipo = 'despesa';



    this._validate();
  }

  // Getters (encapsulamento)
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
  
  // Métodos de negócio
  isReceita() {
    return this._tipo === 'receita';
  }
  
  isDespesa() {
    return this._tipo === 'despesa';
  }
  
  getValorComSinal() {
    return this.isReceita() ? this._valor : -this._valor;
  }
  
  getValorFormatado() {
    return `R$ ${this._valor.toFixed(2).replace('.', ',')}`;
  }
  
  // Validação privada
  _validate() {
    if (!this._userId) this._userId = 'unknown';
    if (!this._tipo || !['receita', 'despesa'].includes(this._tipo)) {
      this._tipo = 'despesa'; // Default para despesa
    }
    if (!this._descricao) this._descricao = 'Sem descrição';
    if (this._valor <= 0) this._valor = 0;
  }
  
  // Serialização
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

  // Método factory para criar instância a partir de dados do repository
  static fromRepository(data) {
    return new Transaction(data);
  }
  
  // Método para preparar dados para persistência
  toPersistence() {
    const data = {
      tipo: this._tipo,
      valor: this._valor,
      descricao: this._descricao,
      categoria: this._categoria,
      dataHora: this._dataHora
    };

    // Só grava os campos opcionais quando fazem parte da transação
    if (this._cardId) data.cardId = this._cardId;
    if (this._compraId) data.compraId = this._compraId;
    if (this._parcelaAtual) data.parcelaAtual = this._parcelaAtual;
    if (this._parcelaTotal) data.parcelaTotal = this._parcelaTotal;
    if (this._recurrenceId) data.recurrenceId = this._recurrenceId;
    if (this._competencia) data.competencia = this._competencia;
    if (this._split) data.split = this._split;
    if (this._accountId) data.accountId = this._accountId;
    if (this._isTransferencia) data.isTransferencia = this._isTransferencia;
    if (this._transferId) data.transferId = this._transferId;

    return data;
  }
}

module.exports = Transaction;