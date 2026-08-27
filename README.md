# 💰 MonetaAi

**MonetaAi** é uma plataforma de gestão financeira pessoal com foco em acessibilidade, automação e integração via inteligência artificial.  
O sistema permite que usuários organizem suas finanças de maneira simples e eficiente, com recursos como chatbot via WhatsApp, categorização de gastos, gráficos e mais.

## 📁 Estrutura do Projeto - Padrão MVC

```
MonetaAi/
├── Client/Front/                 # Frontend React (MVC Adaptado)
│   ├── src/
│   │   ├── presentation/         # Views Layer
│   │   │   ├── pages/            # Views (Páginas React)
│   │   │   ├── components/       # Componentes reutilizáveis
│   │   │   │   └── system/       # Componentes do sistema
│   │   │   ├── hooks/            # Controllers (Custom Hooks)
│   │   │   └── styles/           # Estilos CSS organizados
│   │   │       ├── base/         # Estilos base
│   │   │       ├── components/   # Estilos de componentes
│   │   │       └── pages/        # Estilos de páginas
│   │   ├── core/                 # Business Logic Layer
│   │   │   ├── services/         # Services (API calls)
│   │   │   └── validators/       # Validadores
│   │   ├── domain/               # Domain Models
│   │   ├── infrastructure/       # Infrastructure Layer
│   │   │   ├── api/              # Configurações de API
│   │   │   ├── mocks/            # Dados mockados
│   │   │   └── storage/          # Gerenciamento de storage
│   │   ├── shared/               # Utilitários compartilhados
│   │   ├── assets/               # Recursos estáticos
│   │   └── App.jsx               # Componente principal
│   └── package.json
├── Service/                      # Backend Node.js (MVC Completo)
│   ├── src/
│   │   ├── controllers/          # Controllers (Lógica de controle)
│   │   │   └── views/            # View Controllers
│   │   ├── services/             # Services (Lógica de negócio)
│   │   ├── models/               # Models (Entidades de dados)
│   │   ├── repositories/         # Data Access Layer
│   │   ├── routes/               # Rotas da API
│   │   ├── middleware/           # Middlewares
│   │   ├── config/               # Configurações
│   │   └── app.js                # Aplicação principal
│   ├── views/                    # Views (Templates EJS)
│   ├── public/                   # Arquivos estáticos
│   └── package.json
└── MonetaAi_bot/                 # Chatbot Python
    ├── services/                 # Services do bot
    │   ├── conversation_service.py
    │   ├── openai_client.py
    │   ├── sns_event_parser.py
    │   └── whatsapp_service.py
    ├── utils/                    # Utilitários
    │   └── models.py
    ├── app.py                    # Aplicação principal
    ├── firebase_manager.py       # Gerenciador Firebase
    ├── dynamodb_manager.py       # Gerenciador DynamoDB
    └── requirements.txt          # Dependências Python
```

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+
- npm
- PostgreSQL 14+ rodando localmente (ou acessível via rede)

### 1. Backend (Service)
```bash
# Navegar para a pasta do backend
cd MonetaAi/Service

# Instalar dependências
npm install

# Criar o arquivo .env (não versionado) com pelo menos:
#   DB_HOST=127.0.0.1
#   DB_PORT=5432
#   DB_USER=moneta_app
#   DB_PASSWORD=<sua senha>
#   DB_NAME=Moneta
#   JWT_SECRET=<qualquer string longa e aleatória>
#   FRONTEND_URL=http://localhost:5173

# Criar o banco e o role de aplicação (uma vez só, como um usuário com
# privilégio de criar role/database no Postgres):
#   CREATE DATABASE "Moneta";
#   CREATE ROLE moneta_app LOGIN PASSWORD '<mesma senha do .env>';
#   GRANT CONNECT ON DATABASE "Moneta" TO moneta_app;

# Criar todas as tabelas — schema versionado via Knex, não SQL manual.
# Reproduz o banco inteiro do zero em qualquer ambiente novo.
npm run migrate

# Executar o servidor
npm start
# Servidor rodará em http://localhost:3000
```

Schema novo? `npm run migrate:make -- nome_da_mudanca` cria o arquivo de
migration; `npm run migrate:rollback` desfaz o último batch aplicado.

