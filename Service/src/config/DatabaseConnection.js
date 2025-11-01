const admin = require('firebase-admin');

class DatabaseConnection {
  static instance = null;
  static initialized = false;

  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }

    if (!DatabaseConnection.initialized) {
      const serviceAccount = require('../../serviceAccountKey.json');
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://moneta2ai-default-rtdb.firebaseio.com"
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