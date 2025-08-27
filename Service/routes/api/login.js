const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  console.log('Dados de login recebidos:', req.body);
  const { email, senha } = req.body;
  const auth = req.app.locals.auth;
  const db = req.app.locals.db;

  if (!email || !senha) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email e senha são obrigatórios.' 
    });
  }

  try {
    console.log('Tentando autenticar:', email);
    console.log('API Key presente:', !!process.env.FIREBASE_API_KEY);
    
    // Fazendo requisição para Firebase Auth
    
    try {
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
        {
          email: email,
          password: senha,
          returnSecureToken: true
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Firebase auth success:', response.data);
      const authData = response.data;
      
      // Se chegou aqui, a autenticação foi bem-sucedida
      const user = await auth.getUser(authData.localId);
      
      // Busca dados do usuário no Firestore
      const userDoc = await db.collection('usuarios').doc(user.uid).get();
      
      if (!userDoc.exists) {
        return res.status(400).json({
          success: false,
          message: 'Dados do usuário não encontrados.'
        });
      }

      const userData = userDoc.data();
      
      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso!',
        user: {
          uid: user.uid,
          nome: userData.nome,
          email: userData.email,
          salario: userData.salario
        },
        token: authData.idToken
      });
      
    } catch (firebaseError) {
      console.log('Firebase auth error:', firebaseError.response?.data || firebaseError.message);
      
      let mensagemErro = "Email ou senha incorretos.";
      
      if (firebaseError.response?.data?.error) {
        switch (firebaseError.response.data.error.message) {
          case 'EMAIL_NOT_FOUND':
            mensagemErro = "Usuário não encontrado.";
            break;
          case 'INVALID_PASSWORD':
            mensagemErro = "Senha incorreta.";
            break;
          case 'USER_DISABLED':
            mensagemErro = "Usuário desabilitado.";
            break;
          default:
            mensagemErro = "Email ou senha incorretos.";
        }
      }
      
      return res.status(400).json({
        success: false,
        message: mensagemErro
      });
    }


  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor.'
    });
  }
});

module.exports = router;