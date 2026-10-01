# Frontend TODO — o que o backend já entrega e ainda não tem tela

**Para:** responsável pelo `Client/Front/`
**Backend correspondente:** branches `security/audit-2026-08-27` → `feature/fase1-baixo-esforco` → `feature/fase2-medio-esforco` → `feature/fase3-mais-ambicioso` (aguardando merge em `main`)
**Documentação completa de toda a API:** suba o backend (`npm start` em `Service/`) e acesse `http://localhost:3000/api-docs` — dá pra ver o corpo esperado de cada rota e testar direto por lá.

Todas as rotas abaixo já existem, funcionam e estão testadas no backend.

**Atualização (Fase 9 do redesign, ver `PROMPT_REDESIGN_FRONTEND_POS_LOGIN.md`):** itens 1, 3, 4, 5, 6 e 7 ganharam tela nas Fases 3, 4 e 6 do redesign pós-login e foram marcados abaixo. Os itens 2 e 9 nunca precisaram de UI nova (continuam como estavam). Só o item 8 (2FA) segue pendente — é o escopo da Fase 8, ainda não feita.

---

## 1. Receita recorrente ✅ Feito (Fase 3 do redesign)
`/receita-recorrente`, `Client/Front/src/features/movements/`.
Igual a "gastos fixos", só que para receita (salário, renda extra mensal).
- `POST /api/fixed-incomes` — criar
- `GET /api/fixed-incomes/:userId` — listar
- `PUT /api/fixed-incomes/:fixedIncomeId` — editar
- `DELETE /api/fixed-incomes/:fixedIncomeId` — remover
- `POST /api/fixed-incomes/:fixedIncomeId/lancar` — lança a transação do mês corrente
**Sugestão de UI:** espelhar a tela de gastos fixos que já existe.

## 2. E-mail quando um alerta dispara
Não precisa de tela nova — já funciona sozinho quando um alerta configurado na tela de Alertas estoura. Só vale confirmar com o usuário se o campo de e-mail cadastrado está correto.

## 3. Exportação de relatórios (CSV/PDF) ✅ Feito (Fase 6 do redesign)
`/reports`, botão "Exportar" (CSV/PDF, ao lado da exportação Excel que já existia) em `Client/Front/src/features/insights/ReportsPage.tsx`.
- `GET /api/relatorios/:userId/export?formato=csv|pdf&periodo=mes|ano|tudo`

## 4. Importação de extrato bancário ✅ Feito (Fase 3 do redesign)
`/importar-extrato`, `Client/Front/src/features/movements/ImportStatementPage.tsx`.
- `POST /api/transactions/import/preview?formato=ofx|csv-nubank` — multipart, campo `arquivo`. Devolve uma lista com categoria sugerida e um aviso em cada linha que já foi importada antes.
- `POST /api/transactions/import/confirm` — recebe a lista (editada ou não pelo usuário) e grava.

## 5. Orçamento por categoria ✅ Feito (Fase 4 do redesign)
`/orcamento`, `Client/Front/src/features/wealth/OrcamentoPage.tsx`.
- `POST /api/budgets` — criar (categoria + limite mensal)
- `GET /api/budgets/:userId` — listar
- `GET /api/budgets/:userId/status` — % consumido no mês por categoria (devolve `gastoNoMes`, `percentualUsado`, `estourado`)
- `PUT/DELETE /api/budgets/:budgetId`

## 6. Metas financeiras ✅ Feito (Fase 4 do redesign)
`/metas`, `Client/Front/src/features/wealth/MetasPage.tsx`.
- `POST /api/goals` — criar (nome, valor alvo, prazo opcional, conta vinculada opcional)
- `GET /api/goals/:userId` — listar
- `GET /api/goals/:userId/progress` — progresso de cada meta
- `PUT/DELETE /api/goals/:goalId`

## 7. Reconciliação de saldo ✅ Feito (Fase 4 do redesign)
Dentro de `/contas`, botão "Conferir saldo" por conta, em `Client/Front/src/features/wealth/ContasPage.tsx`.
- `POST /api/accounts/:userId/:accountId/reconciliar` — usuário informa o saldo que vê no banco; a resposta já traz a diferença (`diferenca`, `bate: true/false`)
- `GET /api/accounts/:userId/:accountId/reconciliations` — histórico

## 8. Autenticação de dois fatores (2FA)
- `POST /api/2fa/setup` — gera QR code (`qrCode`, já em data URL — dá pra jogar direto num `<img src="...">`) e `secret`
- `POST /api/2fa/confirm` — usuário digita o primeiro código do app autenticador para ativar
- `POST /api/2fa/disable` — exige o código atual, não só estar logado
- **Mudança no fluxo de login:** `POST /api/login` agora pode devolver `{ requiresTotp: true, tempToken }` em vez do token de sessão direto. Nesse caso, pedir o código de 6 dígitos e chamar `POST /api/login/totp` com `{ tempToken, code }` para completar o login.
**Sugestão de UI:** tela de "Segurança" no perfil (ativar/desativar 2FA com QR code) + uma tela extra no fluxo de login para o código, só quando `requiresTotp` vier true.

## 9. Categorização automática no cadastro manual
Não precisa de UI nova — ao criar uma transação sem informar `categoria` (ou mandando "Outros"), o backend já preenche sozinho a partir da descrição. Só vale considerar deixar o campo de categoria como opcional/com sugestão automática na tela de cadastro de transação, em vez de obrigatório.

---

## Coisas que NÃO estão prontas (não implementar UI ainda)
- **Open Finance** (sincronia automática com o banco) — só a importação manual de extrato (item 4) foi feita.
- Push notification de verdade (Web Push API, funciona com o navegador fechado) — não existe. A Fase 5 do redesign adicionou um sino no Topbar (`NotificationsBell`, `Client/Front/src/app-shell/`) que faz polling de `GET /api/notifications/:userId` a cada 60s e mostra toast/badge só enquanto o app está aberto — mais perto de "notificação em tempo real dentro do app" do que de push de navegador. E-mail continua sendo o único canal que funciona com o app fechado.
