export type ExportFormat = 'csv' | 'pdf';
export type ExportPeriodo = 'mes' | 'ano' | 'tudo';

// GET /api/relatorios/:userId/export -- devolve o arquivo direto (CSV ou
// PDF), não um JSON, então não passa por ApiConnection (que sempre chama
// response.json()). Baixa o blob e dispara o download via um <a> temporário
// -- mesmo truque que qualquer download client-side, precisa do fetch pra
// poder anexar o header Authorization (a rota exige token; um <a href> puro
// não manda header nenhum).
export async function exportReport(userId: string, formato: ExportFormat, periodo: ExportPeriodo): Promise<void> {
  const token = localStorage.getItem('token');
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const res = await fetch(`${baseURL}/api/relatorios/${userId}/export?formato=${formato}&periodo=${periodo}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!res.ok) {
    let message = 'Erro ao gerar relatório';
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      // resposta não era JSON (ex.: erro genérico do servidor) -- mensagem padrão fica
    }
    throw new Error(message);
  }

  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || `relatorio-moneta.${formato}`;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
