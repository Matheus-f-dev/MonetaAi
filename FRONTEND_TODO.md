# Frontend TODO — o que o backend já entrega e ainda não tem tela

**Para:** responsável pelo `Client/Front/`
**Backend correspondente:** branches `security/audit-2026-08-27` → `feature/fase1-baixo-esforco` → `feature/fase2-medio-esforco` → `feature/fase3-mais-ambicioso` (aguardando merge em `main`)
**Documentação completa de toda a API:** suba o backend (`npm start` em `Service/`) e acesse `http://localhost:3000/api-docs` — dá pra ver o corpo esperado de cada rota e testar direto por lá.

Todas as rotas abaixo já existem, funcionam e estão testadas no backend. Nenhuma tem UI ainda.

---

## 1. Receita recorrente
Igual a "gastos fixos", só que para receita (salário, renda extra mensal).
- `POST /api/fixed-incomes` — criar
- `GET /api/fixed-incomes/:userId` — listar
- `PUT /api/fixed-incomes/:fixedIncomeId` — editar
- `DELETE /api/fixed-incomes/:fixedIncomeId` — remover
- `POST /api/fixed-incomes/:fixedIncomeId/lancar` — lança a transação do mês corrente
**Sugestão de UI:** espelhar a tela de gastos fixos que já existe.

## 2. E-mail quando um alerta dispara
Não precisa de tela nova — já funciona sozinho quando um alerta configurado na tela de Alertas estoura. Só vale confirmar com o usuário se o campo de e-mail cadastrado está correto.

## 3. Exportação de relatórios (CSV/PDF)
- `GET /api/relatorios/:userId/export?formato=csv|pdf&periodo=mes|ano|tudo`
**Sugestão de UI:** um botão "Exportar" na tela de Relatórios/Analytics, com um seletor de formato e período. A resposta já vem pronta para download (`Content-Type` de CSV ou PDF).

## 4. Importação de extrato bancário
Fluxo em duas etapas:
- `POST /api/transactions/import/preview?formato=ofx|csv-nubank` — multipart, campo `arquivo`. Devolve uma lista com categoria sugerida e um aviso em cada linha que já foi importada antes.
- `POST /api/transactions/import/confirm` — recebe a lista (editada ou não pelo usuário) e grava.
**Sugestão de UI:** tela de "Importar extrato" com upload de arquivo → tabela de prévia editável (categoria, valor, se marca ou desmarca alguma linha) → botão "Confirmar importação".

## 5. Orçamento por categoria
- `POST /api/budgets` — criar (categoria + limite mensal)
- `GET /api/budgets/:userId` — listar
- `GET /api/budgets/:userId/status` — % consumido no mês por categoria (já vem pronto: `limiteMensal`, `totalGasto`, `percentual`, `estourado`)
- `PUT/DELETE /api/budgets/:budgetId`
**Sugestão de UI:** cards ou barras de progresso por categoria, parecido com o layout que já existe nos gastos por categoria.

## 6. Metas financeiras
- `POST /api/goals` — criar (nome, valor alvo, prazo opcional, conta vinculada opcional)
- `GET /api/goals/:userId` — listar
- `GET /api/goals/:userId/progress` — progresso de cada meta
- `PUT/DELETE /api/goals/:goalId`
**Sugestão de UI:** cards com barra de progresso (valor atual / valor alvo), tela nova "Metas".

## 7. Reconciliação de saldo
- `POST /api/accounts/:userId/:accountId/reconciliar` — usuário informa o saldo que vê no banco; a resposta já traz a diferença (`diferenca`, `bate: true/false`)
- `GET /api/accounts/:userId/:accountId/reconciliations` — histórico
**Sugestão de UI:** dentro da tela de Contas, um botão "Conferir saldo" por conta.

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
- Push notification no navegador para alertas — só o e-mail foi implementado.
