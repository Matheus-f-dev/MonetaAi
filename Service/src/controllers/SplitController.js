const { db } = require('../config/database');

class SplitController {
  // Agrega, por pessoa, tudo que ela deve/já pagou em despesas divididas
  static async getPeople(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
      }

      const rows = await db('split_participants as sp')
        .join('transactions as t', 't.id', 'sp.transaction_id')
        .where('t.user_id', userId)
        .orderBy('sp.id', 'asc')
        .select('sp.id as participant_id', 'sp.transaction_id', 'sp.nome', 'sp.valor', 'sp.pago', 'sp.pago_em', 't.descricao', 't.data_hora');

      const peopleMap = {};

      rows.forEach((row) => {
        const key = row.nome.trim().toLowerCase();
        if (!peopleMap[key]) {
          peopleMap[key] = { nome: row.nome.trim(), totalDevido: 0, totalPago: 0, itens: [] };
        }

        const valor = parseFloat(row.valor) || 0;
        if (row.pago) {
          peopleMap[key].totalPago += valor;
        } else {
          peopleMap[key].totalDevido += valor;
        }

        peopleMap[key].itens.push({
          transactionId: row.transaction_id,
          participantId: row.participant_id,
          descricao: row.descricao,
          valor,
          pago: Boolean(row.pago),
          pagoEm: row.pago_em,
          data: row.data_hora
        });
      });

      const people = Object.values(peopleMap).sort((a, b) => b.totalDevido - a.totalDevido);

      res.json({ success: true, people });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor', people: [] });
    }
  }

  // Marca (ou desmarca) um participante de uma transação como pago.
  // A rota ainda recebe `participantIndex` (posição, herdada de quando o
  // split era um array dentro do documento Firestore) — traduzimos pra o
  // registro real ordenando por id de inserção, assim o contrato da API
  // não muda e o frontend não precisa saber que virou uma tabela própria.
  static async setParticipantPaid(req, res) {
    try {
      const { transactionId, participantIndex } = req.params;
      const { userId, pago } = req.body;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId é obrigatório' });
      }

      const transaction = await db('transactions').where({ id: transactionId, user_id: userId }).first();
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transação não encontrada' });
      }

      const participantes = await db('split_participants').where({ transaction_id: transactionId }).orderBy('id', 'asc');
      const idx = parseInt(participantIndex, 10);
      const alvo = participantes[idx];

      if (!alvo) {
        return res.status(404).json({ success: false, message: 'Participante não encontrado' });
      }

      await db('split_participants').where({ id: alvo.id }).update({
        pago: Boolean(pago),
        pago_em: pago ? db.fn.now() : null
      });

      res.json({ success: true, message: pago ? 'Marcado como pago' : 'Marcado como pendente' });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
}

module.exports = SplitController;
