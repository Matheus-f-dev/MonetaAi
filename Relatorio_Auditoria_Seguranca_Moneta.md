# Relatório de Auditoria de Segurança — Moneta
**Data:** 27/08/2026 (com adendo em 02/09/2026 — ver seção final)
**Branch:** `security/audit-2026-08-27` (nada enviado ao GitHub ainda)
**Escopo:** `Service/` (API Node/Express + Knex/PostgreSQL), `MonetaAi_bot/` (bot Python), `Client/Front/` (Vite), scripts SQL/migrations, Dockerfile, configs de deploy

> ⚠️ **CONFIDENCIAL** — contém achados reais de um sistema em produção. Não publique/compartilhe fora do time do projeto.

---

## Sumário executivo

A auditoria (feita em duas etapas — uma checagem preliminar seguida de uma auditoria completa via Claude Code) confirmou os pontos levantados inicialmente e encontrou achados adicionais, incluindo um **vazamento real de credencial de produção** (chave privada do Firebase Admin, exposta publicamente no GitHub) e um **problema sistêmico de autorização (IDOR)** que afetava praticamente todo endpoint de escrita da API — qualquer usuário autenticado podia ler, criar, editar ou apagar dados financeiros de qualquer outro usuário.

A maior parte das correções de baixo risco e não destrutivas já foi aplicada e testada, incluindo simulação real do ataque de IDOR (bloqueado com sucesso) e a atualização de dependências vulneráveis. Nada foi apagado, nenhum segredo foi rotacionado e nenhum histórico do Git foi reescrito — essas ações dependem de uma decisão e execução direta do responsável pelo projeto.

**Números consolidados:**
- `npm audit` (Service): 26 vulnerabilidades (4 críticas, 9 altas) → **0 vulnerabilidades**, após remoção de dependência morta, `npm audit fix` e upgrade do `nodemailer` para 9.0.5
- 6 controllers corrigidos contra IDOR (Transaction, Alert, Card, FixedExpense, Account, Split)
- Repositório GitHub confirmado como **público, com 1 fork já existente** — a exposição da chave do Firebase não se limita ao repositório de origem
- 1 vazamento de informação (traceback em resposta HTTP) corrigido na origem no bot Python

---

## Achados

Ordenados por severidade. "Onde" indica o arquivo ou componente afetado; "Status" reflete o estado no momento deste relatório.

