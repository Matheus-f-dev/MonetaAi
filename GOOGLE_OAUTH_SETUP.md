# Configuração do Google OAuth

## Configurações necessárias no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione seu projeto ou crie um novo
3. Vá para "APIs & Services" > "Credentials"
4. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure as seguintes URLs:

### Authorized JavaScript origins:
- `http://localhost:3000`
- `http://localhost:5173`

### Authorized redirect URIs:
- `http://localhost:3000/auth/google/callback`

## Variáveis de ambiente já configuradas:
- `GOOGLE_CLIENT_ID`: Já configurado no .env
- `GOOGLE_CLIENT_SECRET`: Já configurado no .env

## Como funciona:
1. Usuário clica no botão "Entrar com Google"
2. É redirecionado para `http://localhost:3000/auth/google`
3. Google autentica e redireciona para `/auth/google/callback`
4. Backend processa e redireciona para `http://localhost:5173/auth/callback` com token
5. Frontend processa o token e redireciona para `/system`

## Testando:
1. Inicie o backend: `cd Service && npm start`
2. Inicie o frontend: `cd Client/Front && npm run dev`
3. Acesse `http://localhost:5173/login`
4. Clique em "Entrar com Google"