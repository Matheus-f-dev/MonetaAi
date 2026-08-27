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

      // 8, não 6 -- alinhado com a validação que o frontend já faz
      // (ValidationStrategy.js). Antes o backend aceitava uma senha mais
      // fraca do que a própria UI permitia digitar.
      if (senha.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'A senha deve ter pelo menos 8 caracteres.'
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
        console.error('[AuthController.register] Auto-login falhou:', loginErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Cadastro realizado com sucesso!',
        userId: user.uid,
        ...(session ? { user: session.user, token: session.token } : {})
      });

    } catch (err) {
      if (err.code === 'JWT_SECRET_MISSING' || err.message?.includes('JWT_SECRET')) {
        console.error('[AuthController.register] Erro de configuração:', err.message);
        return res.status(500).json({ success: false, message: 'Erro de configuração do servidor. Contate o suporte.' });
      }

      const mensagemErro = err.code === 'EMAIL_IN_USE' ? err.message : 'Erro ao cadastrar.';
      res.status(400).json({ success: false, message: mensagemErro });
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
        message: result.requiresTotp ? 'Senha correta — informe o código de verificação.' : 'Login realizado com sucesso!',
        ...result
      });

    } catch (err) {
      // Erro de configuração do servidor (ex: JWT_SECRET ausente) não é a
      // mesma coisa que senha errada — mascarar os dois com a mesma
      // mensagem já custou tempo real de debug numa rodada anterior desse
      // mesmo bug (só que com FIREBASE_API_KEY). Loga alto e distingue.
      if (err.message?.includes('JWT_SECRET')) {
        console.error('[AuthController.login] Erro de configuração:', err.message);
        return res.status(500).json({ success: false, message: 'Erro de configuração do servidor. Contate o suporte.' });
      }

      // EMAIL_NOT_FOUND e INVALID_PASSWORD respondem com a MESMA mensagem
      // genérica de propósito — mensagens diferentes permitiam descobrir
      // quais e-mails têm conta só de tentar logar (user enumeration).
      // NO_PASSWORD_SET foge da regra: não é uma tentativa de adivinhar
      // e-mail, é orientar quem já sabe que a conta existe a usar o botão certo.
      const mensagens = {
        NO_PASSWORD_SET: 'Esta conta usa login com Google — entre pelo botão do Google.'
      };

      const codigosEsperados = ['EMAIL_NOT_FOUND', 'INVALID_PASSWORD', 'NO_PASSWORD_SET'];
      if (!codigosEsperados.includes(err.code)) {
        console.error('[AuthController.login] Erro inesperado:', err.message);
      }

      res.status(400).json({
        success: false,
        message: mensagens[err.code] || 'Email ou senha incorretos.'
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

      res.status(200).json({ success: true, user });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor.'
      });
    }
  }

  static async esqueciSenha(req, res) {
    // Resposta é SEMPRE a mesma, exista ou não o e-mail — um 404 diferente
    // aqui era um jeito trivial de descobrir quais e-mails têm conta
    // (user enumeration). O e-mail só é de fato enviado se a conta existir;
    // quem não tem conta simplesmente não recebe nada, em silêncio.
    const respostaGenerica = { success: true, message: 'Se esse email estiver cadastrado, enviamos um link de redefinição.' };

    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email é obrigatório.' });
      }

      const token = await AuthService.createPasswordResetToken(email);

      const EmailService = require('../services/EmailService');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      await new EmailService().enviarLinkRedefinicao(email, `${frontendUrl}/redefinir-senha?token=${token}`);

      res.json(respostaGenerica);

    } catch (err) {
      if (err.code === 'EMAIL_NOT_FOUND') {
        return res.json(respostaGenerica);
      }
      console.error('[AuthController.esqueciSenha]', err.message);
      res.status(500).json({ success: false, message: 'Erro ao enviar link de redefinição.' });
    }
  }

  static async redefinirSenha(req, res) {
    try {
      const { token, novaSenha } = req.body;
      if (!token || !novaSenha) {
        return res.status(400).json({ success: false, message: 'Token e nova senha são obrigatórios.' });
      }
      if (novaSenha.length < 8) {
        return res.status(400).json({ success: false, message: 'A senha deve ter pelo menos 8 caracteres.' });
      }

      await AuthService.resetPassword(token, novaSenha);
      res.json({ success: true, message: 'Senha redefinida com sucesso!' });

    } catch (err) {
      res.status(400).json({ success: false, message: err.message || 'Não foi possível redefinir a senha.' });
    }
  }

  // Segunda etapa do login quando a conta tem 2FA ativo -- recebe o
  // tempToken devolvido por login() e o código do app autenticador.
  static async loginTotp(req, res) {
    try {
      const { tempToken, code } = req.body;
      if (!tempToken || !code) {
        return res.status(400).json({ success: false, message: 'tempToken e code são obrigatórios.' });
      }

      const result = await AuthService.completeTotpLogin(tempToken, code);
      res.status(200).json({ success: true, message: 'Login realizado com sucesso!', ...result });

    } catch (err) {
      const mensagens = {
        INVALID_TEMP_TOKEN: err.message,
        INVALID_TOTP_CODE: 'Código de verificação inválido.'
      };
      res.status(400).json({ success: false, message: mensagens[err.code] || 'Não foi possível concluir o login.' });
    }
  }
}

module.exports = AuthController;
