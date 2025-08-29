const { auth } = require('../config/firebase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();

  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

module.exports = { authenticateToken };