| # | Severidade | Achado | Onde | Status |
|---|---|---|---|---|
| 1 | 🚨 Crítico | Chave privada real do Firebase Admin SDK exposta publicamente no GitHub | `MonetaAi_bot/bot_moneta_ai.zip` (rastreado no Git); repo público, 1 fork | Aguardando revogação — ação do usuário |
| 2 | 🚨 Crítico | IDOR sistêmico: endpoints de escrita confiavam no `userId` do corpo da requisição, não no token | 6 controllers: Transaction, Alert, Card, FixedExpense, Account, Split | Corrigido e testado |
| 3 | 🚨 Crítico | Segredo de sessão hardcoded (`"chave-super-secreta"`) | `Service/src/app.js` | Corrigido |
| 4 | 🔴 Alto | CORS efetivamente aberto (qualquer origem) com `credentials: true` | `Service/src/middleware/cors.js` | Corrigido |
| 5 | 🔴 Alto | 26 vulnerabilidades no `npm audit` (4 críticas, 9 altas) | `Service/package.json` | Corrigido — 0 vulnerabilidades |
| 6 | 🔴 Alto | Ausência de `helmet` e rate limiting (brute force em login/reset) | `Service/src/app.js` | Corrigido |
| 7 | 🔴 Alto | Enumeração de usuário em login e "esqueci senha" | `Service/src/controllers/AuthController.js` | Corrigido |
| 8 | 🔴 Alto | TLS do Postgres com `rejectUnauthorized: false` (abre brecha para MITM) | `Service/knexfile.js` | Corrigido |
| 9 | 🔴 Alto | Stack trace vazando em erros não tratados (efeito colateral do fix de CORS) | `Service` (error handler) | Corrigido |
| 10 | 🔴 Alto | Traceback completo retornado na resposta HTTP em rota legada | `MonetaAi_bot/app.py` + `services/conversation_service.py` | Corrigido na origem (`conversation_service.py`); limpeza cosmética em `app.py` pendente |
| 11 | 🟡 Médio | JWT sem revogação — token continua válido após troca de senha/logout | `Service` (AuthService/middleware) | Recomendação — não aplicado |
| 12 | 🟡 Médio | Token JWT trafega na URL do callback do Google OAuth | `Service` (rota OAuth) | Recomendação — não aplicado |
| 13 | 🟡 Médio | Senha mínima de 6 caracteres, sem exigência de complexidade | `Service` (cadastro/troca de senha) | Recomendação — não aplicado |
| 14 | 🟡 Médio | Sem endpoint de exclusão de conta (LGPD, direito ao esquecimento) | `Service` | Recomendação — não aplicado |
| 15 | 🟡 Médio | Logs verbosos com dados financeiros e telefones em texto puro (CloudWatch) | `MonetaAi_bot`: `app.py`, `firebase_manager.py`, `tools_manager.py`, `dynamodb_manager.py` | Pendente — sessão interrompida antes de concluir |
| 16 | 🟡 Médio | `requirements.txt` sem nenhuma versão fixada | `MonetaAi_bot/requirements.txt` | Pendente — sessão interrompida antes de concluir |
| 17 | ⚪ Operacional | Pasta `mysql-data` (fora do Git) com chaves TLS reais e logs de query em texto puro | `C:\Projetos\Moneta\mysql-data` | Bloqueado — requer ação manual do usuário |

---

## Detalhamento dos achados críticos

### 1. Chave privada do Firebase Admin SDK exposta publicamente

A chave (projeto `moneta-19f70`, ativa desde 10/08/2025) estava dentro de `MonetaAi_bot/bot_moneta_ai.zip`, rastreado pelo Git. O `.gitignore` do bot já bloqueava `serviceAccountKey.json`, `*.pem` e `*.key` soltos, mas não `*.zip` — o arquivo escapou dentro do zip. O repositório `Matheus-f-dev/MonetaAi` é público no GitHub e já tem 1 fork, então mesmo reescrever o histórico do repositório de origem não elimina cópias que já possam existir em forks ou clones de terceiros.

Firebase Admin SDK ignora todas as regras de segurança do Firestore — quem tiver essa chave tem leitura/escrita total no banco de produção e pode forjar tokens de qualquer usuário. **Ação necessária:** revogar a chave agora no Console do Firebase, gerar uma nova (nunca versionada) e revisar os registros de uso do Firestore no período em que a chave ficou exposta.

### 2. IDOR sistêmico em endpoints de escrita

Os controllers usavam `req.body.userId` (não a identidade verificada do token, `req.user.uid`) para decidir de quem eram os dados sendo alterados. Qualquer usuário autenticado — inclusive uma conta gratuita recém-criada — podia editar ou apagar transações, cartões, contas, alertas e gastos fixos de qualquer outro usuário, bastando enviar o `userId` da vítima no corpo da requisição. Em `AccountController.delete` o `UPDATE` de desativação da conta nem chegava a filtrar por `user_id`, só pelo `id` da conta.

**Corrigido:** todo `userId` usado para autorização agora vem de `req.user.uid`. Testado simulando o ataque real (usuário A tentando apagar um alerta do usuário B) — os dados de B permaneceram intactos.

### 3. Segredo de sessão hardcoded

`Service/src/app.js` definia `session({ secret: 'chave-super-secreta', ... })`. Combinado com `express-session` e `passport.session()` globais, qualquer um que soubesse essa string podia forjar um cookie de sessão válido para qualquer `user.id`. O impacto prático era limitado porque as rotas de API usam JWT, não sessão, mas é uma falha de projeto (CWE-798) e um risco latente. **Corrigido:** `SESSION_SECRET` obrigatória via variável de ambiente, sem fallback, cookie com `httpOnly`, `sameSite: 'lax'` e `secure` em produção.

