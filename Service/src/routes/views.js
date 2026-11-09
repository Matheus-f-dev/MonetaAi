const express = require('express');
const router = express.Router();

// O produto de verdade é a SPA em Client/Front -- o backend só expõe a API.
// A raiz apenas redireciona pra ela.
router.get('/', (req, res) => {
  res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
});

module.exports = router;
