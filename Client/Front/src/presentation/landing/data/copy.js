// ============================================================================
// Toda a copy da landing. Um lugar só, para ninguém caçar texto dentro de JSX.
//
// REGRAS DA CASA
//  1. Nenhuma métrica de negócio inventada. Sem "50 mil usuários", sem
//     "R$ 100 milhões gerenciados", sem depoimento fictício, sem logo de
//     cliente que não existe.
//  2. Nenhuma certificação, norma ou tecnologia de segurança que não esteja
//     confirmada no código. O que está afirmado em SECURITY abaixo é
//     verificável no repositório; o que falta está em SECURITY_TODO, como
//     placeholder marcado, e não é renderizado.
//  3. Todo número de insight é aritmeticamente verdadeiro contra data/demo.js.
//  4. Sem travessão em string visível.
// ============================================================================

export const BRAND = {
  name: 'MonetaAI',
  domain: 'monetaai.site',
  // CONFIRMAR: caixa de vendas e de suporte. Seguindo o domínio de produção.
  sales: 'mailto:contato@monetaai.site?subject=Plano%20Business',
  support: 'mailto:contato@monetaai.site?subject=Suporte',
};

export const ROUTES = {
  signup: '/cadastro',
  signin: '/login',
  privacy: '/privacy-policy',
  terms: '/terms-of-service',
};

export const CTA = {
  primary: 'Começar agora',
  secondary: 'Ver como funciona',
  signin: 'Entrar',
  explore: 'Explorar a plataforma',
  sales: 'Falar com vendas',
};

export const NAV = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#inteligencia', label: 'Inteligência' },
  { href: '#produto', label: 'Produto' },
  { href: '#seguranca', label: 'Segurança' },
  { href: '#planos', label: 'Planos' },
];

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
export const HERO = {
  eyebrow: 'Gestão financeira inteligente',
  titleA: 'Entenda seu dinheiro.',
  titleB: 'Decida melhor.',
  lead:
    'A MonetaAI transforma uma frase comum em lançamento exato, organiza o mês inteiro sozinha e explica o que os seus números querem dizer. Sem planilha, sem formulário, sem somar nada na mão.',
  note: 'Plano Starter grátis, sem cartão de crédito.',
  panelPath: 'monetaai.site/app',
  captureLabel: 'Você manda',
  captureText: 'mercado 186,40 no débito',
  captureResolved: ['Alimentação', 'Conta corrente', 'R$ 186,40'],
};

// ---------------------------------------------------------------------------
// 01 · Problema
// ---------------------------------------------------------------------------
export const PROBLEM = {
  index: '01',
  eyebrow: 'O problema',
  title: 'Você sabe para onde seu dinheiro está indo?',
  lead:
    'Quase todo mundo sabe quanto ganha e quanto sobrou. O que ninguém sabe é o meio: as dezenas de decisões pequenas que decidem o mês. Elas ficam espalhadas em extrato, fatura, comprovante e numa planilha que você parou de atualizar em março.',
  rows: [
    {
      n: '01',
      action: 'Lançar cada gasto na mão',
      outcome: 'você desiste na segunda semana e o mês fica pela metade',
    },
    {
      n: '02',
      action: 'Somar categoria na planilha',
      outcome: 'o número chega quando o mês já acabou e não dá mais para agir',
    },
    {
      n: '03',
      action: 'Abrir o extrato do banco',
      outcome: 'ele mostra o que aconteceu, nunca o que fazer a respeito',
    },
  ],
  captionA: 'Seu mês hoje',
  captionB: 'Seu mês na MonetaAI',
};

// ---------------------------------------------------------------------------
// 02 · Como funciona
// ---------------------------------------------------------------------------
export const MECHANIC = {
  index: '02',
  eyebrow: 'Como funciona',
  title: 'Você fala. A MonetaAI lança.',
  lead:
    'Três formas de registrar, um único lançamento no fim. Categoria, conta e valor saem identificados da própria frase, sem menu e sem campo obrigatório.',
  resolvedLabel: 'Lançamento registrado',
  steps: [
    {
      n: '01',
      label: 'Você manda',
      body: 'Texto, foto da nota ou áudio. Do jeito que já sai da sua cabeça.',
    },
    {
      n: '02',
      label: 'A MonetaAI lê',
      body: 'Ela identifica tipo, categoria, conta e valor no que você escreveu.',
    },
    {
      n: '03',
      label: 'O saldo fecha',
      body: 'Conta, cartão e o mês inteiro atualizam na hora, sem confirmação manual.',
    },
  ],
};

