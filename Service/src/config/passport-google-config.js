const GoogleStrategy = require('passport-google-oauth20').Strategy;

function initializePassport(passport, auth, db) {
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
        // verifica se o usuário já existe no Firebase Auth
        let user;
        try {
          user = await auth.getUserByEmail(profile.emails[0].value);
        } catch (error) {
          user = await auth.createUser({
            email: profile.emails[0].value,
            displayName: profile.displayName
          });

          await db.collection('usuarios').doc(user.uid).set({
            nome: profile.displayName,
            email: profile.emails[0].value,
            perfilCompleto: false,
            criadoEm: new Date()
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }));
  } else {
    console.warn('⚠️  GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET ausentes no .env — login com Google desativado nesta instância.');
  }

  passport.serializeUser((user, done) => {
    done(null, user.uid);
  });

  passport.deserializeUser(async (uid, done) => {
    try {
      const user = await auth.getUser(uid);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}

module.exports = initializePassport;
