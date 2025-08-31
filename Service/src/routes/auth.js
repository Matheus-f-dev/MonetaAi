const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }),
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
      
      // Redirecionar para o frontend com o token
      res.redirect(`http://localhost:5173/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        uid: req.user.uid,
        email: req.user.email,
        displayName: req.user.displayName
      }))}`);
    } catch (error) {
      console.error('Erro no callback do Google:', error);
      res.redirect('http://localhost:5173/login?error=auth_failed');
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
