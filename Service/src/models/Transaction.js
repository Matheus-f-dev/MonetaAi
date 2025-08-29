const { db } = require('../config/firebase');

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
    const transactionRef = db.collection('historico').doc();
    await transactionRef.set({
      ...transactionData,
      criadoEm: new Date()
    });
    return new Transaction({ id: transactionRef.id, ...transactionData });
  }

  static async findByUserId(userId) {
    const snapshot = await db.collection('historico')
      .where('userId', '==', userId)
      .orderBy('data', 'desc')
      .get();
    
    return snapshot.docs.map(doc => 
      new Transaction({ id: doc.id, ...doc.data() })
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