import { CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip, type ChartOptions } from 'chart.js';
import { useState, type FormEvent } from 'react';
import { Line } from 'react-chartjs-2';
import { Badge, Button, Card, Input } from '../../design-system';
import { useImpactoFinanceiro } from '../../presentation/hooks/useImpactoFinanceiro';
import styles from './ImpactoFinanceiroPage.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const RECOMMENDATION_TONE: Record<string, 'negative' | 'warning' | 'positive' | 'neutral'> = {
  alerta: 'negative',
  cuidado: 'warning',
  atencao: 'warning',
  positivo: 'positive'
};

function brl(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'top' },
    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${brl(Number(ctx.parsed.y))}` } }
  },
  interaction: { mode: 'index', intersect: false },
  scales: {
    y: { beginAtZero: true, ticks: { callback: (v) => `R$ ${v}` }, grid: { color: 'rgba(107, 100, 89, 0.12)' } },
    x: { grid: { display: false } }
  }
};

/**
 * Fase 6 -- reconstrução de /impacto-financeiro dentro do AppShell.
 * useImpactoFinanceiro segue igual (chama o backend, que já faz toda a
 * análise); só o formulário, o resultado e o gráfico de projeção
 * (antes ProjecaoEconomiaChart.jsx, imperative Chart.js) trocam de
 * roupa pro design system + react-chartjs-2 declarativo.
 */
export default function ImpactoFinanceiroPage() {
  // as any: hook JS puro, mesmo raciocínio do AnalyticsPage.
  const { loading, analise, error, calcularImpacto, limparAnalise } = useImpactoFinanceiro() as any;
  const [produto, setProduto] = useState('');
  const [valor, setValor] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!produto.trim() || !valor.trim()) return;
    const valorNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) return;
    calcularImpacto(produto.trim(), valorNum);
  }

  function handleNovaAnalise() {
    limparAnalise();
    setProduto('');
    setValor('');
  }

  const projecao = analise ? buildProjecao(analise) : null;

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Impacto financeiro</h1>
        <p className={styles.subtitle}>Descubra o impacto de uma compra no seu orçamento</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input label="Produto/Serviço" placeholder="Ex: iPhone 15, Viagem para Europa..." value={produto} onChange={(e) => setProduto(e.target.value)} disabled={loading} />
          <Input label="Valor (R$)" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} disabled={loading} />
          <div className={styles.formActions}>
            <Button type="submit" disabled={loading || !produto.trim() || !valor.trim()}>
              {loading ? 'Analisando...' : 'Analisar impacto'}
            </Button>
            {analise && (
              <Button type="button" variant="secondary" onClick={handleNovaAnalise}>
                Nova análise
              </Button>
            )}
          </div>
        </form>
        {error && <p className={styles.error}>{error}</p>}
      </Card>

      {analise && (
        <>
          <Card>
            <div className={styles.resultHeader}>
              <h2 className={styles.resultTitle}>Análise: {analise.produto}</h2>
              <span className={styles.resultValue}>{brl(analise.valor)}</span>
            </div>

            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricIcon}>📅</span>
                <p className={styles.metricLabel}>Tempo necessário</p>
                <p className={styles.metricValue}>{analise.analise.tempoParaJuntar || 0}</p>
                <p className={styles.metricSub}>mês para economizar</p>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricIcon}>📈</span>
                <p className={styles.metricLabel}>Impacto no orçamento</p>
                <p className={styles.metricValue}>{Math.round((analise.valor / analise.analise.receitaMedia) * 100)}%</p>
                <p className={styles.metricSub}>da sua renda mensal</p>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricIcon}>ℹ️</span>
                <p className={styles.metricLabel}>Parcelas sugeridas</p>
                <p className={styles.metricValue}>{Math.ceil(analise.valor / analise.analise.economiaMedia)}x</p>
                <p className={styles.metricSub}>de {brl(Math.ceil(analise.valor / Math.ceil(analise.valor / analise.analise.economiaMedia)))}</p>
              </div>
            </div>

            <p className={styles.recTitle}>Recomendações</p>
            <div className={styles.recList}>
              {analise.recomendacoes.map((rec: { tipo: string; mensagem: string }, i: number) => (
                <div key={i} className={styles.recItem}>
                  <Badge tone={RECOMMENDATION_TONE[rec.tipo] ?? 'neutral'}>{rec.mensagem}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {projecao && (
            <Card>
              <p className={styles.chartTitle}>Projeção de economia</p>
              <div className={styles.chartWrap}>
                <Line data={projecao} options={chartOptions} />
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// Mesmo cálculo de src/presentation/components/ProjecaoEconomiaChart.jsx
// (a versão imperativa que esta página substitui) -- meses até a meta
// (limitado a 24), acumulando a economia média mês a mês contra uma
// linha reta de meta.
function buildProjecao(analise: { valor: number; analise: { tempoParaJuntar?: number; economiaMedia?: number } }) {
  const meses = Math.min(analise.analise.tempoParaJuntar || 12, 24);
  const economiaMedia = analise.analise.economiaMedia || 0;
  const valorMeta = analise.valor;

  const labels: string[] = [];
  const dados: number[] = [];
  let acumulado = 0;

  for (let i = 0; i <= meses; i++) {
    labels.push(i === 0 ? 'Hoje' : `${i}º mês`);
    dados.push(acumulado);
    if (i < meses) acumulado += economiaMedia;
  }

  return {
    labels,
    datasets: [
      {
        label: 'Economia acumulada',
        data: dados,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.12)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3
      },
      {
        label: 'Meta',
        data: new Array(labels.length).fill(valorMeta),
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0
      }
    ]
  };
}
