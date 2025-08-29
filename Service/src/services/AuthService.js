const axios = require('axios');
const { auth } = require('../config/firebase');
const User = require('../models/User');

class AuthService {
  static async register(userData) {
    const { nome, email, senha, salario } = userData;
    
    const user = await auth.createUser({
      email,
      password: senha,
      displayName: nome
    });

    await User.create({
      uid: user.uid,
      nome,
      email,
      salario: Number(salario)
    });

    return { uid: user.uid, nome, email };
  }

  static async login(email, senha) {
    console.log('FIREBASE_API_KEY:', process.env.FIREBASE_API_KEY ? 'Definida' : 'Não definida');
    
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email,
        password: senha,
        returnSecureToken: true
      }
    );

    const authData = response.data;
    const user = await User.findById(authData.localId);
    
    if (!user) {
      throw new Error('Dados do usuário não encontrados');
    }

    return {
      user: {
        uid: user.uid,
        nome: user.nome,
        email: user.email,
        salario: user.salario
      },
      token: authData.idToken
    };
  }

  static async getUserById(uid) {
    return await User.findById(uid);
  }
}

module.exports = AuthService;