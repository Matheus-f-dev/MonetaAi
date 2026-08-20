const AuthService = require('../services/AuthService');

class AuthController {
  static async register(req, res) {
    try {
      const { nome, email, senha, confirmar, salario } = req.body;

      if (!nome || !email || !senha || !confirmar || salario === '' || salario === null || salario === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'Preencha todos os campos.' 
        });
      }

      if (senha.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'A senha deve ter pelo menos 6 caracteres.' 
        });
      }

      if (senha !== confirmar) {
        return res.status(400).json({ 
          success: false, 
          message: 'As senhas não coincidem.' 
        });
      }

      const salarioNum = Number(salario);
      if (isNaN(salarioNum) || salarioNum <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Informe um salário válido e positivo.' 
        });
      }

      const user = await AuthService.register({ nome, email, senha, salario: salarioNum });

      // Auto-login: a conta acabou de ser criada com essa senha, não faz
      // sentido mandar o usuário digitar tudo de novo na tela de login.
      let session = null;
      try {
        session = await AuthService.login(email, senha);
      } catch (loginErr) {
        // Cadastro já foi feito com sucesso — se o login automático falhar
        // (ex: FIREBASE_API_KEY ausente), não desfaz o cadastro, só avisa
        // que vai precisar entrar manualmente.
        console.error('[AuthController.register] Auto-login falhou:', loginErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Cadastro realizado com sucesso!',
        userId: user.uid,
        ...(session ? { user: session.user, token: session.token } : {})
      });

    } catch (err) {
      let mensagemErro = "Erro ao cadastrar.";

      if (err.code === "auth/email-already-exists") {
        mensagemErro = "Este email já está em uso.";
      } else if (err.code === "auth/invalid-email") {
        mensagemErro = "Email inválido.";
      }

      res.status(400).json({
        success: false,
        message: mensagemErro
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email e senha são obrigatórios.' 
        });
      }

      const result = await AuthService.login(email, senha);

      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso!',
        ...result
      });

    } catch (err) {
      // Erro de configuração do servidor (ex: FIREBASE_API_KEY ausente) não é
      // a mesma coisa que senha errada — mascarar os dois com a mesma
      // mensagem já custou tempo real de debug. Loga alto e distingue.
      if (!err.response && err.message?.includes('FIREBASE_API_KEY')) {
        console.error('[AuthController.login] Erro de configuração:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Erro de configuração do servidor. Contate o suporte.'
        });
      }

      let mensagemErro = "Email ou senha incorretos.";

      if (err.response?.data?.error) {
        switch (err.response.data.error.message) {
          case 'EMAIL_NOT_FOUND':
            mensagemErro = "Usuário não encontrado.";
            break;
          case 'INVALID_PASSWORD':
            mensagemErro = "Senha incorreta.";
            break;
          case 'USER_DISABLED':
            mensagemErro = "Usuário desabilitado.";
            break;
        }
      } else {
        console.error('[AuthController.login] Erro inesperado:', err.message);
      }

      res.status(400).json({
        success: false,
        message: mensagemErro
      });
    }
  }

  static async getUserById(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await AuthService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado.'
        });
      }

      res.status(200).json({
        success: true,
        user: {
          uid: user.uid,
          nome: user.nome,
          email: user.email,
          salario: user.salario
        }
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor.'
      });
    }
  }
}

module.exports = AuthController;