const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const passport = require('passport');
require('dotenv').config();

// inicialização do Firebase
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://moneta-19f70.firebaseio.com"
});

// Defina auth e db 
const auth = admin.auth();
const db = admin.firestore();
const colecao = db.collection('historico');

// importa e inicialize o passport passando as variáveis já definidas
const initializePassport = require('./routes/passport-google-config');
initializePassport(passport, auth, db);

const app = express();
const PORT = 3000;

app.locals.auth = auth;
app.locals.db = db;

// middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// configurações do passport e sessão
app.use(session({
  secret: 'chave-super-secreta',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// importa as rotas
const login = require('./routes/login');
const cadastro = require('./routes/cadastro');
const senha = require('./routes/esqueci-senha');
const cadastroConcluido = require('./routes/cadastro-concluido');
const transacoes = require('./routes/historico'); 
const authRoutes = require('./routes/auth');

// usa as rotas
app.use('/login', login);
app.use('/cadastro', cadastro);
app.use('/esqueci-senha', senha);
app.use('/cadastro-concluido', cadastroConcluido);
app.use('/', transacoes); 
app.use('/auth', authRoutes);

// página histórico
app.get('/historico-page', (req, res) => {
  res.render('historico');
});

// página inicial
app.get('/', (req, res) => {
  res.redirect('/login');
});

// página 404
app.use((req, res) => {
  res.status(404).send('Página não encontrada');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
