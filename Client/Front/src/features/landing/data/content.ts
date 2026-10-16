// ============================================================================
// Copy da landing. Um lugar só para texto, para ninguém caçar frase em JSX.
//
// REGRAS DA CASA
//  1. Só o que o produto faz hoje. Nada de Open Finance, sincronização
//     automática com banco, WhatsApp, foto de nota ou áudio.
//  2. Nenhuma métrica de usuário, depoimento, logo de parceiro ou
//     certificação. Segurança: só o que está verificável no código.
//  3. A plataforma é gratuita. Não há plano pago, checkout nem preço.
//  4. Todo número de demonstração vem de data/demo.ts e fecha com ele, e
//     todo módulo demonstrativo leva o selo DEMO_TAG.
//  5. Sem travessão em string visível.
//
// NARRATIVA: Registrar -> Organizar -> Compreender -> Planejar -> Decidir
// melhor. Cada capítulo do meio da página é um desses verbos (ver METHOD).
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
  { href: '#demo', label: 'Experimente' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#seguranca', label: 'Segurança' },
] as const;

/** Selo de todo módulo com dados de demonstração. */
export const DEMO_TAG = 'Demonstração · dados fictícios';

/** Trilho lateral: o fio que atravessa a página (só em telas largas). */
export const RAIL = [
  { id: 'problema', label: 'O problema' },
  { id: 'plataforma', label: 'Plataforma' },
  { id: 'agente', label: 'Registrar' },
  { id: 'demo', label: 'Experimente' },
  { id: 'recursos', label: 'Organizar' },
  { id: 'analises', label: 'Compreender' },
  { id: 'metas', label: 'Planejar' },
  { id: 'controle', label: 'Decidir' },
  { id: 'seguranca', label: 'Confiança' },
] as const;

/** A espinha da narrativa: cinco movimentos, cada um com o seu capítulo. */
export const METHOD = {
  eyebrow: 'Como a Moneta trabalha',
  title: 'Do caos à decisão,',
  accent: 'em cinco movimentos.',
  steps: [
    { n: '01', verb: 'Registrar', href: '#agente', body: 'Conversando com o agente, à mão ou importando o extrato do banco.' },
    { n: '02', verb: 'Organizar', href: '#recursos', body: 'Contas, cartões, gastos fixos e categorias, cada um no seu lugar.' },
    { n: '03', verb: 'Compreender', href: '#analises', body: 'Tendência, saúde financeira e previsão de saldo a partir do seu histórico.' },
    { n: '04', verb: 'Planejar', href: '#metas', body: 'Metas ligadas a contas e orçamento por categoria.' },
    { n: '05', verb: 'Decidir melhor', href: '#controle', body: 'Alertas, calendário e relatórios antes da surpresa chegar.' },
  ],
} as const;

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
  title: 'O dinheiro não precisa',
  accent: 'ser complicado.',
  lead: 'A fatura num app, o Pix em outro, um extrato baixado e nunca aberto, a meta guardada só na cabeça. Quando nada conversa, fica difícil decidir.',
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
  title: 'Sua vida financeira,',
  accent: 'em um só lugar.',
  lead: 'Saldo, receitas, despesas, contas a pagar, orçamento e metas na mesma tela. Você abre e já entende como está o mês.',
  callouts: [
    { id: 'saldo', text: 'Saldo de todas as contas, somado' },
    { id: 'evolucao', text: 'Para onde o saldo está indo' },
    { id: 'contas', text: 'O que vence nos próximos dias' },
    { id: 'orcamento', text: 'Orçamento consumido, em tempo real' },
  ],
};

export const AGENT = {
  eyebrow: '01 · Registrar',
  title: 'Sua inteligência',
  accent: 'financeira.',
  lead: 'O agente de IA vive dentro da Moneta. Você escreve do jeito que fala; ele entende o que aconteceu, registra no lugar certo e o painel responde na mesma hora.',
  steps: [
    { id: 'escreve', label: 'Você escreve' },
    { id: 'entende', label: 'A IA entende' },
    { id: 'registra', label: 'A Moneta registra' },
    { id: 'responde', label: 'O painel responde' },
  ],
  footnote:
    'É o fluxo do agente real: a mensagem vira uma ação estruturada (registrar gasto ou receita, listar gastos, gerar relatório, sugerir economia) que é executada nos seus dados.',
};

export const DEMO = {
  eyebrow: 'Demonstração interativa',
  title: 'Experimente agora.',
  accent: 'Sem criar conta.',
  lead: 'Escolha uma ação ou escreva do seu jeito. Tudo roda no seu navegador, com dados fictícios: nada é enviado, nada é salvo.',
  badge: 'Dados fictícios · roda só no seu navegador',
  groups: [
    {
      label: 'Registrar despesa',
      actions: ['Gastei 45 no Uber', 'Paguei 126,30 no mercado', 'Gastei 38 no cinema'],
    },
    { label: 'Registrar receita', actions: ['Recebi 850 de freelance'] },
    { label: 'Consultar', actions: ['Quanto gastei esse mês?', 'Me dá um relatório', 'Como posso economizar?'] },
  ],
  placeholder: 'Ex.: gastei 30 na farmácia',
  reset: 'Reiniciar demonstração',
  footnote:
    'Esta demonstração interpreta as mensagens com as mesmas regras do interpretador local do agente da Moneta (palavras-chave e valor). No produto, as mensagens também podem ser interpretadas por um modelo de IA.',
};

export const CONNECTED = {
  eyebrow: '02 · Organizar',
  title: 'Tudo conectado.',
  accent: 'Cada peça no seu lugar.',
  lead: 'Quatro perguntas que a Moneta responde sem você montar planilha: onde o dinheiro está, como ele entra, o que se repete e para onde ele vai.',
};

export const INSIGHTS = {
  eyebrow: '03 · Compreender',
  title: 'Entenda o que acontece',
  accent: 'com seu dinheiro.',
  lead: 'A Moneta compara o mês com o seu próprio histórico, mostra para onde o saldo caminha e quanto uma compra pesa antes de você decidir.',
  projectionNote: 'Cenários calculados a partir do seu histórico. Não são garantia de resultado.',
};

export const GOALS = {
  eyebrow: '04 · Planejar',
  title: 'Planeje seu',
  accent: 'próximo passo.',
  lead: 'Crie uma meta, vincule a uma conta e veja o progresso andar a cada depósito. O orçamento por categoria fecha o plano: você sabe quanto pode gastar sem tirar da meta.',
};

export const CONTROL = {
  eyebrow: '05 · Decidir melhor',
  title: 'Mais controle,',
  accent: 'menos surpresas.',
  lead: 'Alertas por categoria, contas recorrentes lançadas com um clique e um calendário com tudo o que vence. O mês para de pegar você desprevenido.',
};

export const TRUST = {
  eyebrow: 'Confiança',
  title: 'Sua vida financeira,',
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
