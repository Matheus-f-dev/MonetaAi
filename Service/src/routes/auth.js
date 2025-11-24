const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login` }),
  async (req, res) => {
    try {
      req.session.userId = req.user.uid;
      
      // Criar token JWT para o usuário
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { uid: req.user.uid, email: req.user.email },
        process.env.JWT_SECRET || 'chave-super-secreta',
        { expiresIn: '24h' }
      );
      
      const userData = {
        uid: req.user.uid,
        email: req.user.email,
        nome: req.user.displayName
      };
      
      // Redirecionar com token e dados do usuário
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/system?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (error) {
      console.error('Erro no callback do Google:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
  }
);

router.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy();
    res.redirect('/');
  });
});

module.exports = router;