// ---------------------------------------------------------------------------
// 03 · Inteligência
// ---------------------------------------------------------------------------
export const INTEL = {
  index: '03',
  eyebrow: 'Inteligência',
  titleA: 'Não mostramos apenas seus números.',
  titleB: 'Ajudamos você a entendê-los.',
  lead:
    'Um extrato conta o passado. A MonetaAI compara o seu mês com o seu próprio padrão, encontra o que mudou e diz em português o que aquilo significa para as suas próximas semanas.',
  kicker: 'A inteligência não fica esperando você perguntar.',
  pipeline: [
    { n: '01', label: 'Seus dados', body: 'Cada lançamento entra classificado, com conta, categoria e data.' },
    { n: '02', label: 'A MonetaAI organiza', body: 'O histórico vira série por categoria, conta e cartão.' },
    { n: '03', label: 'A IA encontra padrões', body: 'Ela compara o mês corrente com a sua média e acha o desvio.' },
    { n: '04', label: 'Você recebe o insight', body: 'Uma frase com o número, a causa e o tamanho do efeito.' },
    { n: '05', label: 'Você decide melhor', body: 'Com tempo de reagir, ainda dentro do mês que dá para mudar.' },
  ],
  // Cada insight aponta a tela do produto que o gera. É isso que separa
  // inteligência de enfeite: dá para conferir de onde saiu.
  insights: [
    {
      kind: 'desvio',
      text: 'Seus gastos com Alimentação subiram 18% em relação à sua média dos últimos 3 meses.',
      source: 'Análises · Despesas por categoria',
    },
    {
      kind: 'tendência',
      text: 'As despesas de setembro estão R$ 254 acima da sua média dos últimos 5 meses.',
      source: 'Análises · Evolução mensal',
    },
    {
      kind: 'alerta',
      text: 'Transporte já consumiu 90% do orçamento de R$ 900 que você definiu.',
      source: 'Alertas · Orçamento por categoria',
    },
    {
      kind: 'meta',
      text: 'Guardando R$ 260 a mais por mês, você chega na Reserva de emergência 3 meses antes.',
      source: 'Projeção de saldo · Cenários',
    },
    {
      kind: 'impacto',
      text: 'Parcelar esses R$ 2.400 em 6x compromete 42% da sua folga mensal.',
      source: 'Análise de impacto financeiro',
    },
  ],
};

// ---------------------------------------------------------------------------
// 04 · Produto
// ---------------------------------------------------------------------------
export const PRODUCT = {
  index: '04',
  eyebrow: 'O produto',
  title: 'Sua vida financeira em uma visão.',
  lead:
    'Contas, cartões, categorias, orçamento e projeção no mesmo painel. Nada aqui exige que você monte relatório: a tela já vem montada.',
  demoNote: 'Dados de demonstração',
  tabs: [
    { id: 'geral', label: 'Visão geral' },
    { id: 'analises', label: 'Análises' },
    { id: 'projecao', label: 'Projeção' },
    { id: 'alertas', label: 'Alertas' },
  ],
  panes: {
    geral: {
      title: 'O mês fechado, sem você fechar nada',
      body: 'Saldo consolidado, receitas, despesas e os últimos lançamentos. Cada conta e cada cartão com o seu próprio saldo.',
    },
    analises: {
      title: 'Onde o dinheiro está indo',
      body: 'Despesas por categoria e a relação entre o que entra e o que sai ao longo dos meses, com o desvio destacado.',
    },
    projecao: {
      title: 'Para onde ele está caminhando',
      body: 'Três cenários de saldo futuro calculados a partir do seu próprio histórico: pessimista, realista e otimista.',
    },
    alertas: {
      title: 'O aviso antes do estrago',
      body: 'Um limite por categoria e o progresso do mês. O alerta chega enquanto ainda dá para mudar o resultado.',
    },
  },
};

