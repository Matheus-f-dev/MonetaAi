// Conteúdo da landing. Um lugar só pra texto e dados, pra ninguém precisar
// caçar copy dentro de JSX. Regra da casa: nada de travessão (—) em string
// visível, nada de número de marketing inventado.

const A = '/assets/moneta';

// Os 4 capítulos do filme. Cada um é uma fatia de 2s da mesma tomada contínua,
// então as costuras são frames reais, não aproximação.
export const CHAPTERS = [
  {
    id: 'mensagem',
    label: 'Mensagem',
    clip: `${A}/strike-01.mp4`,
    mobileClip: `${A}/strike-01-mobile.mp4`,
    poster: `${A}/strike-01-poster.jpg`,
    mobilePoster: `${A}/strike-01-mobile-poster.jpg`,
    title: 'Você escreve. A conta se fecha.',
    body: 'Manda a mensagem do jeito que você já fala. A Moneta transforma isso em lançamento exato, com categoria e conta.',
    align: 'left',
    scroll: 1.5,
  },
  {
    id: 'leitura',
    label: 'Leitura',
    clip: `${A}/strike-02.mp4`,
    mobileClip: `${A}/strike-02-mobile.mp4`,
    poster: `${A}/strike-02-poster.jpg`,
    mobilePoster: `${A}/strike-02-mobile-poster.jpg`,
    title: 'Ela entende sem você escolher nada.',
    body: 'Categoria, conta e cartão saem identificados da própria frase. Nenhum menu, nenhum formulário, nenhum campo obrigatório.',
    align: 'left',
    scroll: 1.4,
    linger: 0.18,
  },
  {
    id: 'saldo',
    label: 'Saldo',
    clip: `${A}/strike-03.mp4`,
    mobileClip: `${A}/strike-03-mobile.mp4`,
    poster: `${A}/strike-03-poster.jpg`,
    mobilePoster: `${A}/strike-03-mobile-poster.jpg`,
    title: 'O saldo já está certo.',
    body: 'Conta corrente, poupança e cada cartão atualizam na hora. Não existe fórmula pra quebrar porque não existe planilha.',
    align: 'right',
    scroll: 1.4,
  },
  {
    id: 'mes',
    label: 'Mês',
    clip: `${A}/strike-04.mp4`,
    mobileClip: `${A}/strike-04-mobile.mp4`,
    poster: `${A}/strike-04-poster.jpg`,
    mobilePoster: `${A}/strike-04-mobile-poster.jpg`,
    title: 'E o mês inteiro fica visível.',
    body: 'Metas, alertas e tendência de gasto num painel só, sem você somar nada na mão.',
    align: 'left',
    scroll: 1.6,
  },
];

// A transformação que é o produto: frase crua virando lançamento resolvido.
export const PARSES = [
  {
    raw: 'mercado 45,90',
    fields: [
      ['Categoria', 'Alimentação'],
      ['Conta', 'Conta Corrente'],
      ['Valor', 'R$ 45,90'],
    ],
  },
  {
    raw: 'uber 18,50',
    fields: [
      ['Categoria', 'Transporte'],
      ['Conta', 'Conta Corrente'],
      ['Valor', 'R$ 18,50'],
    ],
  },
  {
    raw: 'netflix 39,90 no cartão',
    fields: [
      ['Categoria', 'Assinaturas'],
      ['Conta', 'Cartão de crédito'],
      ['Valor', 'R$ 39,90'],
    ],
  },
  {
    raw: 'salário 4200',
    fields: [
      ['Categoria', 'Receita'],
      ['Conta', 'Conta Corrente'],
      ['Valor', 'R$ 4.200,00'],
    ],
  },
];

export const CAPABILITIES = [
  {
    glyph: 'tag',
    title: 'Categorização automática',
    body: 'Cada mensagem já sai classificada, de mercado a lazer, sem você abrir uma lista de categorias.',
    size: 'wide',
  },
  {
    glyph: 'wallet',
    title: 'Saldo por conta e por cartão',
    body: 'Corrente, poupança e cada cartão de crédito com saldo separado e sempre atualizado.',
    size: 'tall',
  },
  {
    glyph: 'target',
    title: 'Metas e orçamento',
    body: 'Defina quanto quer gastar por categoria no mês e acompanhe o progresso sem somar nada.',
    size: 'normal',
  },
  {
    glyph: 'bell',
    title: 'Alertas antes do estrago',
    body: 'Um aviso quando o orçamento de uma categoria está perto do limite, não um extrato no fim do mês.',
    size: 'normal',
  },
  {
    glyph: 'chart',
    title: 'Relatórios e tendência',
    body: 'Todas as contas e cartões num painel, com a direção que o seu gasto está tomando.',
    size: 'wide',
  },
];

