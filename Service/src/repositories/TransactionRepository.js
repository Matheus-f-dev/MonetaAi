const { db } = require('../config/database');

// Antes: buscava a subcoleção inteira do Firestore e filtrava tudo em
// memória no Node (nenhum .where() era usado). Agora os filtros viram
// WHERE de verdade — mesmo comportamento de negócio, com o banco fazendo
// o trabalho que ele é bom em fazer.
class TransactionRepository {
  async create(userId, transactionData, splitParticipantes = null) {
    const [{ id }] = await db('transactions').insert({ ...transactionData, user_id: userId }).returning('id');

    if (splitParticipantes?.length) {
      await db('split_participants').insert(
        splitParticipantes.map((p) => ({
          transaction_id: id,
          nome: p.nome,
          valor: p.valor,
          pago: Boolean(p.pago),
          pago_em: p.pago ? db.fn.now() : null
        }))
      );
    }

    return this.findById(userId, id);
  }

  async findByUserId(userId, filters = {}) {
    let query = db('transactions').where({ user_id: userId });

    if (filters.startDate && filters.endDate) {
      // data_hora é guardada como string "dd/mm/yyyy, HH:MM:SS" — comparar
      // como texto não ordena certo, então convertemos pra data no SQL.
      query = query.whereRaw(
        "TO_DATE(SPLIT_PART(data_hora, ',', 1), 'DD/MM/YYYY') BETWEEN ? AND ?",
        [filters.startDate, filters.endDate]
      );
    }
    if (filters.category) query = query.where({ categoria: filters.category });
    if (filters.type) query = query.where({ tipo: filters.type.toLowerCase() });
    if (filters.accountId) query = query.where({ account_id: filters.accountId });

    const rows = await query.orderBy('data_hora', 'desc');
    return this._attachSplits(rows);
  }

  async findById(userId, transactionId) {
    const row = await db('transactions').where({ id: transactionId, user_id: userId }).first();
    if (!row) return null;
    const [withSplit] = await this._attachSplits([row]);
    return withSplit;
  }

  async update(userId, transactionId, updateData, splitParticipantes) {
    // Checagem de dono antes de mexer em split_participants: o UPDATE de
    // `transactions` logo abaixo já é escopado por `user_id` (não afeta
    // nada se a transação for de outro usuário), mas um DELETE/INSERT em
    // `split_participants` filtrado só por `transaction_id` não teria essa
    // proteção -- bastaria adivinhar/vazar o id de uma transação alheia
    // pra apagar a divisão dela. `first('id')` sem mais nada só confirma
    // que a linha existe E pertence a esse usuário.
    const owns = await db('transactions').where({ id: transactionId, user_id: userId }).first('id');
    if (!owns) return null;

    if (Object.keys(updateData).length > 0) {
      await db('transactions').where({ id: transactionId, user_id: userId }).update(updateData);
    }

    // undefined (chave "split" nem veio no corpo da requisição) preserva o
    // que já existia -- só mexe na tabela quando o cliente mandou a lista
    // explicitamente (mesmo que vazia, pra permitir remover a divisão).
    if (splitParticipantes !== undefined) {
      await db('split_participants').where({ transaction_id: transactionId }).del();
      if (splitParticipantes?.length) {
        await db('split_participants').insert(
          splitParticipantes.map((p) => ({
            transaction_id: transactionId,
            nome: p.nome,
            valor: p.valor,
            pago: Boolean(p.pago),
            pago_em: p.pago ? db.fn.now() : null
          }))
        );
      }
    }

    return this.findById(userId, transactionId);
  }

  async delete(userId, transactionId) {
    return db('transactions').where({ id: transactionId, user_id: userId }).del();
  }

  // Busca todas as transações "cruas" (sem filtro) — usado por telas que
  // precisam do histórico inteiro pra agregar (resumo de contas, alertas...).
  async findAllRaw(userId) {
    const rows = await db('transactions').where({ user_id: userId });
    return this._attachSplits(rows);
  }

  async _attachSplits(rows) {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const splits = await db('split_participants').whereIn('transaction_id', ids);
    const byTransaction = {};
    splits.forEach((s) => {
      if (!byTransaction[s.transaction_id]) byTransaction[s.transaction_id] = [];
      byTransaction[s.transaction_id].push({
        nome: s.nome,
        valor: parseFloat(s.valor),
        pago: Boolean(s.pago),
        pagoEm: s.pago_em
      });
    });

    return rows.map((row) => ({
      ...row,
      valor: parseFloat(row.valor),
      split: byTransaction[row.id] ? { participantes: byTransaction[row.id] } : null
    }));
  }
}

module.exports = TransactionRepository;
