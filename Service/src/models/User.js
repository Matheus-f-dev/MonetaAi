const { db } = require('../config/firebase');

class User {
  constructor(data) {
    this.uid = data.uid;
    this.nome = data.nome;
    this.email = data.email;
    this.salario = data.salario;
    this.criadoEm = data.criadoEm;
  }

  static async create(userData) {
    const userRef = db.collection('usuarios').doc(userData.uid);
    await userRef.set({
      nome: userData.nome,
      email: userData.email,
      salario: userData.salario,
      criadoEm: new Date()
    });
    return new User(userData);
  }

  static async findById(uid) {
    const userDoc = await db.collection('usuarios').doc(uid).get();
    if (!userDoc.exists) return null;
    return new User({ uid, ...userDoc.data() });
  }

  static async findByEmail(email) {
    const snapshot = await db.collection('usuarios').where('email', '==', email).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return new User({ uid: doc.id, ...doc.data() });
  }
}

module.exports = User;