// Fatos de arquitetura, verificáveis no código do produto. Não é estatística
// de crescimento e não deve virar uma.
export const ASSURANCES = [
  {
    glyph: 'shield',
    title: 'Cada conta é isolada',
    body: 'Seu histórico financeiro fica separado por usuário no banco de dados. Ninguém mais enxerga seus lançamentos.',
  },
  {
    glyph: 'key',
    title: 'Sua senha nunca é guardada',
    body: 'A autenticação passa pelo Firebase Auth. A Moneta não armazena sua senha, nem em texto puro nem cifrada.',
  },
  {
    glyph: 'trail',
    title: 'Toda movimentação deixa rastro',
    body: 'Transferência entre contas registra quem, quando e quanto. Não é só um número que muda na tela.',
  },
  {
    glyph: 'repeat',
    title: 'Reenviar não duplica',
    body: 'Se a mensagem falhar e você mandar de novo, o sistema reconhece a repetição e não lança duas vezes.',
  },
];

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Pra sair da planilha e começar a se organizar.',
    monthly: 0,
    annual: 0,
    priceLabel: 'Grátis',
    cta: 'Criar conta grátis',
    intent: 'signup',
    features: [
      '1 conta conectada',
      'Categorização automática',
      'Relatório simples do mês',
      'Registro por mensagem e pelo site',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Pra quem quer controle sério sem esforço manual.',
    monthly: 29.9,
    annual: 24.9,
    priceLabel: null,
    cta: 'Criar conta grátis',
    intent: 'signup',
    highlight: true,
    badge: 'Mais escolhido',
    features: [
      'Contas e cartões ilimitados',
      'Metas e orçamento por categoria',
      'Alertas de gasto por categoria',
      'Relatórios avançados e tendências',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Fluxo de caixa e controle compartilhado pra PJ e times.',
    monthly: 79.9,
    annual: 66.9,
    priceLabel: null,
    cta: 'Falar com vendas',
    intent: 'sales',
    features: [
      'Múltiplos usuários por conta',
      'Fluxo de caixa empresarial',
      'Exportação contábil',
      'Suporte prioritário',
    ],
  },
];

export const QUESTIONS = [
  {
    q: 'Meus dados financeiros ficam seguros?',
    a: 'Sim. Seus lançamentos ficam isolados por usuário no banco de dados e sua senha nunca é armazenada, porque a autenticação passa pelo Firebase Auth. O tratamento de dados segue a LGPD: você pode pedir exportação ou exclusão dos seus dados quando quiser.',
  },
  {
    q: 'Como funciona o registro por mensagem?',
    a: 'Você manda uma mensagem de texto descrevendo o gasto. O sistema lê só o que precisa pra registrar o lançamento, ou seja categoria, valor e conta, e não usa suas conversas pra mais nada.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim, sem multa e sem fidelidade. O cancelamento de planos pagos é feito direto no seu perfil e vale até o fim do período já pago.',
  },
  {
    q: 'Funciona pra conta conjunta ou pra empresa?',
    a: 'Pra uso compartilhado, seja conta conjunta, sócios ou time financeiro, o plano Business permite múltiplos usuários na mesma conta, com fluxo de caixa e exportação contábil.',
  },
  {
    q: 'Preciso pagar pra começar?',
    a: 'Não. O plano Starter é grátis e já registra seus gastos com categorização automática. Você só paga se precisar de contas ilimitadas, metas ou relatórios avançados.',
  },
  {
    q: 'Preciso instalar algum aplicativo?',
    a: 'Não. Pra registrar, basta mandar a mensagem. Pra ver relatórios, metas e configurações, é só acessar pelo navegador, no computador ou no celular.',
  },
];

export const NAV = [
  { href: '#mecanica', label: 'Como funciona' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#planos', label: 'Planos' },
  { href: '#perguntas', label: 'Perguntas' },
];
