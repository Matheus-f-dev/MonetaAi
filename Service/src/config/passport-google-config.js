const GoogleStrategy = require('passport-google-oauth20').Strategy;

function initializePassport(passport, auth, db) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
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
