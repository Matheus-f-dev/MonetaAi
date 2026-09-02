const { db } = require('../config/database');
const CryptoService = require('../services/CryptoService');

// Decifra o salário lido do banco -- centralizado aqui pra ser o único
// lugar do model que sabe que a coluna é cifrada (achado #3: dado pessoal
// sensível, cifrado em repouso desde a migration encrypt_users_salario).
// `salario` pode ser null (registro anonimizado por deleteAccount, ou
// nunca preenchido) -- não tenta decifrar nesse caso.
function decryptSalario(row) {
  if (row.salario === null || row.salario === undefined) return 0;
  return Number(CryptoService.decrypt(row.salario));
}

class User {
  constructor(data) {
    this.id = data.id;
    this.nome = data.nome;
    this.email = data.email;
    this.salario = decryptSalario(data);
    this.perfilCompleto = Boolean(data.perfil_completo);
    this.totpAtivo = Boolean(data.totp_ativo);
    this.tokenVersion = data.token_version;
    this.criadoEm = data.criado_em;
  }

  // Nunca expõe senha_hash/google_id/totp_secret pra fora do model --
  // totpAtivo (só o booleano) é seguro de expor, o frontend precisa saber
  // se 2FA está ligado pra mostrar a UI certa.
  toJSON() {
    return {
      uid: String(this.id),
      nome: this.nome,
      email: this.email,
      salario: this.salario,
      perfilCompleto: this.perfilCompleto,
      totpAtivo: this.totpAtivo
    };
  }

  static async create({ nome, email, senhaHash = null, googleId = null, salario = 0 }) {
    const [{ id }] = await db('users').insert({
      nome,
      email,
      senha_hash: senhaHash,
      google_id: googleId,
      salario: CryptoService.encrypt(String(salario)),
      perfil_completo: salario > 0 // calculado antes de cifrar -- comparação numérica não funciona no texto cifrado
    }).returning('id');
    return User.findById(id);
  }

  static async findById(id) {
    const row = await db('users').where({ id }).first();
    return row ? new User(row) : null;
  }

  static async findByEmail(email) {
    const row = await db('users').where({ email }).first();
    return row ? new User(row) : null;
  }

  static async findByGoogleId(googleId) {
    const row = await db('users').where({ google_id: googleId }).first();
    return row ? new User(row) : null;
  }

  // Só uso interno (verificação de senha) — nunca sai como toJSON()
  static async getSenhaHash(id) {
    const row = await db('users').where({ id }).first('senha_hash');
    return row?.senha_hash || null;
  }

  // Só uso interno (verificação de código TOTP) — nunca sai como toJSON()
  static async getTotpSecret(id) {
    const row = await db('users').where({ id }).first('totp_secret');
    return row?.totp_secret || null;
  }

  static async updateSenha(id, senhaHash) {
    await db('users').where({ id }).update({ senha_hash: senhaHash, atualizado_em: db.fn.now() });
  }

  static async update(id, fields) {
    // Se algum chamador futuro atualizar salario por aqui, cifra antes de
    // gravar -- ninguém fora deste model deveria saber que a coluna é cifrada.
    const dadosParaGravar = { ...fields };
    if ('salario' in dadosParaGravar) {
      dadosParaGravar.salario = CryptoService.encrypt(String(dadosParaGravar.salario));
    }
    await db('users').where({ id }).update({ ...dadosParaGravar, atualizado_em: db.fn.now() });
    return User.findById(id);
  }

  // Só uso interno (middleware/auth.js) -- consulta enxuta, sem decifrar
  // salario à toa em todo request autenticado só pra comparar um inteiro.
  static async getTokenVersion(id) {
    const row = await db('users').where({ id }).first('token_version');
    return row ? row.token_version : null;
  }

  static async bumpTokenVersion(id, trx = null) {
    const conexao = trx || db;
    await conexao('users').where({ id }).increment('token_version', 1);
  }
}

module.exports = User;
