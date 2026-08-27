// Mesma tabela de palavras-chave que já orientava a IA do agente (antes só
// existia como texto dentro do prompt, em agentPrompt.js) — extraída aqui
// pra virar uma função determinística reaproveitável em qualquer lugar que
// crie uma transação sem categoria explícita (cadastro manual, importação
// de extrato, fallback do próprio agente).
const REGRAS = [
  { categoria: 'Transporte', palavras: ['uber', 'taxi', 'táxi', 'onibus', 'ônibus', 'metro', 'metrô', 'combustivel', 'combustível', 'gasolina', '99'] },
  { categoria: 'Alimentação', palavras: ['mercado', 'supermercado', 'restaurante', 'lanche', 'comida', 'ifood', 'delivery'] },
  { categoria: 'Assinaturas', palavras: ['netflix', 'spotify', 'amazon', 'disney', 'streaming', 'assinatura'] },
  { categoria: 'Saúde', palavras: ['farmacia', 'farmácia', 'medico', 'médico', 'hospital', 'remedio', 'remédio', 'consulta'] },
  { categoria: 'Moradia', palavras: ['luz', 'agua', 'água', 'internet', 'aluguel', 'condominio', 'condomínio'] },
  { categoria: 'Lazer', palavras: ['academia', 'cinema', 'show', 'viagem', 'bar'] },
  { categoria: 'Educação', palavras: ['escola', 'curso', 'livro', 'faculdade'] },
  { categoria: 'Renda', palavras: ['salario', 'salário', 'freelance', 'renda extra', 'pagamento recebido'] }
];

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // remove acentos pra comparar sem depender de acentuação exata
}

// Retorna a categoria inferida pela descrição, ou null se nenhuma regra bater
// (quem chama decide o fallback — "Outros" pro cadastro manual, "Renda" pro
// registrarReceita do agente, etc.).
function inferirCategoria(descricao) {
  if (!descricao || typeof descricao !== 'string') return null;

  const texto = normalizar(descricao);
  for (const regra of REGRAS) {
    const bateu = regra.palavras.some((palavra) => texto.includes(normalizar(palavra)));
    if (bateu) return regra.categoria;
  }
  return null;
}

module.exports = { inferirCategoria };
