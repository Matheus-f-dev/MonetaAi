const { db } = require('../config/database');

function toApiShape(row) {
  return {
    id: row.id,
    userId: row.user_id,
    nome: row.nome,
    categoria: row.categoria,
    tipoAporte: row.tipo_aporte,
    valorInicial: parseFloat(row.valor_inicial) || 0,
    aporteMensal: parseFloat(row.aporte_mensal) || 0,
    taxaRetornoAnual: parseFloat(row.taxa_retorno_anual) || 0,
    dataInicio: row.data_inicio,
    ativo: Boolean(row.ativo)
  };
}

// Mesma validação nos dois lados (create/update) -- nenhum campo exige
// cálculo nem checagem contra outra tabela (diferente de Goal, que
// confere se accountId é mesmo do usuário), então não tem FK pra validar.
function validarCorpo(body) {
  const { nome, categoria, tipoAporte } = body;
  if (!nome || !categoria) return 'nome e categoria são obrigatórios';
  if (tipoAporte !== 'unico' && tipoAporte !== 'mensal') return 'tipoAporte precisa ser "unico" ou "mensal"';
  return null;
}

function paraColunas(body) {
  const { nome, categoria, tipoAporte, valorInicial, aporteMensal, taxaRetornoAnual, dataInicio } = body;
  return {
    nome,
    categoria,
    tipo_aporte: tipoAporte,
    valor_inicial: parseFloat(valorInicial) || 0,
    // Aporte mensal só faz sentido pro tipo "mensal" -- "unico" sempre
    // grava 0, mesmo que o cliente mande outra coisa (evita o caso de um
    // investimento "único" continuar contando aporte todo mês na
    // projeção por um valor que sobrou de uma edição anterior).
    aporte_mensal: tipoAporte === 'mensal' ? (parseFloat(aporteMensal) || 0) : 0,
    taxa_retorno_anual: parseFloat(taxaRetornoAnual) || 0,
    data_inicio: dataInicio || new Date().toISOString().slice(0, 10)
  };
}

class InvestmentController {
  static async create(req, res) {
    try {
      const userId = req.user.uid;
      const erro = validarCorpo(req.body);
      if (erro) return res.status(400).json({ success: false, message: erro });

      const [{ id }] = await db('investments')
        .insert({ user_id: userId, ...paraColunas(req.body) })
        .returning('id');

      const row = await db('investments').where({ id }).first();
      res.status(201).json({ success: true, message: 'Investimento criado com sucesso', investment: toApiShape(row) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  static async getUserInvestments(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
      }

      const rows = await db('investments').where({ user_id: userId, ativo: true }).orderBy('criado_em', 'asc');
      res.json({ success: true, investments: rows.map(toApiShape) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor', investments: [] });
    }
  }

  static async update(req, res) {
    try {
      const { investmentId } = req.params;
      const userId = req.user.uid;
      const erro = validarCorpo(req.body);
      if (erro) return res.status(400).json({ success: false, message: erro });

      await db('investments')
        .where({ id: investmentId, user_id: userId })
        .update({ ...paraColunas(req.body), atualizado_em: db.fn.now() });

      res.json({ success: true, message: 'Investimento atualizado com sucesso' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  static async delete(req, res) {
    try {
      const { investmentId } = req.params;
      const userId = req.user.uid;
      if (!investmentId) {
        return res.status(400).json({ success: false, message: 'investmentId é obrigatório' });
      }

      await db('investments').where({ id: investmentId, user_id: userId }).update({ ativo: false });
      res.json({ success: true, message: 'Investimento removido com sucesso' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
}

module.exports = InvestmentController;