// ---------------------------------------------------------------------------
// 05 · Recursos
// ---------------------------------------------------------------------------
export const FEATURES = {
  index: '05',
  eyebrow: 'Recursos',
  title: 'O que isso muda no seu mês.',
  lead: 'Cada recurso abaixo existe no produto hoje. Nenhum está na frase “em breve”.',
  items: [
    {
      n: '01',
      icon: 'chat',
      title: 'Registro por texto, foto ou voz',
      body: 'Registrar deixa de ser tarefa. Você manda como já fala e o lançamento sai pronto do outro lado.',
    },
    {
      n: '02',
      icon: 'tag',
      title: 'Categorização automática',
      body: 'Nenhuma lista para rolar. Cada gasto já chega classificado, de mercado a assinatura.',
    },
    {
      n: '03',
      icon: 'wallet',
      title: 'Saldo por conta e por cartão',
      body: 'Corrente, poupança e cada cartão com saldo próprio. Você para de descobrir a fatura no vencimento.',
    },
    {
      n: '04',
      icon: 'bell',
      title: 'Alertas por categoria',
      body: 'Você fica sabendo que passou do limite durante o mês, não no extrato do mês seguinte.',
    },
    {
      n: '05',
      icon: 'chart',
      title: 'Análises e tendência',
      body: 'Categorias, evolução e potencial de economia. O que mudou e para que lado está indo.',
    },
    {
      n: '06',
      icon: 'forecast',
      title: 'Projeção de saldo futuro',
      body: 'Três cenários para os próximos meses, para decidir com antecedência em vez de reagir depois.',
    },
    {
      n: '07',
      icon: 'scale',
      title: 'Impacto de uma compra',
      body: 'Antes de comprar, veja o que aquele valor faz com a sua folga e com as suas metas.',
    },
    {
      n: '08',
      icon: 'export',
      title: 'Relatórios exportáveis',
      body: 'Leve os números para onde precisar, em planilha, sem copiar linha por linha.',
    },
  ],
};

// ---------------------------------------------------------------------------
// 06 · Segurança e confiança
// ---------------------------------------------------------------------------
export const SECURITY = {
  index: '06',
  eyebrow: 'Segurança',
  title: 'Seus dados financeiros merecem esse cuidado.',
  lead:
    'Abaixo está o que a MonetaAI faz hoje, em português e sem sigla de marketing. Cada item é uma decisão de arquitetura do produto, não uma promessa.',
  items: [
    {
      icon: 'key',
      title: 'Sua senha não fica com a gente',
      body: 'A autenticação passa pelo Firebase Auth. A MonetaAI não armazena a sua senha, nem em texto puro nem cifrada.',
    },
    {
      icon: 'shield',
      title: 'Cada conta é isolada',
      body: 'Seu histórico financeiro fica separado por usuário no banco de dados. Ninguém mais enxerga os seus lançamentos.',
    },
    {
      icon: 'trail',
      title: 'Toda movimentação deixa rastro',
      body: 'Transferência entre contas registra quem, quando e quanto. Não é só um número que muda na tela.',
    },
    {
      icon: 'repeat',
      title: 'Reenviar não duplica',
      body: 'Se a mensagem falhar e você mandar de novo, o sistema reconhece a repetição e não lança duas vezes.',
    },
    {
      icon: 'eye',
      title: 'A leitura serve só ao lançamento',
      body: 'Da sua mensagem, o sistema extrai categoria, valor e conta. A conversa não é usada para mais nada.',
    },
    {
      icon: 'doc',
      title: 'LGPD: você manda nos seus dados',
      body: 'Você pode pedir exportação ou exclusão dos seus dados quando quiser, e a exportação em planilha já está no produto.',
    },
  ],
  // Objeções, não features. Todas verificáveis no produto e no FAQ.
  trust: [
    { title: 'Começa grátis', body: 'O plano Starter não custa nada e não pede cartão.' },
    { title: 'Cancela quando quiser', body: 'Sem multa e sem fidelidade, direto no seu perfil.' },
    { title: 'Não instala nada', body: 'Funciona no navegador, no computador e no celular.' },
    { title: 'Seus dados saem com você', body: 'Exportação em planilha a qualquer momento.' },
  ],
};

// PLACEHOLDER MARCADO, de propósito NÃO renderizado.
// Preencher só com o que for auditável. Enquanto não houver, a landing não
// afirma nada disso: certificação inventada em produto financeiro é o pior
// tipo de copy que existe.
export const SECURITY_TODO = [
  // { title: 'Criptografia em trânsito e em repouso', body: 'CONFIRMAR: algoritmo e escopo.' },
  // { title: 'Certificação',   body: 'CONFIRMAR: existe SOC 2 / ISO 27001 / PCI DSS?' },
  // { title: 'Open Finance',   body: 'CONFIRMAR: existe integração bancária homologada pelo BCB?' },
  // { title: 'Dois fatores',   body: 'CONFIRMAR: 2FA está disponível para o usuário final?' },
];

