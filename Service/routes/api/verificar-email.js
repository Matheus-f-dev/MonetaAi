const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { email } = req.body;
  const auth = req.app.locals.auth;

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email é obrigatório.' 
    });
  }

  try {
    await auth.getUserByEmail(email);
    // Se chegou aqui, o email existe
    res.json({
      success: false,
      exists: true,
      message: 'Este email já está em uso.'
    });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      // Email não existe, pode usar
      res.json({
        success: true,
        exists: false,
        message: 'Email disponível.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar email.'
      });
    }
  }
});

module.exports = router;