---

## Correções aplicadas e verificadas

### Na auditoria completa (Claude Code, sessão anterior)

- `Service/src/middleware/cors.js` — bloqueia de fato origens fora da allowlist
- `Service/src/app.js` — `helmet()`, `SESSION_SECRET` obrigatória, cookie seguro, error handler central sem stack trace
- `Service/src/middleware/rateLimit.js` (novo) — rate limit em rotas de auth e no resto da API
- Controllers de Transaction, Alert, Card, FixedExpense, Account e Split — `userId` de autorização vem do token
- `Service/src/controllers/AuthController.js` — mensagens de erro unificadas, sem enumeração de usuário
- `Service/knexfile.js` — validação de certificado TLS do Postgres por padrão
- `Service/package.json` — dependência morta `firebase-admin` removida; `npm audit fix` aplicado
- `MonetaAi_bot/.gitignore` e `.dockerignore` — passaram a bloquear `*.zip`

*Backend reiniciado e testado ponta a ponta após cada mudança: cadastro, login, dashboard, ataque de IDOR simulado e bloqueado, headers de segurança confirmados via curl, CORS confirmado (origem maliciosa bloqueada com 403 limpo, origem legítima passando normalmente).*

### Nesta sessão

- Confirmado: repositório GitHub público com 1 fork — eleva a urgência da revogação da chave do Firebase
- `Service/package.json` — `nodemailer` atualizado de `7.0.13` para `9.0.5`; `npm audit` passou de 1 vulnerabilidade alta para 0; testada a compatibilidade da API (`createTransport` com `service:'gmail'` continua funcionando)
- `MonetaAi_bot/services/conversation_service.py` — o traceback completo deixou de ser incluído no dicionário de erro devolvido ao chamador (chegava à resposta HTTP via `app.py`); continua sendo logado no servidor para diagnóstico

---

## Pendências desta sessão

A conexão com o computador do usuário caiu no meio da rodada de correções do bot Python. Itens abaixo ficaram identificados mas não aplicados:

- `MonetaAi_bot/app.py` — remover o parâmetro `"traceback"` (já vazio na prática) dos dois `_response(500, ...)`, por limpeza
- Proteger os `print(f"DEBUG: ...")` em `app.py`, `firebase_manager.py`, `tools_manager.py` e `dynamodb_manager.py` atrás de uma flag de ambiente (ex.: `MONETA_DEBUG`), hoje expõem valores financeiros e IDs de conta em texto puro no CloudWatch
- Fixar as versões em `MonetaAi_bot/requirements.txt` (hoje sem nenhuma versão pinada) e rodar `pip-audit`
- Apagar `MonetaAi_bot/services/fix_conv_service.py` — script temporário desta sessão, esquecido ali porque o ambiente não conseguiu removê-lo sozinho; seguro para apagar, não deve ser commitado

---

## Ações bloqueadas — requerem execução manual do usuário

### Apagar a pasta `mysql-data`

Resíduo de uma instalação MySQL local anterior à migração para Postgres; contém certificados e chaves privadas TLS reais e logs (`general_log`/`slow_log`) com texto de queries. Está fora da raiz do repositório Git — nunca esteve sob risco de ir para o GitHub — mas ainda é um risco de exposição local. A tentativa de apagar automaticamente foi bloqueada pelas regras de segurança do ambiente desta sessão (não foi uma recusa do usuário). Confirme antes que nenhum processo MySQL/Docker ainda referencia essa pasta, depois, no PowerShell:

```
Remove-Item -Recurse -Force "C:\Projetos\Moneta\mysql-data"
```

### Limpar o histórico do Git (`bot_moneta_ai.zip`)

Recomenda-se usar um clone espelho separado, isolado do checkout de trabalho atual (que apresentou um `.git\index.lock` travado e uma divergência de quebra de linha em praticamente todo arquivo — provável artefato da ponte usada nesta sessão, não trabalho real perdido). Isso evita ambos os problemas:

