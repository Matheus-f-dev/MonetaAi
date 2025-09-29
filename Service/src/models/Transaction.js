const { db } = require('../config/firebase');
console.log('Firebase db conectado:', !!db);

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
    if (!this._userId) throw new Error('UserId é obrigatório');
    if (!this._tipo) throw new Error('Tipo é obrigatório');
    if (!this._descricao) throw new Error('Descrição é obrigatória');
    if (this._valor <= 0) throw new Error('Valor deve ser maior que zero');
    if (!['receita', 'despesa'].includes(this._tipo)) {
      throw new Error('Tipo deve ser receita ou despesa');
    }
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
      criadoEm: this._criadoEm
    };
  }

  // Método factory para criar instância a partir de dados do repository
  static fromRepository(data) {
    return new Transaction(data);
  }
  
  // Método para preparar dados para persistência
  toPersistence() {
    return {
      tipo: this._tipo,
      valor: this._valor,
      descricao: this._descricao,
      categoria: this._categoria,
      dataHora: this._dataHora
    };
  }
}

module.exports = Transaction;