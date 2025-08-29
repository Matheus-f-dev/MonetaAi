const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
require('dotenv').config();

const corsMiddleware = require('./middleware/cors');
const apiRoutes = require('./routes/api');

// Importa rotas de views para compatibilidade
const login = require('../routes/login');
const cadastro = require('../routes/cadastro');
const senha = require('../routes/esqueci-senha');
const cadastroConcluido = require('../routes/cadastro-concluido');
const transacoes = require('../routes/historico');
const authRoutes = require('../routes/auth');

const app = express();

// Middlewares
app.use(corsMiddleware);
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurações de sessão
app.use(session({
  secret: 'chave-super-secreta',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Rotas da API (MVC)
app.use('/api', apiRoutes);

// Rotas de views (compatibilidade)
app.use('/login', login);
app.use('/cadastro', cadastro);
app.use('/esqueci-senha', senha);
app.use('/cadastro-concluido', cadastroConcluido);
app.use('/', transacoes);
app.use('/auth', authRoutes);

// Página histórico
app.get('/historico-page', (req, res) => {
  res.render('historico');
});

// Página inicial
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Página 404
app.use((req, res) => {
  res.status(404).send('Página não encontrada');
});

module.exports = app;