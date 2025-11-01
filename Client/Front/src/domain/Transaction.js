export class Transaction {
  constructor(data) {
    this._id = data.id;
    this._userId = data.userId;
    this._tipo = data.tipo?.toLowerCase();
    this._valor = Math.abs(parseFloat(data.valor || 0));
    this._descricao = data.descricao?.trim();
    this._categoria = data.categoria || 'Outros';
    this._dataHora = data.dataHora;
    this._date = this._processDate(data.dataHora || data.data || data.criadoEm);
  }

  // Getters
  get id() { return this._id; }
  get userId() { return this._userId; }
  get tipo() { return this._tipo; }
  get valor() { return this._valor; }
  get descricao() { return this._descricao; }
  get categoria() { return this._categoria; }
  get dataHora() { return this._dataHora; }
  get date() { return this._date; }

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

  getDateFormatted() {
    try {
      return this._date ? this._date.toLocaleDateString('pt-BR') : 'Data inválida';
    } catch {
      return 'Data inválida';
    }
  }

  getTipoIcon() {
    return this.isReceita() ? '+' : '-';
  }

  getTipoClass() {
    return this.isReceita() ? 'receita' : 'despesa';
  }

  // Método privado para processar data
  _processDate(dateField) {
    if (!dateField) return new Date();
    
    if (typeof dateField === 'string' && dateField.includes('/')) {
      const [datePart] = dateField.split(', ');
      const [day, month, year] = datePart.split('/');
      return new Date(year, month - 1, day);
    }
    
    return new Date(dateField);
  }

  // Para uso em tabelas
  toTableFormat() {
    return {
      type: this.isReceita() ? 'in' : 'out',
      desc: this._descricao,
      category: this._categoria,
      date: this.getDateFormatted(),
      amount: this.getValorComSinal()
    };
  }

  // Para serialização
  toJSON() {
    return {
      id: this._id,
      userId: this._userId,
      tipo: this._tipo,
      valor: this._valor,
      descricao: this._descricao,
      categoria: this._categoria,
      dataHora: this._dataHora
    };
  }
}