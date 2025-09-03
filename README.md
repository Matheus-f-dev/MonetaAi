# 💰 MonetaAi

**MonetaAi** é uma plataforma de gestão financeira pessoal com foco em acessibilidade, automação e integração via inteligência artificial.  
O sistema permite que usuários organizem suas finanças de maneira simples e eficiente, com recursos como chatbot via WhatsApp, categorização de gastos, gráficos e mais.

## 📁 Estrutura do Projeto

```
MonetaAi/
├── Client/
│   └── Front/                    # Frontend React
│       ├── src/
│       │   ├── presentation/
│       │   │   ├── components/   # Componentes React
│       │   │   ├── pages/        # Páginas da aplicação
│       │   │   ├── styles/       # Estilos CSS
│       │   │   └── hooks/        # Custom Hooks
│       │   ├── domain/           # Classes de domínio (OO)
│       │   ├── core/
│       │   │   └── services/     # Services do frontend
│       │   └── App.js
│       └── package.json
└── Service/                      # Backend Node.js (Arquitetura em Camadas + OO)
    ├── src/
    │   ├── controllers/          # Controllers da API (HTTP Layer)
    │   │   └── views/            # Controllers para páginas
    │   ├── services/             # Lógica de negócio (Business Layer)
    │   ├── repositories/         # Camada de persistência (Data Layer)
    │   ├── models/               # Modelos de domínio (Domain Layer)
    │   ├── routes/               # Rotas organizadas
    │   ├── middleware/           # Middlewares
    │   └── config/               # Configurações
    ├── views/                    # Templates EJS
    ├── public/                   # Arquivos estáticos
    └── package.json
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

### Funcionalidades em desenvolvimento
  
- [ ] Personalização da interface  
 



 ## ✅ Checklist - Segunda Entrega

### Funcionalidades já implementadas
- [x] Detectar gastos por foto
- [x] consulta de saldo e consumo no chatbot
- [x] Registro de gastos por voz
- [x] o chatbot gera resumo dos relatorios


### Funcionalidades em desenvolvimento
- [ ] Previsão saldo futuro
- [ ] Analise de impacto financeiro
- [ ] exportar relatorios de acompanhamentos
- [ ]  alertas personalizados
- [ ]  Modo viagem
- [ ]  categorização automatica dos gastos-feita somente no bot ainda
 

## 🏗️ Arquitetura do Sistema

### Backend - Arquitetura em Camadas com OO
```
┌─────────────────┐
│   Controllers   │ ← HTTP Layer (Requisições/Respostas)
├─────────────────┤
│    Services     │ ← Business Layer (Lógica de Negócio)
├─────────────────┤
│  Repositories   │ ← Data Layer (Persistência)
├─────────────────┤
│     Models      │ ← Domain Layer (Entidades de Domínio)
├─────────────────┤
│    Firebase     │ ← Database
└─────────────────┘
```

### Padrões Implementados
- **Repository Pattern** - Separação da lógica de persistência
- **Service Layer** - Encapsulamento da lógica de negócio  
- **Domain Model** - Entidades com comportamentos e validações
- **Dependency Injection** - Baixo acoplamento entre camadas
- **Orientação a Objetos** - Encapsulamento, Herança, Polimorfismo



## 🚀 Tecnologias Utilizadas

- **Frontend:** React.js, React Router, Chart.js
- **Backend:** Node.js, Express.js (Arquitetura em Camadas + OO)
- **Banco de Dados:** Firebase Firestore
- **Autenticação:** Firebase Authentication
- **Chatbot:** Python com IA


---

## 📌 Objetivo

Oferecer uma alternativa gratuita e inteligente para controle financeiro pessoal, com foco em jovens e integração com assistente virtual.

---



## 📲 Contato

Caso queira contribuir, sugerir melhorias ou relatar bugs, fique à vontade para abrir uma *issue* ou entrar em contato com algum membro da equipe.
31 988494168

---
