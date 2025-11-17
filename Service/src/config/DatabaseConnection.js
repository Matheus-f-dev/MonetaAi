const admin = require('firebase-admin');

class DatabaseConnection {
  static instance = null;
  static initialized = false;

  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }

    if (!DatabaseConnection.initialized) {
      let serviceAccount;
      
      // Produção: usar variável de ambiente
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (error) {
          console.error('Erro ao fazer parse do serviceAccount:', error);
          throw new Error('FIREBASE_SERVICE_ACCOUNT inválido');
        }
      } else {
        // Desenvolvimento: usar arquivo local
        serviceAccount = require('../../serviceAccountKey.json');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || "https://moneta2ai-default-rtdb.firebaseio.com"
      });

      this.auth = admin.auth();
      this.db = admin.firestore();
      DatabaseConnection.initialized = true;
    }

    DatabaseConnection.instance = this;
    return this;
  }

  getAuth() {
    return this.auth;
  }

  getFirestore() {
    return this.db;
  }
}

module.exports = DatabaseConnection;