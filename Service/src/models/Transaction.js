const { db } = require('../config/firebase');
console.log('Firebase db conectado:', !!db);

class Transaction {
  constructor(data) {
    this._id = data.id;
    this._userId = data.userId;
    this._tipo = data.tipo?.toLowerCase();
    this._valor = Math.abs(parseFloat(data.valor || 0));
    this._descricao = data.descricao?.trim();
    this._categoria = data.categoria || 'Outros';
    this._dataHora = data.dataHora;
    this._criadoEm = data.criadoEm;
    
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

  static async create(transactionData) {
    const transaction = new Transaction(transactionData);
    
    const dataToSave = {
      tipo: transaction.tipo,
      valor: transaction.valor,
      descricao: transaction.descricao,
      categoria: transaction.categoria,
      dataHora: transaction.dataHora,
      criadoEm: new Date().toISOString()
    };
    
    const docRef = await db
      .collection('usuarios')
      .doc(transaction.userId)
      .collection('historico')
      .add(dataToSave);
    
    return new Transaction({ id: docRef.id, userId: transaction.userId, ...dataToSave });
  }

  static async findByUserId(userId) {
    const snapshot = await db.collection('usuarios').doc(userId).collection('historico')
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Documento do Firebase:', data);
      return new Transaction({
        id: doc.id,
        userId,
        ...data
      });
    });
  }

  static async findById(id) {
    const doc = await db.collection('historico').doc(id).get();
    if (!doc.exists) return null;
    return new Transaction({ id: doc.id, ...doc.data() });
  }

  async update(updateData) {
    const updatedTransaction = new Transaction({ ...this.toJSON(), ...updateData });
    await db.collection('usuarios').doc(this._userId).collection('historico').doc(this._id).update(updatedTransaction.toJSON());
    return updatedTransaction;
  }

  async delete() {
    await db.collection('usuarios').doc(this._userId).collection('historico').doc(this._id).delete();
  }
  
  async save() {
    if (this._id) {
      return await this.update(this.toJSON());
    } else {
      return await Transaction.create(this.toJSON());
    }
  }
}

module.exports = Transaction;