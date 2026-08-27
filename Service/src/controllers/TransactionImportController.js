const multer = require('multer');
const { db } = require('../config/database');
const { parseArquivo } = require('../services/StatementImportService');

// Memória, não disco -- o arquivo só existe pelo tempo da requisição, nunca
// precisa sobreviver além disso. Limite de tamanho generoso o bastante pra
// um extrato de um ano inteiro, sem abrir brecha pra upload gigante/DoS.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).single('arquivo');

function converterDataParaDataHora(dataDDMMYYYY) {
  const agora = new Date();
  const hora = agora.toLocaleTimeString('pt-BR');
  return `${dataDDMMYYYY}, ${hora}`;
}

class TransactionImportController {
  // POST /api/transactions/import/preview?formato=ofx|csv-nubank
  // multipart/form-data, campo "arquivo" -- não grava nada, só devolve a
  // prévia com categoria sugerida (CategoryInference) e um aviso em cada
  // linha cujo external_id já existir pra esse usuário.
  static async preview(req, res) {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message || 'Erro ao processar o arquivo' });
      }

      try {
        const userId = req.user.uid;
        const formato = req.query.formato;

        if (!req.file) {
          return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado (campo "arquivo")' });
        }
        if (!formato) {
          return res.status(400).json({ success: false, message: 'Parâmetro "formato" é obrigatório (ofx ou csv-nubank)' });
        }

        const conteudo = req.file.buffer.toString('utf8');
        const transacoes = parseArquivo(conteudo, formato);

        const externalIds = transacoes.map((t) => t.externalId);
        const existentes = externalIds.length
          ? await db('transactions').where({ user_id: userId }).whereIn('external_id', externalIds).pluck('external_id')
          : [];
        const existentesSet = new Set(existentes);

        const preview = transacoes.map((t) => ({
          ...t,
          jaImportada: existentesSet.has(t.externalId)
        }));

        res.json({
          success: true,
          total: preview.length,
          novas: preview.filter((t) => !t.jaImportada).length,
          jaImportadas: preview.filter((t) => t.jaImportada).length,
          transactions: preview
        });

      } catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Erro ao processar o arquivo' });
      }
    });
  }

  // POST /api/transactions/import/confirm
  // Body: { transactions: [{ externalId, data, descricao, categoria, valor,
  //   tipo, accountId? }], ... } -- a lista revisada/editada pelo usuário
  // depois da prévia. Grava em lote, pula (não erra) qualquer linha cujo
  // external_id já exista pra esse usuário.
  static async confirm(req, res) {
    try {
      const userId = req.user.uid;
      const { transactions } = req.body;

      if (!Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ success: false, message: 'Lista de transações é obrigatória' });
      }

      const resultado = await db.transaction(async (trx) => {
        const importadas = [];
        const puladas = [];

        for (const t of transactions) {
          if (!t.valor || !t.data || !t.tipo) {
            puladas.push({ externalId: t.externalId, motivo: 'dados incompletos' });
            continue;
          }

          if (t.externalId) {
            const existente = await trx('transactions').where({ user_id: userId, external_id: t.externalId }).first();
            if (existente) {
              puladas.push({ externalId: t.externalId, motivo: 'já importada anteriormente' });
              continue;
            }
          }

          const [{ id }] = await trx('transactions').insert({
            user_id: userId,
            tipo: t.tipo,
            valor: Math.abs(parseFloat(t.valor)) || 0,
            descricao: t.descricao || 'Transação importada',
            categoria: t.categoria || 'Outros',
            data_hora: converterDataParaDataHora(t.data),
            account_id: t.accountId || null,
            external_id: t.externalId || null
          }).returning('id');

          importadas.push({ id, externalId: t.externalId });
        }

        return { importadas, puladas };
      });

      res.status(201).json({
        success: true,
        message: `${resultado.importadas.length} transação(ões) importada(s), ${resultado.puladas.length} pulada(s)`,
        ...resultado
      });

    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro ao confirmar importação' });
    }
  }
}

module.exports = TransactionImportController;