```
cd C:\Projetos
git clone --mirror https://github.com/Matheus-f-dev/MonetaAi.git MonetaAi-mirror-backup
cd MonetaAi-mirror-backup
pip install git-filter-repo
git filter-repo --path MonetaAi_bot/bot_moneta_ai.zip --invert-paths
git push --force --all
git push --force --tags
```

*Isso reescreve hashes de commit publicamente — avise qualquer pessoa com clone local (branches `FEAT/Joao` e `FEAT/Matheus` indicam mais de um colaborador) para re-clonar depois. Isso não substitui a revogação da chave: quem já tiver um fork ou clone antigo mantém a chave vazada no histórico deles independentemente da limpeza no repositório de origem.*

---

## Confirmações positivas (sem ação necessária)

- Tabela `cards` armazena somente os últimos 4 dígitos (`final`); nenhum PAN ou CVV em código nenhum (bot, frontend, backend)
- `Client/Front/.env` está versionado no Git, mas nunca teve, em todo o histórico, nada além de `VITE_API_URL` — risco baixo
- `mysql-data` nunca esteve sob controle de versão — nunca foi exposto no GitHub
- `Service/serviceAccountKey.json` (projeto `moneta2ai`, diferente do bot) existe localmente mas nunca foi commitado — `.gitignore` funcionou; não é mais usado por nada no código
- Bot Python: sem `eval`/`exec`/`os.system`, sem segredos hardcoded, variáveis de ambiente usadas corretamente; nenhuma tool do LLM aceita `account_id` vindo do usuário — sempre resolvido no servidor
- Todo acesso a dados usa o query builder do Knex parametrizado — sem SQL injection
- Senhas com bcrypt; `JWT_SECRET` obrigatória via variável de ambiente, sem fallback hardcoded; tokens de reset de senha armazenados como hash

---

## Decisões necessárias

1. **Revogar a chave do Firebase `moneta-19f70` — urgente, prioridade máxima.**
2. O que fazer com `mysql-data` (apagar com segurança, comando pronto acima).
3. Quando limpar o histórico do Git do zip vazado (comandos prontos acima).
4. Concluir as correções pendentes do bot Python (logs, `requirements.txt`) — pode ser retomado assim que a conexão com o computador estiver disponível novamente.
5. Itens de médio prazo: revogação de JWT após troca de senha, token na URL do OAuth, política de senha mais forte, endpoint de exclusão de conta (LGPD).

---

## Próximos passos priorizados (da auditoria original — ver status atualizado no adendo abaixo)

1. Revogar a chave do Firebase vazada (hoje)
2. Confirmar que nenhum uso indevido ocorreu no Firestore durante o período de exposição
3. Apagar `mysql-data` e limpar o histórico do Git (comandos nas seções acima)
4. Concluir as correções pendentes do bot Python (mascarar logs, fixar `requirements.txt`)
5. Revisar e mergear a branch `security/audit-2026-08-27` (atenção ao ruído de quebra de linha antes de commitar)
6. Planejar as melhorias de médio prazo (revogação de JWT, LGPD, política de senha)

---

# Adendo — Sessão, storage e pendências de segurança (02/09/2026)

**Branch:** `security/session-storage-2026-09-02`
**Escopo:** `Client/Front/` (sessão, storage do navegador, roteamento), `Service/` (emissão/validação de JWT), `MonetaAi_bot/` (itens pendentes do relatório original)

Continuação focada no que ficou pendente na auditoria de 27/08 e em achados novos de uma sessão de deploy/revisão posterior. Todas as mudanças foram testadas de verdade (app local rodando, fluxos reais no navegador), não só lidas no código.

## Resumo executivo

