// Arquitetura de informação definida na Fase 0 -- 7 grupos, cada um
// respondendo "o que isso toca" em vez dos 12 itens soltos e no mesmo
// nível que a sidebar antiga tinha. Só entram aqui rotas que já existem
// de verdade; funcionalidades novas do FRONTEND_TODO.md (receita
// recorrente, importar extrato, orçamentos, metas, segurança/2FA) somam
// item nesta lista na própria fase que constrói a tela -- não antes.
export interface NavItem {
  label: string;
  path: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Visão geral',
    items: [{ label: 'Painel', path: '/system' }]
  },
  {
    label: 'Movimentações',
    items: [
      { label: 'Gastos', path: '/expenses' },
      { label: 'Receitas', path: '/incomes' },
      { label: 'Gastos fixos', path: '/gastos-fixos' },
      { label: 'Receita recorrente', path: '/receita-recorrente' },
      { label: 'Importar extrato', path: '/importar-extrato' }
    ]
  },
  {
    label: 'Patrimônio',
    items: [
      { label: 'Contas', path: '/contas' },
      { label: 'Cartões', path: '/cartoes' },
      { label: 'Orçamento', path: '/orcamento' },
      { label: 'Metas', path: '/metas' },
      { label: 'Investimentos', path: '/investimentos' }
    ]
  },
  {
    label: 'Pessoas',
    items: [
      { label: 'Pessoas', path: '/pessoas' },
      { label: 'Rachadinha', path: '/rachadinha' }
    ]
  },
  {
    label: 'Insights',
    items: [
      { label: 'Análises', path: '/analytics' },
      { label: 'Relatórios', path: '/reports' },
      { label: 'Impacto financeiro', path: '/impacto-financeiro' }
    ]
  },
  {
    label: 'Automação',
    items: [
      { label: 'Agente IA', path: '/agent' },
      { label: 'Alertas', path: '/alerts' }
    ]
  },
  {
    label: 'Configurações',
    items: [{ label: 'Perfil', path: '/profile' }]
  }
];
