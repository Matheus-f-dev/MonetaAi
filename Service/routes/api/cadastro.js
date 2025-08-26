const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  console.log('Dados recebidos:', req.body);
  const { nome, email, senha, confirmar, salario } = req.body;
  const auth = req.app.locals.auth;
  const db = req.app.locals.db;

  if (!nome || !email || !senha || !confirmar || !salario) {
    console.log('Campos faltando:', { nome: !!nome, email: !!email, senha: !!senha, confirmar: !!confirmar, salario: !!salario });
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
    console.log('Salário inválido:', salario, 'convertido para:', salarioNum);
    return res.status(400).json({ 
      success: false, 
      message: 'Informe um salário válido e positivo.' 
    });
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
      salario: salarioNum,
      criadoEm: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso!',
      userId: user.uid
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
});

module.exports = router;