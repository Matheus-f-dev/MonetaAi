const app = require('./src/app');
const passport = require('passport');
const { auth, db } = require('./src/config/firebase');

// Inicializa passport com configurações antigas para compatibilidade
const initializePassport = require('./src/config/passport-google-config');
initializePassport(passport, auth, db);

// Define variáveis globais para compatibilidade com rotas antigas
app.locals.auth = auth;
app.locals.db = db;

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
