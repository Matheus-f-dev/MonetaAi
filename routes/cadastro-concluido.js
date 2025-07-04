// routes/cadastro-concluido.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('cadastro-concluido');
});

module.exports = router;

