const rateLimit = require('express-rate-limit');

// Login, cadastro e reset de senha são os alvos naturais de brute-force /
// enumeração de e-mail — limite bem mais apertado que o resto da API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas tentativas. Tente novamente em alguns minutos.' }
});

// Resto da API: limite bem mais frouxo, só pra conter abuso/DoS básico —
// uso normal do app (dashboard, listagens) não deve nem chegar perto disso.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas requisições. Tente novamente em alguns minutos.' }
});

module.exports = { authLimiter, apiLimiter };
