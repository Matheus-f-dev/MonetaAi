class AuthViewController {
  static renderLogin(req, res) {
    res.render('login', { erro: null, tipo: null });
  }

  static async verifyEmail(req, res) {
    const { email } = req.body;
    const auth = req.app.locals.auth;

    try {
      await auth.getUserByEmail(email);
      return res.status(200).json({ ok: true });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        return res.status(404).json({ erro: '❌ E-mail não cadastrado. Cadastre-se.' });
      }
      console.error('Erro ao verificar e-mail:', err);
      return res.status(500).json({ erro: 'Erro ao verificar e-mail. Tente novamente.' });
    }
  }

  static async login(req, res) {
    const { email, senha } = req.body;
    const auth = req.app.locals.auth;

    try {
      const user = await auth.getUserByEmail(email);

      if (!user) {
        return res.render('login', { erro: '❌ E-mail não cadastrado. Cadastre-se.', tipo: 'erro' });
      }

      req.session.userId = user.uid;
      return res.redirect('/historico-page');

    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        return res.render('login', { erro: '❌ E-mail não cadastrado. Cadastre-se.', tipo: 'erro' });
      }
      console.error('Erro ao autenticar:', err);
      return res.render('login', { erro: '❌ Erro ao verificar login.', tipo: 'erro' });
    }
  }

  static renderCadastro(req, res) {
    res.render('cadastro', { erro: null });
  }

  static async cadastro(req, res) {
    const { nome, email, senha, confirmar, salario } = req.body;
    const auth = req.app.locals.auth;
    const db = req.app.locals.db;

    if (!nome || !email || !senha || !confirmar || !salario) {
      return res.render('cadastro', { erro: '⚠ Preencha todos os campos.' });
    }

    if (senha.length < 6) {
      return res.render('cadastro', { erro: '❌ A senha deve ter pelo menos 6 caracteres.' });
    }

    if (senha !== confirmar) {
      return res.render('cadastro', { erro: '❌ As senhas não coincidem.' });
    }

    if (isNaN(salario) || Number(salario) <= 0) {
      return res.render('cadastro', { erro: '❌ Informe um salário válido e positivo.' });
    }

    try {
      const user = await auth.createUser({
        email,
        password: senha,
        displayName: nome
      });

      await db.collection('usuarios').doc(user.uid).set({
        nome,
        email,
        salario: Number(salario),
        perfilCompleto: true,
        criadoEm: new Date()
      });

      res.render('cadastro-concluido');

    } catch (err) {
      let mensagemErro = "Erro ao cadastrar.";

      if (err.code === "auth/email-already-exists") {
        mensagemErro = "❌ Este email já está em uso.";
      } else if (err.code === "auth/invalid-email") {
        mensagemErro = "❌ Email inválido.";
      }

      res.render('cadastro', { erro: mensagemErro });
    }
  }

  static renderCadastroConcluido(req, res) {
    res.render('cadastro-concluido', { redirectToLogin: true });
  }

  static renderEsqueciSenha(req, res) {
    res.render('esqueci-senha');
  }

  static renderCompletarPerfil(req, res) {
    res.render('completar-perfil', { erro: null });
  }

  static async completarPerfil(req, res) {
    const { salario } = req.body;
    const userId = req.session.userId;
    const db = req.app.locals.db;

    if (!userId) {
      return res.redirect('/login');
    }

    if (!salario || isNaN(salario) || Number(salario) <= 0) {
      return res.render('completar-perfil', { erro: '❌ Informe um salário válido e positivo.' });
    }

    try {
      await db.collection('usuarios').doc(userId).update({
        salario: Number(salario),
        perfilCompleto: true,
        atualizadoEm: new Date()
      });

      res.redirect('http://localhost:5173/system');
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      res.render('completar-perfil', { erro: 'Erro ao salvar dados. Tente novamente.' });
    }
  }
}

module.exports = AuthViewController;