// ---------------------------------------------------------------------------
// 07 · Resultado
// ---------------------------------------------------------------------------
export const OUTCOME = {
  index: '07',
  eyebrow: 'O resultado',
  titleA: 'Mais clareza.',
  titleB: 'Menos preocupação.',
  lead:
    'A diferença não é ter mais gráfico. É chegar no dia 20 sabendo exatamente onde você está e o que ainda dá para fazer.',
  rows: [
    { before: 'Descobrir no extrato', after: 'Saber durante o mês' },
    { before: 'Achar que gastou demais', after: 'Saber quanto e em quê' },
    { before: 'Planilha desatualizada', after: 'Painel que se atualiza sozinho' },
    { before: 'Meta como intenção', after: 'Meta com progresso visível' },
  ],
};

// ---------------------------------------------------------------------------
// 08 · Planos · valores reais do produto
// ---------------------------------------------------------------------------
export const PLANS = {
  index: '08',
  eyebrow: 'Planos',
  title: 'Comece de graça. Cresça se precisar.',
  lead:
    'Sem fidelidade e sem multa. O cancelamento é feito no seu perfil e vale até o fim do período já pago.',
  toggle: { monthly: 'Mensal', annual: 'Anual', hint: 'Anual sai por menos' },
  items: [
    {
      id: 'starter',
      name: 'Starter',
      tagline: 'Para sair da planilha e começar a se organizar.',
      monthly: 0,
      annual: 0,
      priceLabel: 'Grátis',
      cta: 'Começar agora',
      intent: 'signup',
      features: [
        '1 conta conectada',
        'Registro por texto, foto ou voz',
        'Categorização automática',
        'Relatório simples do mês',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'Para quem quer controle sério sem esforço manual.',
      monthly: 29.9,
      annual: 24.9,
      priceLabel: null,
      cta: 'Começar agora',
      intent: 'signup',
      highlight: true,
      badge: 'Mais escolhido',
      features: [
        'Contas e cartões ilimitados',
        'Metas e orçamento por categoria',
        'Alertas de gasto por categoria',
        'Análises, tendência e projeção de saldo',
      ],
    },
    {
      id: 'business',
      name: 'Business',
      tagline: 'Fluxo de caixa e controle compartilhado para PJ e times.',
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
  ],
};

// ---------------------------------------------------------------------------
// 09 · Perguntas
// ATENÇÃO: este bloco espelha o FAQPage em index.html. Mudou aqui, muda lá.
// ---------------------------------------------------------------------------
export const QUESTIONS = {
  index: '09',
  eyebrow: 'Perguntas',
  title: 'O que costumam perguntar antes de começar.',
  items: [
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
  ],
};

// ---------------------------------------------------------------------------
// 10 · Fechamento
// ---------------------------------------------------------------------------
export const CLOSING = {
  titleA: 'Seu dinheiro não precisa',
  titleB: 'ser complicado.',
  lead: 'Tenha clareza sobre suas finanças e inteligência para tomar decisões melhores.',
  note: 'Plano Starter grátis. Leva um minuto para criar a conta.',
};

// ---------------------------------------------------------------------------
// 11 · Rodapé
// Só links que existem. Sem rede social, porque não há perfil confirmado.
// ---------------------------------------------------------------------------
export const FOOTER = {
  tagline: 'Gestão financeira inteligente para quem quer entender o próprio dinheiro.',
  columns: [
    {
      title: 'Produto',
      links: [
        { label: 'Como funciona', href: '#como-funciona' },
        { label: 'Inteligência', href: '#inteligencia' },
        { label: 'O painel', href: '#produto' },
        { label: 'Recursos', href: '#recursos' },
      ],
    },
    {
      title: 'Planos',
      links: [
        { label: 'Starter', href: '#planos' },
        { label: 'Pro', href: '#planos' },
        { label: 'Business', href: '#planos' },
        { label: 'Falar com vendas', href: 'mailto:contato@monetaai.site?subject=Plano%20Business', external: true },
      ],
    },
    {
      title: 'Confiança',
      links: [
        { label: 'Segurança', href: '#seguranca' },
        { label: 'Perguntas', href: '#perguntas' },
        { label: 'Contato', href: 'mailto:contato@monetaai.site?subject=Suporte', external: true },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Política de privacidade', href: '/privacy-policy', route: true },
        { label: 'Termos de uso', href: '/terms-of-service', route: true },
      ],
    },
  ],
  legal: 'MonetaAI. Todos os direitos reservados.',
};
