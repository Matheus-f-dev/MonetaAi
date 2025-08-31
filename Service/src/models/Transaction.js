const { db } = require('../config/firebase');
console.log('Firebase db conectado:', !!db);

class Transaction {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.tipo = data.tipo;
    this.valor = data.valor;
    this.descricao = data.descricao;
    this.categoria = data.categoria;
    this.data = data.data;
    this.criadoEm = data.criadoEm;
  }

  static async create(transactionData) {
    const dataToSave = {
      descricao: transactionData.descricao,
      valor: Number(transactionData.valor),
      categoria: transactionData.categoria,
      tipo: transactionData.tipo,
      dataHora: new Date().toLocaleString('pt-BR')
    };
    
    const docRef = await db
      .collection('usuarios')
      .doc(transactionData.userId)
      .collection('historico')
      .add(dataToSave);
    
    return new Transaction({ id: docRef.id, userId: transactionData.userId, ...dataToSave });
  }

  static async findByUserId(userId) {
    const snapshot = await db.collection('usuarios').doc(userId).collection('historico')
      .orderBy('dataHora', 'desc')
      .get();
    
    return snapshot.docs.map(doc => 
      new Transaction({ id: doc.id, userId, ...doc.data() })
    );
  }

  static async findById(id) {
    const doc = await db.collection('historico').doc(id).get();
    if (!doc.exists) return null;
    return new Transaction({ id: doc.id, ...doc.data() });
  }

  async update(updateData) {
    await db.collection('historico').doc(this.id).update(updateData);
    Object.assign(this, updateData);
    return this;
  }

  async delete() {
    await db.collection('historico').doc(this.id).delete();
  }
}

module.exports = Transaction;