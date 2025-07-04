const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Inicialização do Firebase
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://moneta-19f70.firebaseio.com"
});

const auth = admin.auth();
const db = admin.firestore();

const app = express();
const PORT = 3000;

// Deixa 'auth' e 'db' acessíveis nas rotas
app.locals.auth = auth;
app.locals.db = db;

// Middlewares
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'segredo123',
  resave: false,
  saveUninitialized: true
}));

// Rotas
const login = require('./routes/login');
const home = require('./routes/home');
const cadastro = require('./routes/cadastro');
const senha = require('./routes/esqueci-senha');
const cadastroConcluido = require('./routes/cadastro-concluido');

app.use('/login', login);
app.use('/cadastro', cadastro);
app.use('/esqueci-senha', senha);
app.use('/cadastro-concluido', cadastroConcluido);
app.use('/home', home);

// Página inicial
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Página 404
app.use((req, res) => {
  res.status(404).send('Página não encontrada');
});

// Inicializa o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