### 2. Frontend (Client)
```bash
# Navegar para a pasta do frontend
cd MonetaAi/Client/Front

# Instalar dependências
npm install

# Executar a aplicação
npm run dev
# Aplicação rodará em http://localhost:5173
```

### 3. Acessar a Aplicação
- **Frontend React:** http://localhost:5173
- **Backend API:** http://localhost:3000


---

## 👥 Integrantes do Grupo - 3C2

- **Matheus Freire** – 22301712  
- **Lucas Eller** – 22301283  
- **Luan** – 22302760  
- **João Pedro Seixas** – 22402306  
- **Matheus Gonçalves** – 22301666  
- **Matheus Bach Preis Ferreira** – 22402004  

---

## ✅ Checklist - Primeira Entrega

### Funcionalidades já implementadas
- [x] Cadastro de usuários  
- [x] Login com autenticação  
- [x] Redefinição de senha 
- [x] Cadastro da média salarial
- [x] Visualizar histórico de atividades
- [x] Filtro de gastos por categoria
- [x] Integração com rede social
- [x] Registros no WhatsApp através do chatbot
- [x] Gráfico de gastos
- [x] Personalização da interface  





 ## ✅ Checklist - Segunda Entrega

### Funcionalidades já implementadas
- [x] Detectar gastos por foto
- [x] consulta de saldo e consumo no chatbot
- [x] Registro de gastos por voz
- [x] o chatbot gera resumo dos relatorios
- [x] exportar relatorios de acompanhamentos
- [x] Distribuição acumulativa
- [x] Previsão saldo futuro
- [x] Categorização automática dos gastos-feita via chatbot
- [x] Análise de impacto financeiro
- [x] Alertas personalizados feito- e integrado com chatbot


      
EXTRAS FUNCIONALIDADES
- [x] Pagina de análises(incluindo 5 novos campos de analises)
- [ ] planejar despesas futuras-em desenvolvimento


## 🎯 Arquitetura MVC - Benefícios Alcançados

### ✅ Separação de Responsabilidades
- **Models:** Gerenciam dados e regras de negócio
- **Views:** Focam apenas na apresentação
- **Controllers:** Coordenam interações entre Model e View

### ✅ Manutenibilidade
- Código organizado e fácil de localizar
- Mudanças isoladas em cada camada
- Reutilização de componentes e lógica

### ✅ Testabilidade
- Cada camada pode ser testada independentemente
- Hooks customizados facilitam testes unitários
- Mocks simples para services e APIs

### ✅ Escalabilidade
- Estrutura preparada para crescimento
- Fácil adição de novas funcionalidades
- Padrões consistentes em todo o projeto
 

## 🏗️ Arquitetura MVC

### Backend - MVC Tradicional
```
┌─────────────────┐
│      Views      │ ← Templates EJS (Apresentação)
├─────────────────┤
│   Controllers   │ ← Lógica de controle e rotas
├─────────────────┤
│     Models      │ ← Entidades e regras de negócio
├─────────────────┤
│    Services     │ ← Lógica de negócio complexa
├─────────────────┤
│    Firebase     │ ← Persistência de dados
└─────────────────┘
```

### Frontend - MVC Adaptado com Hooks
```
┌─────────────────┐
│   Pages (JSX)   │ ← Views (Componentes React)
├─────────────────┤
│ Custom Hooks    │ ← Controllers (Lógica de estado)
├─────────────────┤
│   Entities      │ ← Models (Estruturas de dados)
├─────────────────┤
│    Services     │ ← Comunicação com API
├─────────────────┤
│   Backend API   │ ← Fonte de dados
└─────────────────┘
```

### Padrões MVC Implementados
- **✅ Model-View-Controller** - Separação clara de responsabilidades
- **✅ Custom Hooks como Controllers** - Gerenciamento de estado e lógica
- **✅ Service Layer** - Encapsulamento de chamadas API
- **✅ Repository Pattern** - Abstração da persistência
- **✅ Domain Models** - Entidades com validações
- **✅ Separation of Concerns** - Cada camada com responsabilidade única

## 🎨 Padrões GoF Implementados

