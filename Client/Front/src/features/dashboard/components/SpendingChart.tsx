import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, QueryState, Skeleton } from '../../../design-system';
import type { ChartData } from '../api';
import styles from './SpendingChart.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const PERIODS: Array<{ value: string; label: string }> = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' }
];

// Chart.js desenha em <canvas> -- o contexto 2D não resolve `var(--x)`
// como CSS resolveria num elemento de DOM normal, precisa do valor de
// cor de verdade. getComputedStyle lê o token já resolvido pro tema
// ativo no momento do render (claro/escuro).
function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Cores fixas por papel semântico (entrada/saída) -- o backend devolve
// cor no próprio dataset (pensado pra um consumidor sem design system
// próprio), mas aqui a gente sobrescreve pra bater com os tokens da
// direção "livro-razão" em vez do verde/vermelho genérico de fábrica.
function recolor(chartData: ChartData) {
  const positiveColor = readToken('--color-positive') || '#2f6f4e';
  const negativeColor = readToken('--color-negative') || '#a23b2e';
  const positiveSoft = readToken('--color-positive-soft') || 'rgba(47, 111, 78, 0.12)';
  const negativeSoft = readToken('--color-negative-soft') || 'rgba(162, 59, 46, 0.1)';

  return {
    labels: chartData.labels,
    datasets: chartData.datasets.map((d, i) => {
      const positive = i === 0;
      return {
        ...d,
        borderColor: positive ? positiveColor : negativeColor,
        backgroundColor: positive ? positiveSoft : negativeSoft,
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4
      };
    })
  };
}

// Função, não objeto de módulo -- precisa reler o token a cada render,
// igual ao recolor() abaixo. Um `const` de topo executaria readToken()
// uma vez só, na carga do módulo, e travaria a cor da grade no tema que
// estivesse ativo naquele instante (claro/escuro nunca mais trocaria).
function buildChartOptions(): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(ctx.parsed.y))}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => `R$ ${v}` },
        // Cor fixa antes -- não acompanhava tema nem o teto de contraste
        // validado da própria paleta. --color-line é o hairline estrutural
        // da direção "Ledger" (o mesmo papel que fecha os cards perforated).
        grid: { color: readToken('--color-line') || 'rgba(107, 100, 89, 0.12)' }
      },
      x: { grid: { display: false } }
    }
  };
}

export interface SpendingChartProps {
  data: ChartData | undefined;
  filter: string;
  onFilterChange: (filter: string) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function SpendingChart({ data, filter, onFilterChange, isLoading, isError, onRetry }: SpendingChartProps) {
  const isEmpty = !isLoading && !isError && (!data || data.labels.length === 0);

  return (
    <Card>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>Receitas x despesas</p>
          <p className={styles.subtitle}>Acumulado no período</p>
        </div>
        <div className={styles.tabs} role="tablist" aria-label="Período do gráfico">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="tab"
              aria-selected={filter === p.value}
              className={[styles.tab, filter === p.value && styles.tabActive].filter(Boolean).join(' ')}
              onClick={() => onFilterChange(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={onRetry}
        skeleton={<Skeleton height="260px" />}
        emptyTitle="Sem movimentação no período"
        emptyDescription="Registre um gasto ou receita — pelo site ou pelo WhatsApp — pra ver o gráfico ganhar forma."
      >
        <div className={styles.chartWrap}>{data && <Line data={recolor(data)} options={buildChartOptions()} />}</div>
      </QueryState>
    </Card>
  );
}