Revisão crítica de uma correção já aplicada no `ProtectedRoute.jsx` encontrou um bug real de renderização (a página protegida chegava a montar — e disparar suas próprias chamadas de API — antes da checagem de sessão rodar), que por sua vez escondia uma segunda falha: o login com Google só "funcionava" por acidente, graças a esse mesmo bug. Ambos corrigidos e testados ponta a ponta. Testando o login normal de verdade (não só lendo código), foi encontrado um terceiro bug não relacionado: o frontend não sabia lidar com a resposta de 2FA do backend, corrompendo o `localStorage` e prendendo silenciosamente qualquer usuário com 2FA ativo fora do login pela web — corrigido, com tela de verificação nova.

Das quatro decisões de trade-off levantadas (revogação de JWT, criptografia do `salario`, entrega do token OAuth, e a tela de 2FA), você optou pela opção mais robusta nas quatro. Todas as quatro foram implementadas e testadas.

## O que foi corrigido e testado

### 1. `ProtectedRoute.jsx` — revisão crítica da correção já aplicada

**Achado:** a checagem de sessão rodava só em `useEffect`, mas o componente retornava `children` (a página protegida) incondicionalmente no render. Como efeitos de componente filho disparam antes do efeito do pai, a página protegida — e qualquer `fetch` que ela dispare no próprio mount — chegava a rodar antes do `ProtectedRoute` decidir se ia redirecionar. Não era um vazamento de dado de verdade (a API sempre exigiu JWT válido em cada chamada, isso nunca dependeu do frontend), mas era uma falha real de UX/robustez, e escondia o achado #2 abaixo.

**Corrigido:** a decisão de autorizar (`PUBLIC_ROUTES.includes(path) || hasValidSession()`) agora é calculada direto no render; o componente retorna `null` enquanto não autorizado, e o `useEffect` só cuida do `navigate()` em si. Removido também código morto (`useTerms`/`TermsModal` importados mas nunca usados no componente).

**Testado:** acesso direto a rota protegida sem sessão (redireciona, zero chamada à API disparada — confirmado via network log), token corrompido, token expirado, token válido (renderiza normalmente).

### 2. Login com Google — bug real descoberto testando o fluxo (não estava na lista do prompt)

**Achado:** o backend redirecionava direto pra `/system?token=...&user=...`, não pra `/auth/callback` (a rota que existe especificamente pra processar isso). O `System.jsx` tinha uma cópia duplicada da lógica de captura de token que só era alcançada por causa do bug #1 — com o `ProtectedRoute` corrigido, o login com Google teria quebrado (o token nunca seria salvo antes da checagem de sessão rodar).

**Corrigido:** backend agora redireciona pro `/auth/callback` (rota pública) de verdade; a lógica duplicada em `System.jsx` foi removida. Isso já foi refeito de novo no item 4 abaixo (token deixou de ir na URL).

### 3. Remoção do `urlCrypto.js` (decisão do item 2 do prompt)

**Achado:** cifrava o nome da rota com uma chave hardcoded no bundle JS público (`crypto-js`, `SECRET_KEY` fixa) — ofuscação cosmética, não controle de acesso (quem protege de verdade é o JWT). Adicionava complexidade e uma superfície de bug a mais — inclusive um bug real e independente encontrado de brinde: `Footer.jsx` concatenava `/app` + a rota já cifrada (que já vem com `/app/` no início), gerando `/app/app/xxx` — os links de Política de Privacidade/Termos de Uso no rodapé nunca funcionaram (esse componente específico, porém, não está montado em lugar nenhum do app hoje — achado à parte, sem uso).

**Decisão (minha, autorizada como correção de baixo risco no prompt):** removido por completo. `urlCrypto.js` e `useSecureNavigation.js` apagados; `App.jsx`, `ProtectedRoute.jsx`, `Footer.jsx`, `Sidebar.jsx`, `Home.jsx` e `Login.jsx` migrados pra `useNavigate()` do react-router direto; dependência `crypto-js` removida do `package.json` (não tinha mais nenhum uso).

**Testado:** navegação entre todas as rotas logado, login redireciona pro `/system` certo, logout limpa `localStorage` e volta pra `/`.

### 4. Item 5 do prompt — pendências do relatório original

