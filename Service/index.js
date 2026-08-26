const app = require('./src/app');
const passport = require('passport');

// Sem mais Firebase por trás disso — auth própria (bcrypt + JWT), dados no
// MySQL via Knex (config/database.js).
const initializePassport = require('./src/config/passport-google-config');
initializePassport(passport);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
