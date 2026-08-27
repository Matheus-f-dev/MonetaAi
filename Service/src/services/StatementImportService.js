const crypto = require('crypto');
const { inferirCategoria } = require('./CategoryInference');

// ── OFX (SGML v1, o formato que a maioria dos bancos brasileiros ainda
// exporta) ──────────────────────────────────────────────────────────────
// Não usamos uma lib de parse de OFX genérica de propósito: a única
// candidata madura no npm (node-ofx-parser) trava numa versão antiga e
// vulnerável do fast-xml-parser (prototype pollution) sem correção
// disponível na faixa de versão que ela aceita -- forçar a versão nova via
// override quebra a lib (ela chama uma função que não existe mais na API
// nova). Como só precisamos dos blocos <STMTTRN>, um extrator bem mais
// simples e sem dependência dá conta do recado com muito menos superfície
// de ataque em cima de um arquivo que é, por definição, enviado pelo
// usuário (não confiável).
function parseOFX(conteudo) {
  const blocos = conteudo.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi) || [];

  return blocos.map((bloco) => {
    const campo = (tag) => {
      const m = bloco.match(new RegExp(`<${tag}>([^\r\n<]*)`, 'i'));
      return m ? m[1].trim() : null;
    };

    const dtPosted = campo('DTPOSTED'); // formato YYYYMMDD ou YYYYMMDDHHMMSS
    const ano = dtPosted?.slice(0, 4);
    const mes = dtPosted?.slice(4, 6);
    const dia = dtPosted?.slice(6, 8);

    const valorBruto = parseFloat(campo('TRNAMT')) || 0;
    const memo = campo('MEMO') || campo('NAME') || 'Transação importada';
    const fitId = campo('FITID');

    return {
      externalId: fitId || null,
      data: dia && mes && ano ? `${dia}/${mes}/${ano}` : null,
      descricao: memo,
      valor: Math.abs(valorBruto),
      tipo: valorBruto < 0 ? 'despesa' : 'receita'
    };
  }).filter((t) => t.data); // descarta qualquer bloco sem data válida
}

// ── CSV do extrato de conta do Nubank (Data,Valor,Identificador,Descrição)
// -- escolhido como o formato real de partida (é o único, dos bancos mais
// comuns, cujo export já traz um identificador único de verdade por linha;
// outros bancos variam bastante e ficam pra quando tiver um caso real em
// mãos, como o próprio roteiro desta fase já antecipa). ──────────────────
function parseCSVNubank(conteudo) {
  const linhas = conteudo.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (linhas.length === 0) return [];

  const cabecalho = linhas[0].toLowerCase();
  const temCabecalho = cabecalho.includes('data') && cabecalho.includes('valor');
  const linhasDados = temCabecalho ? linhas.slice(1) : linhas;

  return linhasDados.map((linha) => {
    const campos = linha.split(',').map((c) => c.trim());
    const [data, valorStr, identificador, ...descricaoPartes] = campos;
    const valor = parseFloat((valorStr || '0').replace(',', '.')) || 0;

    return {
      externalId: identificador || null,
      data: data && data.includes('-') ? data.split('-').reverse().join('/') : data, // YYYY-MM-DD -> DD/MM/YYYY, se vier assim
      descricao: descricaoPartes.join(',') || 'Transação importada',
      valor: Math.abs(valor),
      tipo: valor < 0 ? 'despesa' : 'receita'
    };
  }).filter((t) => t.data);
}

// Fallback determinístico pra quando a origem (banco/formato) não traz um
// identificador único de verdade na linha -- reimportar o mesmo extrato
// gera o mesmo hash, então a deduplicação por (user_id, external_id) ainda
// funciona. Trade-off aceito: duas transações reais e diferentes com
// mesma data+valor+descrição colidem e viram uma só na reimportação --
// cenário raro, mas real; documentado aqui de propósito.
function externalIdFallback(transacao) {
  const chave = `${transacao.data}|${transacao.valor}|${transacao.descricao}`;
  return crypto.createHash('sha256').update(chave).digest('hex').slice(0, 40);
}

function parseArquivo(conteudo, formato) {
  let transacoes;
  if (formato === 'ofx') {
    transacoes = parseOFX(conteudo);
  } else if (formato === 'csv-nubank') {
    transacoes = parseCSVNubank(conteudo);
  } else {
    throw new Error(`Formato de importação não suportado: ${formato}`);
  }

  return transacoes.map((t) => ({
    ...t,
    externalId: t.externalId || externalIdFallback(t),
    categoriaSugerida: inferirCategoria(t.descricao) || (t.tipo === 'receita' ? 'Renda' : 'Outros')
  }));
}

module.exports = { parseArquivo };
