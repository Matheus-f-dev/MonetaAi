// ============================================================================
// Copy da landing. Um lugar só para texto, para ninguém caçar frase em JSX.
//
// REGRAS DA CASA
//  1. Só o que o produto faz hoje. Nada de Open Finance, sincronização
//     automática com banco, WhatsApp, foto de nota ou áudio.
//  2. Nenhuma métrica de usuário, depoimento, logo de parceiro ou
//     certificação. Segurança: só o que está verificável no código.
//  3. A plataforma é gratuita. Não há plano pago, checkout nem preço.
//  4. Todo número de demonstração vem de data/demo.ts e fecha com ele.
//  5. Sem travessão em string visível.
//
// PENDENTE (não renderizado de propósito):
//  - 2FA: o login já aceita o código, mas ainda não há tela para o usuário
//    ativar (Fase 8 do FRONTEND_TODO). Quando houver, entra em TRUST.items.
//  - Exclusão de conta pelo próprio usuário: a rota existe no backend, sem
//    tela no Perfil. Idem.
// ============================================================================

export const NAV = [
  { href: '#plataforma', label: 'Plataforma' },
  { href: '#agente', label: 'Agente de IA' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#analises', label: 'Análises' },
  { href: '#seguranca', label: 'Segurança' },
] as const;

/** Trilho lateral: o fio que atravessa a página (só em telas largas). */
export const RAIL = [
  { id: 'problema', label: 'O problema' },
  { id: 'plataforma', label: 'Plataforma' },
  { id: 'agente', label: 'Agente' },
  { id: 'recursos', label: 'Conectado' },
  { id: 'analises', label: 'Análises' },
  { id: 'metas', label: 'Metas' },
  { id: 'controle', label: 'Controle' },
  { id: 'seguranca', label: 'Confiança' },
] as const;

export const HERO = {
  eyebrow: 'Gestão financeira com IA · Grátis',
  lines: ['Seu dinheiro.', 'Mais claro.', 'Mais inteligente.'],
  lead: 'Organize seus gastos, acompanhe seus objetivos e entenda suas finanças com a ajuda da inteligência artificial. Tudo em um só lugar.',
  primary: 'Começar gratuitamente',
  secondary: 'Conhecer a plataforma',
  note: 'Grátis para usar. Sem cartão de crédito.',
  scroll: 'Role para conhecer',
};

export const PROBLEM = {
  eyebrow: 'O problema',
  title: 'Seu dinheiro está em todo lugar.',
  accent: 'Menos num lugar só.',
  lead: 'A fatura num app, o Pix em outro, a planilha parada em março e a meta guardada só na cabeça. Quando nada conversa, fica difícil decidir.',
  resolved: 'Na Moneta, tudo vira um lugar só.',
  ledgerTitle: 'Outubro · organizado',
  fragments: [
    { kind: 'card', title: 'Fatura do cartão', meta: 'vence dia 25', value: 'R$ 642,80', cat: 'Cartão' },
    { kind: 'pix', title: 'Pix recebido · Rafa', meta: 'parte da pizza', value: '+ R$ 32,00', cat: 'Rachadinha' },
    { kind: 'sheet', title: 'extrato_setembro.csv', meta: 'baixado e nunca aberto', value: '???', final: '38 itens', cat: 'Importado' },
    { kind: 'ride', title: 'Uber', meta: 'ontem, 23:40', value: 'R$ 18,50', cat: 'Transporte' },
    { kind: 'food', title: 'iFood', meta: 'sexta', value: 'R$ 54,90', cat: 'Alimentação' },
    { kind: 'sub', title: 'Netflix', meta: 'renovação mensal', value: 'R$ 44,90', cat: 'Assinaturas' },
    { kind: 'goal', title: 'Meta: intercâmbio', meta: 'quanto falta?', value: '?', final: '41%', cat: 'Meta' },
    { kind: 'rent', title: 'Aluguel', meta: 'todo dia 5', value: 'R$ 1.050,00', cat: 'Moradia' },
    { kind: 'salary', title: 'Estágio', meta: 'caiu dia 5', value: '+ R$ 2.400,00', cat: 'Renda' },
  ],
} as const;

export const PLATFORM = {
  eyebrow: 'A plataforma',
  title: 'Um lugar só para',
  accent: 'a sua vida financeira.',
  lead: 'Saldo, receitas, despesas, contas a pagar, orçamento e metas na mesma tela. Você abre e já entende como está o mês.',
  callouts: [
    { id: 'saldo', text: 'Saldo de todas as contas, somado' },
    { id: 'evolucao', text: 'Para onde o saldo está indo' },
    { id: 'contas', text: 'O que vence nos próximos dias' },
    { id: 'orcamento', text: 'Orçamento consumido, em tempo real' },
  ],
  caption: 'Painel com dados ilustrativos.',
};

export const AGENT = {
  eyebrow: 'Agente de IA',
  title: 'Você conversa.',
  accent: 'A Moneta executa.',
  lead: 'O agente vive dentro da plataforma. Você escreve do jeito que fala, ele registra, consulta e sugere, e cada resposta já aparece no seu painel.',
  footnote:
    'Conversa ilustrativa, no formato do agente real. Ele registra gastos e receitas, lista movimentações, gera relatórios do período e sugere onde economizar.',
  steps: [
    { id: 'gasto', label: 'Registrar um gasto' },
    { id: 'consulta', label: 'Consultar o mês' },
    { id: 'dica', label: 'Pedir uma dica' },
  ],
};

export const CONNECTED = {
  eyebrow: 'Tudo conectado',
  title: 'Cada peça conversa',
  accent: 'com as outras.',
  lead: 'A compra no cartão entra na fatura, conta para o orçamento da categoria, aparece no calendário e muda o saldo. Você não reconcilia nada na mão.',
};

export const INSIGHTS = {
  eyebrow: 'Análises',
  title: 'Enxergue além',
  accent: 'do saldo.',
  lead: 'A Moneta compara o mês com o seu próprio histórico, mostra para onde o saldo caminha e quanto uma compra pesa antes de você decidir.',
  projectionNote: 'Cenários calculados a partir do seu histórico. Não são garantia de resultado.',
};

export const GOALS = {
  eyebrow: 'Metas e orçamento',
  title: 'Seus objetivos',
  accent: 'ganham forma.',
  lead: 'Crie uma meta, vincule a uma conta e veja o progresso andar a cada depósito. O orçamento por categoria fecha o plano: você sabe quanto pode gastar sem tirar da meta.',
};

export const CONTROL = {
  eyebrow: 'Controle',
  title: 'Mais controle.',
  accent: 'Menos surpresa.',
  lead: 'Alertas por categoria, contas recorrentes lançadas com um clique e um calendário com tudo o que vence. O mês para de pegar você desprevenido.',
};

export const TRUST = {
  eyebrow: 'Confiança',
  title: 'Seus dados,',
  accent: 'do seu jeito.',
  lead: 'O que a Moneta faz hoje para proteger a sua conta e deixar o painel com a sua cara. Sem sigla de marketing.',
  items: [
    {
      title: 'Entre com o Google',
      body: 'Use a sua conta Google para entrar, ou e-mail e senha, se preferir.',
    },
    {
      title: 'Salário guardado cifrado',
      body: 'A média salarial que você informa fica cifrada no banco de dados, nunca em texto aberto.',
    },
    {
      title: 'Cada conta é só sua',
      body: 'Seus lançamentos ficam ligados ao seu login, e a plataforma confere quem está pedindo antes de devolver qualquer dado.',
    },
    {
      title: 'Claro, escuro ou automático',
      body: 'O painel segue a sua preferência ou o tema do sistema.',
    },
    {
      title: 'Com a sua cara',
      body: 'Foto de perfil, cor de destaque e tamanho da fonte ajustáveis no seu perfil.',
    },
  ],
};

export const CLOSING = {
  title: 'Seu próximo passo financeiro',
  accent: 'começa aqui.',
  lead: 'Conheça uma forma mais inteligente de cuidar do seu dinheiro.',
  primary: 'Começar gratuitamente',
  secondary: 'Já tenho conta',
  note: 'Grátis para usar. Leva um minuto para criar a conta.',
};

export const FOOTER = {
  tagline: 'Gestão financeira pessoal com inteligência artificial, feita para quem está começando a cuidar do próprio dinheiro.',
  legal: 'Moneta AI. Todos os direitos reservados.',
};
