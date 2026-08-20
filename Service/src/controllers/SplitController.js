const { db } = require('../config/firebase');

class SplitController {
  // Agrega, por pessoa, tudo que ela deve/já pagou em despesas divididas
  static async getPeople(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
      }

      // Busca todo o histórico e filtra em memória — evita depender de índice
      // composto do Firestore para um campo opcional (split pode nem existir).
      const snapshot = await db.collection('usuarios').doc(userId).collection('historico').get();

      const peopleMap = {};

      snapshot.forEach(doc => {
        const transaction = doc.data();
        const participantes = transaction.split?.participantes || [];
        if (participantes.length === 0) return;

        participantes.forEach((p, index) => {
          const key = p.nome.trim().toLowerCase();
          if (!peopleMap[key]) {
            peopleMap[key] = { nome: p.nome.trim(), totalDevido: 0, totalPago: 0, itens: [] };
          }

          if (p.pago) {
            peopleMap[key].totalPago += p.valor;
          } else {
            peopleMap[key].totalDevido += p.valor;
          }

          peopleMap[key].itens.push({
            transactionId: doc.id,
            participantIndex: index,
            descricao: transaction.descricao,
            valor: p.valor,
            pago: Boolean(p.pago),
            pagoEm: p.pagoEm || null,
            data: transaction.dataHora
          });
        });
      });

      const people = Object.values(peopleMap).sort((a, b) => b.totalDevido - a.totalDevido);

      res.json({ success: true, people });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor', people: [] });
    }
  }

  // Marca (ou desmarca) um participante de uma transação como pago
  static async setParticipantPaid(req, res) {
    try {
      const { transactionId, participantIndex } = req.params;
      const { userId, pago } = req.body;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId é obrigatório' });
      }

      const docRef = db.collection('usuarios').doc(userId).collection('historico').doc(transactionId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ success: false, message: 'Transação não encontrada' });
      }

      const transaction = doc.data();
      const participantes = transaction.split?.participantes || [];
      const idx = parseInt(participantIndex, 10);

      if (!participantes[idx]) {
        return res.status(404).json({ success: false, message: 'Participante não encontrado' });
      }

      participantes[idx] = {
        ...participantes[idx],
        pago: Boolean(pago),
        pagoEm: pago ? new Date().toISOString() : null
      };

      await docRef.update({ 'split.participantes': participantes });

      res.json({ success: true, message: pago ? 'Marcado como pago' : 'Marcado como pendente' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
}

module.exports = SplitController;
