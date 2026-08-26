const express = require('express');
const passport = require('passport');
const AuthService = require('../services/AuthService');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login` }),
  async (req, res) => {
    try {
      req.session.userId = req.user.id;

      // req.user aqui é uma instância do model User (MySQL), não mais o
      // UserRecord do Firebase — sem fallback hardcoded de JWT_SECRET, se
      // faltar no .env é melhor falhar alto do que assinar com segredo
      // previsível em produção.
      const token = AuthService.issueTokenForUser(req.user);

      const userData = {
        uid: String(req.user.id),
        email: req.user.email,
        nome: req.user.nome
      };

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
