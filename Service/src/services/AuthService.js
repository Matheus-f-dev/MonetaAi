const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const { db } = require('../config/database');
const User = require('../models/User');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '24h';
const TOTP_TEMP_TOKEN_EXPIRY = '5m';

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

// Token de curtíssima duração pra segurar o "meio do login" quando 2FA está
// ativo -- prova que a senha já foi conferida, sem ainda ser um token de
// sessão de verdade. O claim `pendingTotp: true` é rejeitado explicitamente
// em middleware/auth.js -- sem isso, esse token (assinado com o mesmo
// segredo, com uid válido) seria aceito por engano como um Bearer normal
// em qualquer rota da API, e dava pra pular o 2FA inteiro só usando ele
// direto em vez de completar /login/totp.
function issueTotpPendingToken(user) {
  return jwt.sign({ uid: user.id, pendingTotp: true }, requireJwtSecret(), { expiresIn: TOTP_TEMP_TOKEN_EXPIRY });
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

    // 2FA ativo: senha confere, mas o JWT de verdade só sai depois do
    // segundo fator (POST /login/totp). Devolve um token de 5min que só
    // serve pra completar essa segunda etapa -- ver issueTotpPendingToken.
    if (user.totpAtivo) {
      return { requiresTotp: true, tempToken: issueTotpPendingToken(user) };
    }

    return { user: user.toJSON(), token: issueToken(user) };
  }

  // Segunda etapa do login quando 2FA está ativo -- valida o tempToken (só
  // prova que a senha já foi conferida) + o código TOTP do momento, e só
  // aí emite o JWT de sessão de verdade.
  static async completeTotpLogin(tempToken, code) {
    let payload;
    try {
      payload = jwt.verify(tempToken, requireJwtSecret());
    } catch {
      const err = new Error('Sessão de login expirada, faça login novamente.');
      err.code = 'INVALID_TEMP_TOKEN';
      throw err;
    }

    if (!payload.pendingTotp) {
      const err = new Error('Token inválido para esta operação.');
      err.code = 'INVALID_TEMP_TOKEN';
      throw err;
    }

    const user = await User.findById(payload.uid);
    if (!user || !user.totpAtivo) {
      const err = new Error('Token inválido para esta operação.');
      err.code = 'INVALID_TEMP_TOKEN';
      throw err;
    }

    const secret = await User.getTotpSecret(user.id);
    const valido = speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 1 });
    if (!valido) {
      const err = new Error('Código de verificação inválido.');
      err.code = 'INVALID_TOTP_CODE';
      throw err;
    }

    return { user: user.toJSON(), token: issueToken(user) };
  }

  // ── 2FA (TOTP) — setup/confirmação/desativação ──
  static async setupTotp(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('Usuário não encontrado.');
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    const { base32, otpauth_url } = speakeasy.generateSecret({
      name: `Moneta (${user.email})`,
      length: 20
    });

    // Guarda o secret já, mas totp_ativo continua false até o usuário
    // provar (em confirmTotp) que configurou certo no app autenticador --
    // gerar o QR sozinho não é prova de posse nenhuma.
    await User.update(userId, { totp_secret: base32 });

    return { secret: base32, otpauthUrl: otpauth_url };
  }

  static async confirmTotp(userId, code) {
    const secret = await User.getTotpSecret(userId);
    if (!secret) {
      const err = new Error('Nenhuma configuração de 2FA pendente. Chame o setup primeiro.');
      err.code = 'TOTP_NOT_SETUP';
      throw err;
    }

    const valido = speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 1 });
    if (!valido) {
      const err = new Error('Código de verificação inválido.');
      err.code = 'INVALID_TOTP_CODE';
      throw err;
    }

    await User.update(userId, { totp_ativo: true });
  }

  // Exige o código TOTP atual pra desativar -- só ter um JWT válido não
  // basta (é justamente o cenário que o 2FA existe pra proteger: alguém com
  // o token mas sem acesso ao app autenticador não pode desligar a proteção).
  static async disableTotp(userId, code) {
    const secret = await User.getTotpSecret(userId);
    if (!secret) {
      const err = new Error('2FA não está ativo para este usuário.');
      err.code = 'TOTP_NOT_ACTIVE';
      throw err;
    }

    const valido = speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 1 });
    if (!valido) {
      const err = new Error('Código de verificação inválido.');
      err.code = 'INVALID_TOTP_CODE';
      throw err;
    }

    await User.update(userId, { totp_ativo: false, totp_secret: null });
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
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000); // 1h

    // Só o hash vai pro banco — o token cru some depois de enviado no
    // e-mail (chamador desta função), nunca fica persistido em lugar nenhum.
    await db('password_resets').insert({ user_id: user.id, token_hash: tokenHash, expira_em: expiraEm });
    return token;
  }

  static async resetPassword(token, novaSenha) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const registro = await db('password_resets').where({ token_hash: tokenHash }).first();
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
