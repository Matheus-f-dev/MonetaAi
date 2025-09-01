const { db } = require('../config/firebase');

class TransactionRepository {
  constructor() {
    this.collection = 'usuarios';
    this.subcollection = 'historico';
  }

  async create(userId, transactionData) {
    const docRef = await db
      .collection(this.collection)
      .doc(userId)
      .collection(this.subcollection)
      .add({
        ...transactionData,
        criadoEm: new Date().toISOString()
      });
    
    return { id: docRef.id, ...transactionData };
  }

  async findByUserId(userId) {
    const snapshot = await db
      .collection(this.collection)
      .doc(userId)
      .collection(this.subcollection)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      userId,
      ...doc.data()
    }));
  }

  async findById(userId, transactionId) {
    const doc = await db
      .collection(this.collection)
      .doc(userId)
      .collection(this.subcollection)
      .doc(transactionId)
      .get();
    
    if (!doc.exists) return null;
    
    return {
      id: doc.id,
      userId,
      ...doc.data()
    };
  }

  async update(userId, transactionId, updateData) {
    await db
      .collection(this.collection)
      .doc(userId)
      .collection(this.subcollection)
      .doc(transactionId)
      .update(updateData);
    
    return { id: transactionId, userId, ...updateData };
  }

  async delete(userId, transactionId) {
    await db
      .collection(this.collection)
      .doc(userId)
      .collection(this.subcollection)
      .doc(transactionId)
      .delete();
  }
}

module.exports = TransactionRepository;