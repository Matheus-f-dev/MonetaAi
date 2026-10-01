const express = require('express');
const passport = require('passport');
const AuthService = require('../services/AuthService');
const OAuthExchangeService = require('../services/OAuthExchangeService');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  // Callback customizado (não o atalho `{failureRedirect}`) só pra logar o
  // motivo real de uma falha -- com o atalho, passport engole qualquer erro
  // (secret errado, consent screen mal configurada, etc.) e redireciona em
  // silêncio, sem rastro nenhum no servidor pra debugar.
  (req, res, next) => {
    passport.authenticate('google', (err, user) => {
      if (err || !user) {
        console.error('[auth/google/callback] Falha na troca com o Google:', err?.message || err || 'sem usuário retornado');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
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

      // Achado #12: token de sessão não vai mais na URL (fica em log de
      // acesso/histórico do navegador) -- em vez disso, um código opaco de
      // uso único (60s de validade) que o AuthCallback.jsx troca por
      // token+user via POST em /api/auth/exchange. Ver OAuthExchangeService
      // pro trade-off assumido (código em memória, não sobrevive a múltiplas
      // instâncias do Node).
      //
      // Continua indo pro /login/callback (rota pública, não exige sessão
      // ainda), não direto pro /system -- é o AuthCallback.jsx que sabe
      // completar a troca antes de navegar pro dashboard. NÃO é
      // /auth/callback -- em produção o nginx manda qualquer /auth/* pro
      // backend (onde vivem /auth/google e /auth/google/callback de
      // verdade), e essa rota é do FRONTEND; compartilhar o prefixo
      // /auth/ fazia o nginx engolir a rota do frontend e devolver o 404
      // do Express em vez de servir o SPA.
      const exchangeCode = OAuthExchangeService.issueCode({ token, user: userData });
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login/callback?code=${exchangeCode}`);
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
