const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../config/database');
const User = require('../models/User');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '24h';

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Sem fallback hardcoded de propósito — um segredo previsível em
    // produção é pior que o servidor recusar subir sem ele configurado.
    throw new Error('JWT_SECRET não configurada');
  }
  return secret;
}

function issueToken(user) {
  return jwt.sign({ uid: user.id, email: user.email }, requireJwtSecret(), { expiresIn: TOKEN_EXPIRY });
}

class AuthService {
  static async register({ nome, email, senha, salario }) {
    const existing = await User.findByEmail(email);
    if (existing) {
      const err = new Error('Este email já está em uso.');
      err.code = 'EMAIL_IN_USE';
      throw err;
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    const user = await User.create({ nome, email, senhaHash, salario: Number(salario) });
    return user.toJSON();
  }

  static async login(email, senha) {
    const user = await User.findByEmail(email);
    if (!user) {
      const err = new Error('Usuário não encontrado.');
      err.code = 'EMAIL_NOT_FOUND';
      throw err;
    }

    const senhaHash = await User.getSenhaHash(user.id);
    if (!senhaHash) {
      // Conta criada só via Google, nunca teve senha própria
      const err = new Error('Esta conta usa login com Google.');
      err.code = 'NO_PASSWORD_SET';
      throw err;
    }

    const senhaCorreta = await bcrypt.compare(senha, senhaHash);
    if (!senhaCorreta) {
      const err = new Error('Senha incorreta.');
      err.code = 'INVALID_PASSWORD';
      throw err;
    }

    return { user: user.toJSON(), token: issueToken(user) };
  }

  static async getUserById(uid) {
    const user = await User.findById(uid);
    return user ? user.toJSON() : null;
  }

  // Usado pelo Passport na estratégia Google — acha por google_id, senão por
  // e-mail (linka a conta existente), senão cria uma nova sem senha.
  static async findOrCreateGoogleUser({ googleId, email, nome }) {
    let user = await User.findByGoogleId(googleId);
    if (user) return user;

    user = await User.findByEmail(email);
    if (user) {
      return User.update(user.id, { google_id: googleId });
    }

    return User.create({ nome, email, googleId, senhaHash: null, salario: 0 });
  }

  static issueTokenForUser(user) {
    return issueToken(user);
  }

  // ── redefinição de senha (substitui auth.generatePasswordResetLink) ──
  static async createPasswordResetToken(email) {
    const user = await User.findByEmail(email);
    if (!user) {
      const err = new Error('Email não encontrado no sistema.');
      err.code = 'EMAIL_NOT_FOUND';
      throw err;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await db('password_resets').insert({ user_id: user.id, token, expira_em: expiraEm });
    return token;
  }

  static async resetPassword(token, novaSenha) {
    const registro = await db('password_resets').where({ token }).first();
    if (!registro || registro.usado_em || new Date(registro.expira_em) < new Date()) {
      const err = new Error('Link de redefinição inválido ou expirado.');
      err.code = 'INVALID_TOKEN';
      throw err;
    }

    const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
    await User.updateSenha(registro.user_id, senhaHash);
    await db('password_resets').where({ id: registro.id }).update({ usado_em: db.fn.now() });
  }
}

module.exports = AuthService;