### 1. **Singleton Pattern** ✅ FUNCIONANDO
- **Backend:** `Service/src/config/database.js` - Conexão única Knex/PostgreSQL
- **Frontend:** `Client/Front/src/core/services/ApiConnection.js` - Conexão única API
- **Uso:** TransactionController, useTransactionData
- **Benefício:** Evita múltiplas conexões desnecessárias

### 2. **Factory Method Pattern** ✅ FUNCIONANDO
- **Backend:** `Service/src/services/TransactionFactory.js` - Criação de transações
- **Frontend:** `Client/Front/src/core/services/TransactionFactory.js` - Validação e criação
- **Uso:** TransactionController, TransactionModal
- **Benefício:** Centraliza criação e aplica regras específicas por tipo

### 3. **Observer Pattern** ✅ FUNCIONANDO
- **Backend:** `Service/src/services/TransactionObserver.js` - Subject e Observers
- **AlertObserver:** `Service/src/services/AlertObserver.js` - Monitora limites de gastos
- **Controller:** `Service/src/controllers/TransactionController.js` - Notifica observers
- **Frontend:** `Client/Front/src/presentation/hooks/useTransactionData.js` - Hook customizado
- **Uso nos Alertas Personalizados:** Sistema de alertas automáticos que monitora gastos por categoria
- **Benefício:** Alertas automáticos por categoria, notificações em tempo real, monitoramento de limites

### 4. **Strategy Pattern** ✅ FUNCIONANDO
- **Validação:** `Client/Front/src/core/services/ValidationStrategy.js` - Estratégias de validação
- **Filtros:** `Client/Front/src/core/services/FilterStrategy.js` - Estratégias de filtros
- **Uso:** Login.jsx, Register.jsx, TransactionModal.jsx, useTransactionData.js
- **Benefício:** Validações e filtros intercambiáveis e reutilizáveis

### Benefícios dos Padrões GoF
- **✅ Reutilização de Código** - Componentes padronizados
- **✅ Flexibilidade** - Fácil extensão e modificação
- **✅ Manutenibilidade** - Código mais organizado e legível
- **✅ Desacoplamento** - Redução de dependências entre classes

### 🧪 Como Testar os Padrões GoF

#### **Singleton Pattern**
```javascript
// Console do navegador (F12)
const api1 = new ApiConnection();
const api2 = new ApiConnection();
console.log(api1 === api2); // Deve retornar: true
```

#### **Factory Method Pattern**
1. Crie uma nova transação na aplicação
2. Abra o Console (F12) antes de submeter
3. Veja logs: `"Factory criou: {objeto}"`
4. Teste com tipo inválido para ver erro

#### **Strategy Pattern**
- Digite email inválido no login → Veja validação
- Digite senha < 8 caracteres → Veja validação
- Digite valor negativo em transação → Veja validação

#### **Observer Pattern - Alertas Personalizados**
1. Crie um alerta personalizado em "Alertas"
2. Defina categoria e limite (ex: Alimentação > R$ 500)
3. Registre despesas nesta categoria
4. Verifique:
   - ✅ AlertObserver monitora automaticamente todas as transações
   - ✅ Notificação criada quando limite ultrapassado
   - ✅ Log no console do servidor mostra execução do observer
   - ✅ Observer executado automaticamente no método `createTransaction`
   - ✅ Sistema de alertas personalizados funciona em tempo real

### Hooks Customizados (Controllers Frontend)
- `useAuth.js` - Controle de autenticação
- `useTransactionData.js` - Gerenciamento de transações (Observer Pattern)
- `useReports.js` - Lógica de relatórios
- `useAlerts.js` - Controle de alertas
- `useSystemSimple.js` - Dados do sistema principal

