const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
require('dotenv').config();

const corsMiddleware = require('./middleware/cors');
const apiRoutes = require('./routes/api');
const viewRoutes = require('./routes/views');
const authRoutes = require('./routes/auth');

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

// Rotas de views (MVC)
app.use('/', viewRoutes);

// Rotas de autenticação OAuth
app.use('/auth', authRoutes);

// Página 404
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ success: false, message: 'Rota não encontrada' });
  } else {
    res.status(404).send('Página não encontrada');
  }
});

module.exports = app;