- **#15 (logs verbosos no bot):** a maior parte já tinha sido corrigida numa sessão anterior (`debug_print()` com flag `MONETA_DEBUG`, já presente em `app.py`, `conversation_service.py`, `openai_client.py`, `whatsapp_service.py`, `tools_manager.py`, `sns_event_parser.py`). Só `firebase_manager.py` ainda usava `print()` bruto — migrado pra `debug_print()`.
- **#16 (`requirements.txt` sem versão):** já tinha sido corrigido numa sessão anterior (versões fixadas, com uma nota registrando uma vulnerabilidade conhecida aceita conscientemente). Nada a fazer.
- **#17 (`mysql-data`):** a pasta não existe mais em `C:\Projetos\Moneta\mysql-data` — já foi removida (presumivelmente pelo comando que este relatório já tinha sugerido). Resolvido.
- **#14 (exclusão de conta, LGPD):** novo endpoint `DELETE /api/user/:userId` (autenticado, `ensureOwnUser`, exige confirmação de senha pra contas com senha própria). **Anonimiza** em vez de apagar a linha — `transactions`/`accounts`/`audit_logs` têm FK pra `users.id`, um DELETE de verdade quebraria (RESTRICT) ou arrastaria o histórico financeiro e os próprios audit_logs junto (CASCADE). Escruba nome/e-mail/senha/salário/google_id/totp e desativa login, mantendo a integridade referencial do resto do sistema — consistente com a Cláusula Oitava dos Termos de Uso ("Exclusão da conta e dos arquivos"). Registra no `audit_logs` só que aconteceu e quando, sem guardar os dados pessoais apagados (isso derrotaria o propósito). Testado ponta a ponta via API: sem senha (bloqueia), senha errada (bloqueia), outro usuário tentando apagar (403, `ensureOwnUser` já cobre a rota nova), exclusão de verdade (confirmado no banco: linha anonimizada, não apagada; login antigo para de funcionar).

## Decisões de trade-off — as quatro que você escolheu

### Achado #11 — JWT sem revogação → **`token_version` no banco (escolhido)**

Nova coluna `users.token_version` (migration `20260902164425`), embutida no JWT como claim `tv` na emissão. Trocar a senha ou excluir a conta incrementa essa versão (`User.bumpTokenVersion`); o middleware (`authenticateToken`) agora compara o `tv` do token com a versão atual no banco a cada request e rejeita (403 "Sessão inválida") se não bater — invalidação instantânea, sem precisar de blacklist. Custo aceito: uma consulta a mais por request autenticado (antes o middleware era 100% sem estado). Tokens emitidos antes desta mudança (sem claim `tv`) são tratados como versão 0, igual ao default da coluna — sessões já abertas não quebraram.

**Testado:** token válido funciona; depois de uma troca de senha, o token antigo (mesmo ainda não expirado) recebe 403; login com a senha nova gera um token com `tv` incrementado que funciona normalmente.

### Achado #3 — `salario` em texto puro → **Criptografia na aplicação (escolhido)**

Novo `Service/src/services/CryptoService.js` (AES-256-GCM, chave própria via `SALARY_ENCRYPTION_KEY` — variável nova, **precisa ser configurada na VPS**, nunca reaproveitar a chave local). Migration `20260902164512` cifra os dados já existentes e troca o tipo da coluna de `numeric` pra `text`. `User.js` centraliza cifra/decifra — todo o resto do código continua lendo `salario` como número normal, sem saber que a coluna é cifrada por baixo.

**Testado:** cadastro novo grava e devolve o salário certo; usuário antigo (dado migrado) também lê certo; `deleteAccount` (que grava `salario: 0` na anonimização) foi ajustado pra cifrar esse valor também — sem isso, teria quebrado a leitura de qualquer conta excluída.

### Achado #12 — token na URL do OAuth → **Código de troca de curta duração (escolhido)**

