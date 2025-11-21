const cors = require('cors');

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://www.monetaai.site',
    'https://monetaai.site',
    'https://monetaai-frontend-2pemd90yq-matheus-projects-9993ec57.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);