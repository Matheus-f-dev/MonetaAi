const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Antes verificava um ID token do Firebase e não estava plugado em rota
// nenhuma — toda a API confiava cegamente no :userId da URL. Agora verifica
// o JWT próprio (emitido em AuthService) e É aplicado nas rotas protegidas.
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso requerido' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[authenticateToken] JWT_SECRET não configurada');
    return res.status(500).json({ success: false, message: 'Erro de configuração do servidor.' });
  }

  try {
    const decoded = jwt.verify(token, secret); // { uid, email, tv, iat, exp }

    // Token intermediário do fluxo de 2FA (emitido em
    // AuthService.issueTotpPendingToken) -- prova só que a senha foi
    // conferida, nunca deve valer como sessão de verdade em nenhuma rota
    // normal da API. Sem essa checagem, esse token (mesmo segredo, uid
    // válido) passaria batido aqui e o 2FA inteiro seria pulável.
    if (decoded.pendingTotp) {
      return res.status(403).json({ success: false, message: 'Complete a verificação em duas etapas antes de continuar.' });
    }

    // Achado #11: revogação sem blacklist -- compara a versão embutida no
    // token (no momento em que ele foi emitido) com a versão atual do
    // usuário no banco. Troca de senha e exclusão de conta incrementam essa
    // versão (User.bumpTokenVersion), o que invalida instantaneamente
    // qualquer token emitido antes disso, mesmo que ainda não tenha
    // expirado. Token antigo sem o claim `tv` (emitido antes desta
    // mudança) é tratado como versão 0 -- mesmo valor default da coluna,
    // então sessões já abertas continuam válidas até o próximo evento que
    // incrementa a versão.
    const tokenVersion = decoded.tv ?? 0;
    const currentVersion = await User.getTokenVersion(decoded.uid);
    if (currentVersion === null || tokenVersion !== currentVersion) {
      return res.status(403).json({ success: false, message: 'Sessão inválida. Faça login novamente.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token inválido ou expirado' });
  }
};

// Pra rotas cujo dono do recurso é o :userId da própria URL (a maioria dos
// GETs de listagem) — garante que o token pertence a quem está sendo
// consultado, não só que existe ALGUM token válido.
const ensureOwnUser = (paramName = 'userId') => (req, res, next) => {
  if (String(req.user?.uid) !== String(req.params[paramName])) {
    return res.status(403).json({ success: false, message: 'Acesso não autorizado a este recurso.' });
  }
  next();
};

module.exports = { authenticateToken, ensureOwnUser };
