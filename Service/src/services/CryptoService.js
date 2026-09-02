const crypto = require('crypto');

// AES-256-GCM na camada de aplicação, pra criptografar campos sensíveis em
// repouso (hoje só `users.salario` -- achado #3 da sessão de segurança de
// storage) sem depender de uma extensão do Postgres (pgcrypto). A chave
// nunca deve ser a mesma coisa que JWT_SECRET/SESSION_SECRET -- comprometer
// uma não deveria comprometer a outra.
//
// Formato armazenado: "<iv base64>:<authTag base64>:<ciphertext base64>".
// GCM exige um IV novo a cada operação (nunca reusar) -- por isso ele vai
// junto do texto cifrado, não é segredo em si.
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey() {
  const raw = process.env.SALARY_ENCRYPTION_KEY;
  if (!raw) {
    // Mesmo raciocínio do JWT_SECRET: sem fallback hardcoded. Preferível
    // falhar alto (quem tentar ler/gravar salario percebe na hora) a
    // silenciosamente gravar em texto puro ou com uma chave previsível.
    throw new Error('SALARY_ENCRYPTION_KEY não configurada');
  }
  const key = Buffer.from(raw, 'hex');
  if (key.length !== 32) {
    throw new Error('SALARY_ENCRYPTION_KEY precisa ser uma string hex de 32 bytes (64 caracteres) -- gere com crypto.randomBytes(32).toString("hex")');
  }
  return key;
}

function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

function decrypt(payload) {
  if (!payload) return null;
  const key = getKey();
  const [ivB64, authTagB64, ciphertextB64] = payload.split(':');
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error('Payload cifrado em formato inesperado');
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64')),
    decipher.final()
  ]);
  return plaintext.toString('utf8');
}

module.exports = { encrypt, decrypt };
