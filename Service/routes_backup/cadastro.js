const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('cadastro', { erro: null });
});

router.post('/', async (req, res) => {
  const { nome, email, senha, confirmar, salario } = req.body;
  const auth = req.app.locals.auth;
  const db = req.app.locals.db;

  console.log("📥 Dados recebidos:", req.body);

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

    console.log("🔐 Usuário criado:", user.uid);

    await db.collection('usuarios').doc(user.uid).set({
      nome,
      email,
      salario: Number(salario),
      criadoEm: new Date()
    });

    console.log("✅ Dados salvos no Firestore!");

    // manda para a página de cadastro concluído
    res.render('cadastro-concluido');

  } catch (err) {
    console.log("❌ Erro Firebase:", err);
    let mensagemErro = "Erro ao cadastrar.";

    if (err.code === "auth/email-already-exists") {
      mensagemErro = "❌ Este email já está em uso.";
    } else if (err.code === "auth/invalid-email") {
      mensagemErro = "❌ Email inválido.";
    } else if (err.message) {
      mensagemErro += " " + err.message;
    }

    res.render('cadastro', { erro: mensagemErro });
  }
});

module.exports = router;
