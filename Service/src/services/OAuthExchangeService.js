const crypto = require('crypto');

// Achado #12 (sessão de segurança de storage): o JWT do login com Google
// ia direto na query string do redirect -- fica em logs de acesso do
// servidor/proxy e no histórico do navegador. Em vez disso, o callback do
// Google gera um código opaco de USO ÚNICO e curtíssima duração; o
// frontend troca esse código pelo token de verdade via POST (corpo da
// requisição, não URL) em /api/auth/exchange.
//
// Guardado em memória (não numa tabela) de propósito -- o código vive
// no máximo alguns segundos, não precisa sobreviver a um restart do
// processo. Trade-off aceito e documentado: se o deploy rodar múltiplas
// instâncias do Node atrás de um load balancer (PM2 cluster mode, por
// exemplo), o código gerado numa instância não seria encontrado numa
// troca que caísse noutra. Não é o caso hoje (HostGator VPS, um processo
// só via PM2) -- se isso mudar, precisa virar uma tabela/Redis compartilhado.
const CODE_TTL_MS = 60 * 1000;
const codes = new Map();

function issueCode(payload) {
  const code = crypto.randomBytes(24).toString('hex');
  codes.set(code, { payload, expiresAt: Date.now() + CODE_TTL_MS });
  return code;
}

// Uso único: some do Map na primeira troca, válida ou não -- reaproveitar
// um código (ex.: alguém interceptando e tentando trocar de novo depois do
// dono já ter trocado) nunca funciona, mesmo dentro do TTL.
function consumeCode(code) {
  const entry = codes.get(code);
  codes.delete(code);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) return null;
  return entry.payload;
}

// Sem isso, um código gerado mas nunca trocado (usuário fechou a aba no
// meio do redirect) ficaria no Map pra sempre.
setInterval(() => {
  const agora = Date.now();
  for (const [code, entry] of codes) {
    if (agora > entry.expiresAt) codes.delete(code);
  }
}, CODE_TTL_MS).unref();

module.exports = { issueCode, consumeCode };