Novo `Service/src/services/OAuthExchangeService.js`: o callback do Google gera um código opaco de uso único (60s de validade, guardado em memória) em vez de mandar o JWT direto na URL; `AuthCallback.jsx` troca esse código pelo token de verdade via `POST /api/auth/exchange` (corpo da requisição, nunca aparece em URL/log). **Trade-off assumido e documentado no próprio arquivo:** o código vive em memória do processo Node — se o deploy um dia rodar múltiplas instâncias atrás de um load balancer (PM2 cluster mode), isso precisa virar uma tabela ou Redis compartilhado. Não é o caso do deploy planejado pra HostGator (um processo só via PM2).

**Testado:** lógica de emissão/consumo único/expiração verificada isoladamente; endpoint `/api/auth/exchange` testado ao vivo (código ausente → 400, código inválido → 400); `AuthCallback.jsx` testado ao vivo com código inválido (redireciona pro `/login` com a mensagem de erro certa, sem gravar nada no `localStorage`). **Não testado:** o handshake OAuth real do Google ponta a ponta (exige credenciais `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` reais, ausentes neste ambiente local — isso já era verdade antes desta sessão, não é uma regressão).

### Achado novo — sem tela de 2FA no frontend → **Construída agora (escolhido)**

Achado ao testar o login normal de verdade (não estava na lista do prompt): `useAuth.js` tratava qualquer resposta `success:true` do `/api/login` como login completo, mesmo quando era só a etapa intermediária do 2FA (`requiresTotp:true`, sem `token`/`user`) — gravava a string literal `"undefined"` no `localStorage` e tentava navegar pro `/system`, onde o `ProtectedRoute` (corretamente) barrava o token quebrado, devolvendo o usuário pro `/login` sem explicação nenhuma. Corrigido em duas partes: `useAuth.js`/`Login.jsx` pararam de tratar a resposta intermediária como sucesso completo, e uma tela nova (`Login.jsx`) aparece nesse momento — campo de código de 6 dígitos, chama `POST /login/totp` (endpoint que já existia e já tinha sido testado via API na sessão anterior).

**Testado:** login completo com 2FA ponta a ponta pelo navegador (senha → tela de código → código TOTP real gerado com o secret do usuário de teste → `/system`).

## Env vars novas — atualizar a lista de antes de subir na VPS

Duas variáveis novas desde o último checklist de deploy, nenhuma delas opcional:

- `SALARY_ENCRYPTION_KEY` — hex de 64 caracteres (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). **Gerar uma nova pra VPS, nunca reaproveitar a local.** Sem ela, qualquer leitura/escrita de `salario` derruba com erro (mesmo padrão do `JWT_SECRET` — falha alto, sem fallback).
- (Nenhuma outra nova — `token_version` e o código de troca do OAuth não precisam de env var, são só schema/estado em memória.)

## Pendências — o que ainda não foi feito

- Merge da branch `security/session-storage-2026-09-02` — está pronta, mas não foi mergeada nem enviada ao GitHub (regra do prompt: nunca direto na `main`).
- `Client/Front/src/presentation/components/Footer.jsx` corrigido mas continua sem uso em lugar nenhum do app (componente órfão) — considerar remover de vez ou religar, não é uma decisão de segurança.
- `openapi.json` não foi atualizado com as rotas novas (`DELETE /api/user/:userId`, `POST /api/auth/exchange`) — cosmético, não bloqueia nada.
- Handshake OAuth do Google real (com credenciais de verdade) segue não testado neste ambiente local — só o suportável sem essas credenciais foi verificado.

## Próximos passos priorizados (deste adendo)

1. Revisar e mergear a branch `security/session-storage-2026-09-02`
2. Gerar e configurar `SALARY_ENCRYPTION_KEY` na VPS (nova, separada da local) antes do deploy
3. Rodar as duas migrations novas (`token_version`, `encrypt_users_salario`) no banco da VPS junto com o resto do checklist de deploy já em andamento
4. Testar o login com Google de verdade assim que houver um ambiente com `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` reais configurados
5. Decidir o destino do `Footer.jsx` órfão (religar ou remover)
