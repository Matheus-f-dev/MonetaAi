# 💰 MonetaAi

**MonetaAi** é uma plataforma de gestão financeira pessoal com foco em acessibilidade, automação e integração via inteligência artificial.  
O sistema permite que usuários organizem suas finanças de maneira simples e eficiente, com recursos como chatbot via WhatsApp, categorização de gastos, gráficos e mais.

## 📁 Estrutura do Projeto - Padrão MVC

```
MonetaAi/
├── Client/Front/                 # Frontend React (MVC Adaptado)
│   ├── src/
│   │   ├── presentation/
│   │   │   ├── pages/            # Views (Páginas React)
│   │   │   ├── components/       # Componentes reutilizáveis
│   │   │   ├── hooks/            # Controllers (Custom Hooks)
│   │   │   └── styles/           # Estilos CSS
│   │   ├── core/
│   │   │   ├── entities/         # Models (Entidades)
│   │   │   ├── services/         # Services (API calls)
│   │   │   ├── usecases/         # Use Cases
│   │   │   └── validators/       # Validadores
│   │   ├── domain/               # Domain Models
│   │   ├── infrastructure/       # Infraestrutura
│   │   └── shared/               # Utilitários compartilhados
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
│   │   └── config/               # Configurações
│   ├── views/                    # Views (Templates EJS)
│   ├── public/                   # Arquivos estáticos
│   └── package.json
└── bot_moneta_ai/                # Chatbot Python
    ├── services/                 # Services do bot
    ├── utils/                    # Utilitários
    └── app.py                    # Aplicação principal
```

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn
- Conta Firebase configurada

### 1. Backend (Service)
```bash
# Navegar para a pasta do backend
cd MonetaAi/Service

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Criar arquivo .env com as configurações do Firebase



# Executar o servidor
npm start
# Servidor rodará em http://localhost:3000
```

### 2. Frontend (Client)
```bash
# Navegar para a pasta do frontend
cd MonetaAi/Client/Front

# Instalar dependências
npm install

# Executar a aplicação
npm start
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

### Funcionalidades em desenvolvimento
- [ ] Previsão saldo futuro
- [ ] Análise de impacto financeiro
- [ ] Alertas personalizados (visualização e exclusão) feito- falta somente a integração com chatbot
- [ ] Categorização automática dos gastos-feita so no chatbot


EXTRAS FUNCIONALIDADES
- [x] Pagina de análises(falta fazer as abas de receitas,economias e tendencias)


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

### 1. **Singleton Pattern**
- **Localização:** `Service/src/config/DatabaseConnection.js`
- **Função:** Garante uma única instância de conexão com o banco Firebase
- **Benefício:** Evita múltiplas conexões desnecessárias

### 2. **Factory Method Pattern**
- **Localização:** `Client/Front/src/presentation/components/system/TransactionModal.jsx`
- **Função:** Cria objetos de transação baseados no tipo (Receita/Despesa)
- **Benefício:** Centraliza criação e aplica regras específicas (valores positivos/negativos)

### 3. **Observer Pattern**
- **Localização:** `Client/Front/src/presentation/hooks/useTransactions.js`
- **Função:** Sistema de notificações para novas transações
- **Benefício:** Alertas automáticos para gastos altos, logs de atividades

### 4. **Strategy Pattern**
- **Localização:** `Client/Front/src/core/services/ValidationStrategy.js`
- **Função:** Diferentes estratégias de validação (email, senha, valores)
- **Benefício:** Validações intercambiáveis e reutilizáveis
- **Uso:** Implementado em `Login.jsx`, `Register.jsx` e `TransactionModal.jsx`

### Benefícios dos Padrões GoF
- **✅ Reutilização de Código** - Componentes padronizados
- **✅ Flexibilidade** - Fácil extensão e modificação
- **✅ Manutenibilidade** - Código mais organizado e legível
- **✅ Desacoplamento** - Redução de dependências entre classes

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
│   │   └── DatabaseConnection.js     # Singleton Pattern
│   └── services/
│       ├── TransactionFactory.js     # Factory Method (Backend)
│       └── TransactionObserver.js    # Observer Pattern (Backend)

Client/Front/
├── src/
│   ├── core/
│   │   └── services/
│   │       └── ValidationStrategy.js # Strategy Pattern
│   └── presentation/
│       ├── components/system/
│       │   └── TransactionModal.jsx  # Factory Method (Frontend)
│       ├── hooks/
│       │   └── useTransactions.js    # Observer Pattern (Frontend)
│       └── pages/
│           ├── Login.jsx             # Strategy Pattern
│           └── Register.jsx          # Strategy Pattern
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
- **Firebase Firestore** - Banco de dados NoSQL
- **Firebase Auth** - Autenticação

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
31 988494168

---
