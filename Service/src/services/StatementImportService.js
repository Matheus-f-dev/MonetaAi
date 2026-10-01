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

// ── CSV genérico -- qualquer banco, não só Nubank (era hardcoded na ordem
// exata de colunas do export do Nubank: Data,Valor,Identificador,Descrição;
// qualquer outro banco com ordem/nome de coluna diferente simplesmente
// quebrava). Em vez de posição fixa, lê o CABEÇALHO e acha cada coluna pelo
// NOME (com sinônimos em pt/en, sem acento) -- funciona pro export de
// qualquer banco que venha com cabeçalho, seja qual for a ordem das
// colunas. ──────────────────────────────────────────────────────────────

// Separador vira vírgula OU ponto e vírgula dependendo do banco (vários
// bancos BR exportam CSV com ";" -- Excel/pt-BR usa isso como padrão
// regional). Conta qual aparece mais na linha de cabeçalho.
function detectarDelimitador(linhaCabecalho) {
  const virgulas = (linhaCabecalho.match(/,/g) || []).length;
  const pontoEVirgulas = (linhaCabecalho.match(/;/g) || []).length;
  return pontoEVirgulas > virgulas ? ';' : ',';
}

// Split "de verdade" de uma linha CSV -- respeita campo entre aspas (pode
// conter o próprio delimitador dentro, ex. descrição "Mercado, Padaria") e
// "" como aspas escapada dentro do campo.
function dividirLinhaCSV(linha, delimitador) {
  const campos = [];
  let atual = '';
  let dentroAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      if (dentroAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroAspas = !dentroAspas;
      }
    } else if (c === delimitador && !dentroAspas) {
      campos.push(atual);
      atual = '';
    } else {
      atual += c;
    }
  }
  campos.push(atual);
  return campos.map((c) => c.trim());
}

function normalizarTexto(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acento (ç, ã, é...)
    .trim();
}

// `usadas` evita que duas colunas diferentes "roubem" o mesmo índice --
// achado testando com um cabeçalho real tipo "Data Lançamento;Histórico":
// sem essa exclusão, o candidato "lancamento" (sinônimo de descrição)
// batia em "data lancamento" (a coluna de DATA) antes mesmo de chegar em
// "historico", e a descrição saía errada (com a data dentro).
function acharColuna(cabecalhos, candidatos, usadas) {
  for (let i = 0; i < cabecalhos.length; i++) {
    if (usadas.has(i)) continue;
    if (candidatos.some((candidato) => cabecalhos[i].includes(candidato))) return i;
  }
  return -1;
}

// Aceita "1234.56", "1234,56" e "1.234,56" (milhar com ponto, decimal com
// vírgula -- padrão BR) -- sem isso, "1.234,56" virava 1.234 (cortado na
// vírgula) em vez de 1234,56.
function parseValorBR(valorStr) {
  if (!valorStr) return 0;
  let s = valorStr.replace(/[R$\s]/g, '');
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  return parseFloat(s) || 0;
}

// YYYY-MM-DD / YYYY/MM/DD -> DD/MM/YYYY (resto já costuma vir como
// DD/MM/YYYY ou DD-MM-YYYY, só troca "-" por "/").
function normalizarData(dataStr) {
  if (!dataStr) return null;
  const s = dataStr.trim();
  let m = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  m = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (m) return `${m[1]}/${m[2]}/${m[3]}`;
  return s;
}

function parseCSVGenerico(conteudo) {
  const linhas = conteudo.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (linhas.length === 0) return [];

  const delimitador = detectarDelimitador(linhas[0]);
  const cabecalhos = dividirLinhaCSV(linhas[0], delimitador).map(normalizarTexto);

  // Ordem importa: cada busca marca seu índice como usado antes da
  // próxima rodar, pra uma coluna não poder ser reivindicada duas vezes
  // (ver comentário em acharColuna).
  const usadas = new Set();
  const marcar = (idx) => {
    if (idx !== -1) usadas.add(idx);
    return idx;
  };

  const idxData = marcar(acharColuna(cabecalhos, ['data', 'date'], usadas));
  const idxValor = marcar(acharColuna(cabecalhos, ['valor', 'amount', 'montante'], usadas));
  const idxDebito = marcar(acharColuna(cabecalhos, ['debito', 'saida'], usadas));
  const idxCredito = marcar(acharColuna(cabecalhos, ['credito', 'entrada'], usadas));
  const idxDescricao = marcar(acharColuna(cabecalhos, ['descricao', 'historico', 'detalhe', 'lancamento', 'memo', 'nome'], usadas));
  const idxId = acharColuna(cabecalhos, ['identificador', 'fitid', 'documento', 'nsu'], usadas);

  // Cabeçalho reconhecível = achou pelo menos uma coluna de data e uma de
  // valor (seja "valor" único, seja débito/crédito separados). Sem isso,
  // assume a ordem clássica (compatibilidade com extratos sem cabeçalho
  // no formato antigo: data,valor,identificador,descrição).
  const temCabecalhoReconhecivel = idxData !== -1 && (idxValor !== -1 || idxDebito !== -1 || idxCredito !== -1);
  const linhasDados = temCabecalhoReconhecivel ? linhas.slice(1) : linhas;

  const col = temCabecalhoReconhecivel
    ? { data: idxData, valor: idxValor, debito: idxDebito, credito: idxCredito, descricao: idxDescricao, id: idxId }
    : { data: 0, valor: 1, debito: -1, credito: -1, descricao: 3, id: 2 };

  return linhasDados.map((linha) => {
    const campos = dividirLinhaCSV(linha, delimitador);

    let valor;
    if (col.valor !== -1) {
      valor = parseValorBR(campos[col.valor]);
    } else {
      const debito = col.debito !== -1 ? parseValorBR(campos[col.debito]) : 0;
      const credito = col.credito !== -1 ? parseValorBR(campos[col.credito]) : 0;
      valor = credito > 0 ? credito : -Math.abs(debito);
    }

    return {
      externalId: (col.id !== -1 ? campos[col.id] : null) || null,
      data: normalizarData(campos[col.data]),
      descricao: (col.descricao !== -1 ? campos[col.descricao] : null) || 'Transação importada',
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
  } else if (formato === 'csv' || formato === 'csv-nubank') {
    // 'csv-nubank' aceito só por compatibilidade com quem já tinha
    // integrado contra o nome antigo -- o parser por trás é o mesmo
    // genérico, não existe mais um caminho específico do Nubank.
    transacoes = parseCSVGenerico(conteudo);
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
