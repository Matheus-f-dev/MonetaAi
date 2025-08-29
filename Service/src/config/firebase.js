const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://moneta-19f70.firebaseio.com"
});

const auth = admin.auth();
const db = admin.firestore();

module.exports = { auth, db };