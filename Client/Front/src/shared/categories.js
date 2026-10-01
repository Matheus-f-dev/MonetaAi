// Fonte única da lista de categorias — antes duplicada em TransactionModal e Alerts.
// Qualquer tela que precise das categorias de gasto/receita deve importar daqui.
export const CATEGORIES = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Educação',
  'Vestuário', 'Tecnologia', 'Assinaturas e serviços', 'Impostos e taxas',
  'Doações e caridade', 'Pets', 'Investimentos', 'Dívidas e financiamentos',
  'Presentes e comemorações', 'Casa e decoração', 'Serviços domésticos',
  'Trabalho / Renda extra', 'Salário / Provento fixo', 'Renda', 'Outros'
];

// Categorias sugeridas pra Investimentos -- lista livre (campo texto no
// backend, não enum), só ajuda a preencher rápido no formulário.
export const INVESTMENT_CATEGORIES = [
  'Aposentadoria', 'Reserva de emergência', 'Carro', 'Casa / Apartamento',
  'Viagem', 'Educação dos filhos', 'Renda fixa', 'Renda variável',
  'Criptomoedas', 'Previdência privada', 'Outro'
];
