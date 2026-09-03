const PDFDocument = require('pdfkit');

function formatarMoeda(valor) {
  return `R$ ${(parseFloat(valor) || 0).toFixed(2).replace('.', ',')}`;
}

// Sem dependência nova pra CSV -- é só texto delimitado por vírgula, com
// aspas escapadas onde precisar (descrição pode ter vírgula/aspas de verdade).
function escaparCampoCsv(valor) {
  const texto = String(valor ?? '');
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

function gerarCSV(transactions) {
  const cabecalho = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
  const linhas = transactions.map((t) => [
    t.dataHora || '',
    t.descricao || '',
    t.categoria || 'Outros',
    t.tipo || '',
    (Math.abs(t.valor) || 0).toFixed(2).replace('.', ',')
  ].map(escaparCampoCsv).join(','));

  return [cabecalho.join(','), ...linhas].join('\n');
}

// Retorna um Buffer com o PDF pronto -- pdfkit é um stream, então
// precisamos coletar os chunks e resolver a Promise só quando terminar.
function gerarPDF(transactions, resumo, periodo) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('Relatório Financeiro - Moneta', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#555').text(`Período: ${periodo}`, { align: 'center' });
    doc.moveDown(1.5);

    doc.fillColor('#000').fontSize(12).text('Resumo', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);
    doc.text(`Receitas: ${formatarMoeda(resumo.receitas)}`);
    doc.text(`Despesas: ${formatarMoeda(resumo.despesas)}`);
    doc.text(`Saldo: ${formatarMoeda(resumo.saldo)}`);
    doc.moveDown(1);

    doc.fontSize(12).text('Transações', { underline: true });
    doc.moveDown(0.5);

    const colX = { data: 40, descricao: 120, categoria: 300, tipo: 400, valor: 470 };
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Data', colX.data, doc.y, { continued: false });
    doc.text('Descrição', colX.descricao, doc.y - doc.currentLineHeight());
    doc.text('Categoria', colX.categoria, doc.y - doc.currentLineHeight());
    doc.text('Tipo', colX.tipo, doc.y - doc.currentLineHeight());
    doc.text('Valor', colX.valor, doc.y - doc.currentLineHeight());
    doc.moveDown(0.5);
    doc.font('Helvetica');

    transactions.forEach((t) => {
      if (doc.y > 750) doc.addPage();
      const y = doc.y;
      doc.text(t.dataHora?.split(',')[0] || '', colX.data, y, { width: 75 });
      doc.text((t.descricao || '').slice(0, 30), colX.descricao, y, { width: 175 });
      doc.text(t.categoria || 'Outros', colX.categoria, y, { width: 95 });
      doc.text(t.tipo || '', colX.tipo, y, { width: 65 });
      doc.text(formatarMoeda(Math.abs(t.valor)), colX.valor, y, { width: 90 });
      doc.moveDown(0.8);
    });

    doc.end();
  });
}

module.exports = { gerarCSV, gerarPDF };