### Arquivos dos Padrões GoF
```
Service/
├── src/
│   ├── config/
│   │   └── database.js               # Singleton Pattern (Backend)
│   ├── controllers/
│   │   ├── TransactionController.js  # Usa Singleton + Factory + Observer
│   │   └── AlertController.js        # Gerencia alertas e notificações
│   └── services/
│       ├── TransactionFactory.js     # Factory Method (Backend)
│       ├── TransactionObserver.js    # Observer Pattern (Subject)
│       ├── AlertObserver.js          # Observer Pattern (Concrete Observer)
│       └── FilterStrategy.js         # Strategy Pattern (Filtros Backend)

Client/Front/
├── src/
│   ├── core/
│   │   └── services/
│   │       ├── ApiConnection.js      # Singleton Pattern (Frontend)
│   │       ├── ObserverService.js    # Observer Pattern (Service)
│   │       ├── TransactionFactory.js # Factory Method (Frontend)
│   │       ├── ValidationStrategy.js # Strategy Pattern (Validação)
│   │       └── FilterStrategy.js     # Strategy Pattern (Filtros)
│   └── presentation/
│       ├── components/system/
│       │   ├── ObserverLog.jsx       # Observer Pattern (View)
│       │   └── TransactionModal.jsx  # Usa Factory + Strategy
│       ├── hooks/
│       │   ├── useTransactionData.js # Observer Pattern (método create) + Singleton
│       │   └── useTransactions.js    # Hook de transações
│       └── pages/
│           ├── Login.jsx             # Strategy Pattern
│           ├── Register.jsx          # Strategy Pattern
│           └── system.jsx            # Integra Observer
```



## 🔒 Segurança - Criptografia de URLs

O sistema implementa criptografia avançada de URLs para proteger contra acesso não autorizado:

### Características
- **Algoritmo:** AES-256 com chave secreta
- **Formato:** `/app/[hash_criptografado]`
- **Proteção:** Impede navegação direta via URL
- **Validação:** Rotas descriptografadas são validadas

### Estrutura de Segurança
```
Client/Front/src/
├── shared/
│   └── urlCrypto.js              # Utilitário de criptografia AES
├── presentation/
│   ├── components/
│   │   └── ProtectedRoute.jsx    # Componente de proteção
│   └── hooks/
│       └── useSecureNavigation.js # Hook de navegação segura
```

### Funcionamento
```javascript
// Antes: URLs expostas
/system, /expenses, /reports

// Depois: URLs criptografadas
/app/U2FsdGVkX1+vQ8... (hash único)
```

### Rotas Protegidas
- ✅ `/system` → Dashboard principal
- ✅ `/expenses` → Gestão de despesas
- ✅ `/incomes` → Gestão de receitas
- ✅ `/analytics` → Análises financeiras
- ✅ `/reports` → Relatórios
- ✅ `/alerts` → Alertas
- ✅ `/profile` → Perfil do usuário

### Benefícios de Segurança
- **🛡️ Proteção contra acesso direto** - URLs não podem ser acessadas manualmente
- **🔐 Ofuscação de rotas** - Estrutura da aplicação não é exposta
- **🚫 Prevenção de ataques** - Reduz superfície de ataque
- **📱 Navegação transparente** - Usuário navega normalmente

## 🚀 Tecnologias Utilizadas

### Frontend (MVC com React)
- **React.js** - Biblioteca para interfaces
- **React Router** - Roteamento SPA
- **Chart.js** - Gráficos interativos
- **Custom Hooks** - Controllers do frontend
- **CSS Modules** - Estilização componentizada
- **CryptoJS** - Criptografia de URLs

### Backend (MVC Tradicional)
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web MVC
- **EJS** - Template engine para Views
- **PostgreSQL** - Banco de dados relacional
- **Knex** - Query builder e migrations versionadas
- **bcrypt + JWT** - Autenticação própria

### Chatbot & IA
- **Python** - Linguagem do bot
- **OpenAI API** - Inteligência artificial
- **WhatsApp API** - Integração messaging

### Arquitetura & Segurança
- **Padrão MVC** - Organização do código
- **RESTful API** - Comunicação cliente-servidor
- **SPA (Single Page Application)** - Frontend React
- **Microserviços** - Bot separado do backend principal
- **URL Encryption** - Proteção de rotas com AES-256


---

## 📌 Objetivo

Oferecer uma alternativa gratuita e inteligente para controle financeiro pessoal, com foco em jovens e integração com assistente virtual.

---



## 📲 Contato

Caso queira contribuir, sugerir melhorias ou relatar bugs, fique à vontade para abrir uma *issue* ou entrar em contato com algum membro da equipe.
31 989295058

---
