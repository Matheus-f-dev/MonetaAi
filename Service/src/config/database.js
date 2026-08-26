// Substitui config/firebase.js + DatabaseConnection.js como fonte de dados
// do app. Singleton do Knex — uma única pool de conexão MySQL reaproveitada
// por todos os controllers (mesmo espírito do Singleton que a Firestore
// connection tinha antes).
const knex = require('knex');
const config = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';

let instance = null;

function getDb() {
  if (!instance) {
    instance = knex(config[environment]);
  }
  return instance;
}

module.exports = { db: getDb() };
