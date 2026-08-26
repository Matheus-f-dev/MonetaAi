const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AuthService = require('../services/AuthService');
const User = require('../models/User');

function initializePassport(passport) {
  // Login com Google é opcional em dev local — sem GOOGLE_CLIENT_ID/SECRET no
  // .env, só pula o registro da estratégia em vez de derrubar o servidor
  // inteiro (login por e-mail/senha e todo o resto da API continuam de pé).
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await AuthService.findOrCreateGoogleUser({
          googleId: profile.id,
          email: profile.emails[0].value,
          nome: profile.displayName
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }));
  } else {
    console.warn('⚠️  GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET ausentes no .env — login com Google desativado nesta instância.');
  }

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}

module.exports = initializePassport;
