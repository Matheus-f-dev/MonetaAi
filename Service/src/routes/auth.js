const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }),
  async (req, res) => {
    try {
      req.session.userId = req.user.uid;
      const db = req.app.locals.db;
      
      // Verificar se o perfil está completo
      const userDoc = await db.collection('usuarios').doc(req.user.uid).get();
      const userData = userDoc.data();
      
      if (!userData.perfilCompleto || !userData.salario) {
        return res.redirect('/completar-perfil');
      }
      
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
        nome: req.user.displayName
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
