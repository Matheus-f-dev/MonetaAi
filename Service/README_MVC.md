# Estrutura MVC - MonetaAI Service

## Arquitetura

A aplicação foi reestruturada seguindo o padrão MVC (Model-View-Controller):

```
src/
├── config/          # Configurações (Firebase, etc.)
├── controllers/     # Controladores (lógica de requisições)
├── models/          # Modelos de dados
├── services/        # Lógica de negócio
├── middleware/      # Middlewares (CORS, Auth, etc.)
├── routes/          # Definição de rotas
└── app.js           # Configuração principal da aplicação
```

## Componentes

### Models
- **User.js**: Modelo para usuários
- **Transaction.js**: Modelo para transações financeiras

### Controllers
- **AuthController.js**: Controla autenticação (login/cadastro)
- **TransactionController.js**: Controla operações de transações

### Services
- **AuthService.js**: Lógica de negócio para autenticação
- **TransactionService.js**: Lógica de negócio para transações

### Middleware
- **cors.js**: Configuração de CORS
- **auth.js**: Middleware de autenticação JWT

## Rotas da API

### Autenticação
- `POST /api/login` - Login de usuário
- `POST /api/cadastro` - Cadastro de usuário

### Transações (Protegidas)
- `POST /api/transactions` - Criar transação
- `GET /api/transactions/:userId` - Listar transações do usuário
- `GET /api/balance/:userId` - Obter saldo do usuário
- `PUT /api/transactions/:id` - Atualizar transação
- `DELETE /api/transactions/:id` - Excluir transação

## Compatibilidade

As rotas antigas foram mantidas para compatibilidade com o sistema existente. A migração pode ser feita gradualmente.

## Uso no Frontend

O arquivo `authApi.js` foi atualizado para usar as novas rotas MVC. Exemplo:

```javascript
import { authApi } from './infrastructure/api/authApi';

// Login
const result = await authApi.login(email, senha);

// Buscar transações
const transactions = await authApi.getUserTransactions(userId, token);
```