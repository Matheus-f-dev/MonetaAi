const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('../openapi.json');
const corsMiddleware = require('./middleware/cors');
const apiRoutes = require('./routes/api');
const viewRoutes = require('./routes/views');
const authRoutes = require('./routes/auth');

const app = express();

// Atrás de 1 proxy reverso (nginx, na VPS) -- sem isso, req.ip não reflete
// o IP real de quem fez a requisição (vira sempre o IP do próprio nginx,
// já que a conexão TCP que o Node vê é local), e o express-rate-limit
// (authLimiter/apiLimiter em middleware/rateLimit.js) se recusa a
// funcionar quando vê X-Forwarded-For sem essa configuração -- por
// segurança, ele não confia num header que qualquer cliente pode forjar
// pra contornar o limite, e derruba a request com
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR em vez de aplicar o limite errado
// silenciosamente. Isso batia em toda requisição real que passasse pelo
// nginx, causando o crash-loop do PM2 em produção.
app.set('trust proxy', 1);

// Middlewares
app.use(helmet());
app.use(corsMiddleware);
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sem fallback hardcoded de propósito — mesmo raciocínio do JWT_SECRET
// (Service/src/services/AuthService.js): um segredo de sessão previsível e
// público (estava craveado no código, indo pro repo público) permite forjar
// qualquer cookie de sessão.
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET não configurada — defina no .env antes de subir o servidor.');
}

// Configurações de sessão
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Rotas da API (MVC)
app.use('/api', apiRoutes);

// Rotas de views (MVC)
app.use('/', viewRoutes);

// Rotas de autenticação OAuth
app.use('/auth', authRoutes);

// Documentação interativa da API (Swagger/OpenAPI) -- gerada a partir de
// todas as rotas em src/routes/. GET /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  customSiteTitle: 'Moneta API — Documentação'
}));

// Página 404
app.use((req, res) => {
  res.status(404).send('Página não encontrada');
});

// Error handler central — sem isso, o handler padrão do Express expõe
// stack trace com caminho absoluto do servidor pra qualquer requisição que
// dispare um erro (ex.: origem bloqueada pelo CORS) sempre que NODE_ENV
// não for exatamente "production" (fácil de esquecer de configurar certo
// num deploy real).
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'Origem não permitida.' });
  }
  // JSON malformado no corpo da requisição é erro de quem chamou (400), não
  // do servidor (500) -- o body-parser já classifica isso como
  // 'entity.parse.failed' com o status certo, só não estava sendo respeitado.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Corpo da requisição não é um JSON válido.' });
  }
  console.error('Erro não tratado:', err);
  res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
});

module.exports = app;