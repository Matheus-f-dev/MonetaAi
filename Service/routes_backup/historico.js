const express = require('express');
const router = express.Router();

router.post('/nova-transacao', async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ erro: 'Usuário não autenticado' });
  }

  const { descricao, valor, categoria, tipo } = req.body;

  if (!descricao || !valor || !categoria || !tipo) {
    return res.status(400).json({ erro: 'Dados incompletos.' });
  }

  const novaTransacao = {
    descricao,
    valor: Number(valor),
    categoria,
    tipo,
    dataHora: new Date().toLocaleString('pt-BR')
  };

  try {
    // grava na subcoleção `historico` do usuário logado
    const docRef = await db
      .collection('usuarios')
      .doc(userId)
      .collection('historico')
      .add(novaTransacao);

    res.status(201).json({ id: docRef.id, ...novaTransacao });
  } catch (err) {
    console.error('Erro ao adicionar transação:', err);
    res.status(500).json({ erro: 'Erro ao adicionar transação.' });
  }
});

router.get('/historico', async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.userId;
  const categoria = req.query.categoria;

  if (!userId) {
    return res.status(401).json({ erro: 'Usuário não autenticado' });
  }

  try {
    let query = db
      .collection('usuarios')
      .doc(userId)
      .collection('historico');

    if (categoria && categoria !== '') {
      query = query.where('categoria', '==', categoria);
    }

    const snapshot = await query.get();
    const historico = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(historico);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar histórico' });
  }
});

router.delete('/historico', async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ erro: 'Usuário não autenticado' });
  }

  try {
    const snapshot = await db
      .collection('usuarios')
      .doc(userId)
      .collection('historico')
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({ mensagem: 'Histórico limpo com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao limpar histórico.' });
  }
});

module.exports = router;
