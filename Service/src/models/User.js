const { db } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.nome = data.nome;
    this.email = data.email;
    this.salario = data.salario;
    this.perfilCompleto = Boolean(data.perfil_completo);
    this.totpAtivo = Boolean(data.totp_ativo);
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
      salario,
      perfil_completo: salario > 0
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
    await db('users').where({ id }).update({ ...fields, atualizado_em: db.fn.now() });
    return User.findById(id);
  }
}

module.exports = User;
