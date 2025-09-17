const DatabaseConnection = require('./DatabaseConnection');

const dbConnection = new DatabaseConnection();

module.exports = {
  auth: dbConnection.getAuth(),
  db: dbConnection.getFirestore()
};