const jwt = require('jsonwebtoken');

// Antes verificava um ID token do Firebase e não estava plugado em rota
// nenhuma — toda a API confiava cegamente no :userId da URL. Agora verifica
// o JWT próprio (emitido em AuthService) e É aplicado nas rotas protegidas.
const authenticateToken = (req, res, next) => {
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
    req.user = jwt.verify(token, secret); // { uid, email, iat, exp }
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
