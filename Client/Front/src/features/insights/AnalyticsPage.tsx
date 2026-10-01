import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions
} from 'chart.js';
import { useState, type ReactNode } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Badge, Card, MoneyFigure, Select } from '../../design-system';
import { useAnalytics } from '../../presentation/hooks/useAnalytics';
import { useEconomias } from '../../presentation/hooks/useEconomias';
import { useReceitas } from '../../presentation/hooks/useReceitas';
import { useTendencias } from '../../presentation/hooks/useTendencias';
import styles from './AnalyticsPage.module.css';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const PERIOD_OPTIONS = [
  { value: 'Este Mês', label: 'Este mês' },
  { value: 'Últimos 3 Meses', label: 'Últimos 3 meses' },
  { value: 'Este Ano', label: 'Este ano' }
];

const TABS = [
  { value: 'visao-geral', label: 'Visão geral' },
  { value: 'despesas', label: 'Despesas' },
  { value: 'receitas', label: 'Receitas' },
  { value: 'economias', label: 'Economias' },
  { value: 'tendencias', label: 'Tendências' }
] as const;

type Tab = (typeof TABS)[number]['value'];

// Paleta categórica fixa -- a tabela antiga só cobria ~7 das 20
// categorias do app (o resto caía tudo em cinza). Ciclar por índice
// cobre qualquer categoria, incluindo as que o usuário só descobre com
// o tempo. Começa nas duas cores de marca (emerald/cobre, alinhadas com
// tokens.css -- era violeta na primeira posição, a fatia mais provável
// de ser a maior e a que mais chama atenção) e completa com tons que
// não competem com elas.
const PALETTE = ['#0a5741', '#8f4e12', '#3b82f6', '#a8322b', '#0e8a67', '#06b6d4', '#c2761f', '#84cc16', '#8a5b14', '#6b7470'];

function categoryColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

function brl(v: number): string {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function useCurrentUserId(): string | null {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.uid ?? null;
  } catch {
    return null;
  }
}

const pieOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.label}: ${brl(Number(ctx.parsed))}`
      }
    }
  }
};

function barOptions(currency = true): ChartOptions<'bar'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => (currency ? `${brl(Number(ctx.parsed.y))}` : `${ctx.parsed.y}`)
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: currency ? { callback: (v) => `R$ ${v}` } : undefined,
        grid: { color: 'rgba(107, 100, 89, 0.12)' }
      },
      x: { grid: { display: false } }
    }
  };
}

/**
 * Fase 6 -- reconstrução de /analytics dentro do AppShell. Os 5 campos
 * extras (visão geral, despesas, receitas, economias, tendências) e os
 * 4 hooks que já calculam tudo isso (useAnalytics/useReceitas/
 * useEconomias/useTendencias) continuam os mesmos -- não recalcula
 * nada, só troca o SVG desenhado à mão (com tooltip via DOM manual) por
 * Chart.js, que o resto do app já usa (Fase 2), e o layout pelo design
 * system.
 */
export default function AnalyticsPage() {
  const userId = useCurrentUserId();
  const [period, setPeriod] = useState('Este Mês');
  const [tab, setTab] = useState<Tab>('visao-geral');

  // Hooks JS puros (useAnalytics etc.) -- TS infere o retorno a partir do
  // valor inicial do useState, que é sempre mais estreito que a forma real
  // depois de populado (ex.: `expensesTabData` nem existe no estado
  // inicial). `as any` só nesta borda, sem mudar nada do hook em si --
  // mesmo raciocínio das fases anteriores ao reaproveitar hook JS existente.
  const { totals, categoryData, evolutionData, topCategory, expensesTabData } = useAnalytics(period, userId || '') as any;
  const { totalReceitas, receitaMediaDiaria, maiorFonte, categoryData: receitasCategoryData, evolutionData: receitasEvolutionData } =
    useReceitas(period, userId || '') as any;
  const { totalEconomias, taxaEconomia, metaEconomia, progressoMeta, categoriasEconomia, evolutionData: economiasEvolutionData, status: statusEconomia } =
    useEconomias(period, userId || '') as any;
  const { dadosMensais, tendencias, previsaoProximoMes, categoriasEmAlta, insights } = useTendencias(period, userId || '') as any;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Análises</h1>
          <p className={styles.subtitle}>Visão geral, despesas, receitas, economias e tendências</p>
        </div>
        <div className={styles.periodField}>
          <Select label="Período" options={PERIOD_OPTIONS} value={period} onChange={(e) => setPeriod(e.target.value)} />
        </div>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Seção de análise">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            className={[styles.tab, tab === t.value && styles.tabActive].filter(Boolean).join(' ')}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'visao-geral' && (
        <>
          <div className={styles.kpiGrid}>
            <KpiCard label="Total de despesas" value={<MoneyFigure value={totals.expenses} sign="negative" size="lg" />} />
            <KpiCard label="Total de receitas" value={<MoneyFigure value={totals.income} sign="positive" size="lg" />} />
            <KpiCard label="Economia" value={<MoneyFigure value={totals.savings} sign="auto" size="lg" />} />
            <KpiCard label="Maior categoria" value={topCategory.name} sublabel={`${topCategory.percentage}% dos seus gastos`} />
          </div>
          <div className={styles.chartGrid}>
            <PieCategoryCard title="Gastos por categoria" subtitle={period} data={categoryData} />
            <Card>
              <ChartHeader title="Evolução de gastos" subtitle={period} />
              <div className={styles.chartWrap}>
                <Bar
                  data={{ labels: evolutionData.map((d: any) => d.month), datasets: [{ data: evolutionData.map((d: any) => d.value), backgroundColor: '#0a5741', borderRadius: 4 }] }}
                  options={barOptions()}
                />
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'despesas' && (
        <>
          <div className={styles.kpiGrid}>
            <KpiCard label="Maior categoria" value={expensesTabData.topCategory.name} sublabel={`${brl(expensesTabData.topCategory.total || 0)} no período`} />
            <KpiCard
              label="Maior crescimento"
              value={expensesTabData.fastestGrowingCategory.name}
              sublabel={
                expensesTabData.fastestGrowingCategory.growth !== 0
                  ? `${expensesTabData.fastestGrowingCategory.growth > 0 ? '+' : ''}${expensesTabData.fastestGrowingCategory.growth}% vs. período anterior`
                  : 'Dados insuficientes para comparação'
              }
            />
            <KpiCard label="Gasto médio diário" value={<MoneyFigure value={expensesTabData.dailyAverage} sign="negative" size="lg" />} />
          </div>
          <div className={styles.chartGrid}>
            <PieCategoryCard title="Despesas por categoria" subtitle={period} data={categoryData} />
            <Card>
              <ChartHeader title="Evolução de despesas" subtitle={period} />
              <div className={styles.chartWrap}>
                <Bar
                  data={{ labels: evolutionData.map((d: any) => d.month), datasets: [{ data: evolutionData.map((d: any) => d.value), backgroundColor: '#a8322b', borderRadius: 4 }] }}
                  options={barOptions()}
                />
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'receitas' && (
        <>
          <div className={styles.kpiGrid}>
            <KpiCard label="Total de receitas" value={<MoneyFigure value={totalReceitas} sign="positive" size="lg" />} />
            <KpiCard label="Maior fonte" value={maiorFonte.name} sublabel={`${brl(maiorFonte.total)} (${maiorFonte.percentage}%)`} />
            <KpiCard label="Receita média diária" value={<MoneyFigure value={receitaMediaDiaria} sign="positive" size="lg" />} />
          </div>
          <div className={styles.chartGrid}>
            <PieCategoryCard title="Receitas por categoria" subtitle={period} data={receitasCategoryData} />
            <Card>
              <ChartHeader title="Evolução de receitas" subtitle={period} />
              <div className={styles.chartWrap}>
                <Bar
                  data={{
                    labels: receitasEvolutionData.map((d: any) => d.month),
                    datasets: [{ data: receitasEvolutionData.map((d: any) => d.value), backgroundColor: '#0a6b3d', borderRadius: 4 }]
                  }}
                  options={barOptions()}
                />
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'economias' && (
        <>
          <div className={styles.kpiGrid}>
            <KpiCard
              label="Total economizado"
              value={<MoneyFigure value={totalEconomias} sign="auto" size="lg" />}
              sublabel={totalEconomias >= 0 ? 'Economia positiva' : 'Déficit no período'}
            />
            <KpiCard label="Taxa de economia" value={`${taxaEconomia.toFixed(1)}%`} sublabel={`Status: ${statusEconomia.status}`} />
            <KpiCard label="Meta de economia (30%)" value={<MoneyFigure value={metaEconomia} sign="neutral" size="lg" />} sublabel={`Progresso: ${progressoMeta.toFixed(1)}%`} />
          </div>
          <div className={styles.chartGrid}>
            <Card>
              <ChartHeader title="Potencial de economia por categoria" subtitle="Onde você pode economizar mais" />
              <div className={styles.savingsList}>
                {categoriasEconomia.length === 0 && <p className={styles.emptyHint}>Sem dados suficientes ainda.</p>}
                {categoriasEconomia.map((cat: any) => (
                  <div key={cat.name} className={styles.savingsRow}>
                    <div className={styles.savingsRowHeader}>
                      <span className={styles.savingsName}>{cat.name}</span>
                      <span className={styles.savingsPct}>{cat.percentualReceita}%</span>
                    </div>
                    <div className={styles.savingsTrack}>
                      <div className={styles.savingsFill} style={{ width: `${cat.percentualReceita}%`, background: cat.color }} />
                    </div>
                    <div className={styles.savingsMeta}>
                      Gasto atual {brl(cat.gastoAtual)} · potencial {brl(cat.potencialEconomia)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <ChartHeader title="Evolução das economias" subtitle={period} />
              <div className={styles.chartWrap}>
                <Bar
                  data={{
                    labels: economiasEvolutionData.map((d: any) => d.month),
                    datasets: [
                      {
                        data: economiasEvolutionData.map((d: any) => d.economia),
                        backgroundColor: economiasEvolutionData.map((d: any) => (d.economia >= 0 ? '#0a6b3d' : '#a8322b')),
                        borderRadius: 4
                      }
                    ]
                  }}
                  options={barOptions()}
                />
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'tendencias' && (
        <>
          <div className={styles.kpiGrid}>
            <TrendKpiCard label="Tendência de receitas" trend={tendencias.receitas} />
            <TrendKpiCard label="Tendência de despesas" trend={tendencias.despesas} />
            <TrendKpiCard label="Tendência de economias" trend={tendencias.economias} />
          </div>
          <div className={styles.chartGrid}>
            <Card>
              <ChartHeader title="Evolução mensal" subtitle="Receitas, despesas e economias" />
              <div className={styles.chartWrap}>
                <Bar
                  data={{
                    labels: dadosMensais.map((d: any) => d.month),
                    datasets: [
                      { label: 'Receitas', data: dadosMensais.map((d: any) => d.receitas), backgroundColor: '#0a6b3d', borderRadius: 4 },
                      { label: 'Despesas', data: dadosMensais.map((d: any) => d.despesas), backgroundColor: '#a8322b', borderRadius: 4 }
                    ]
                  }}
                  options={{ ...barOptions(), plugins: { ...barOptions().plugins, legend: { display: true, position: 'bottom' } } }}
                />
              </div>
            </Card>
            <Card>
              <ChartHeader title="Insights e previsões" subtitle="Análise preditiva baseada nos seus dados" />
              {previsaoProximoMes && (
                <div className={styles.prediction}>
                  <p className={styles.predictionTitle}>Previsão próximo mês</p>
                  <div className={styles.predictionGrid}>
                    <span>
                      Receitas <MoneyFigure value={previsaoProximoMes.receitas} sign="neutral" size="sm" />
                    </span>
                    <span>
                      Despesas <MoneyFigure value={previsaoProximoMes.despesas} sign="neutral" size="sm" />
                    </span>
                    <span>
                      Economia <MoneyFigure value={previsaoProximoMes.economia} sign="auto" size="sm" />
                    </span>
                  </div>
                </div>
              )}

              <p className={styles.predictionTitle}>Insights automáticos</p>
              {insights.length === 0 ? (
                <p className={styles.emptyHint}>Nenhum insight disponível no momento.</p>
              ) : (
                <div className={styles.insightsList}>
                  {insights.map((insight: any, i: number) => (
                    <div key={i} className={styles.insightItem}>
                      <p className={styles.insightTitle}>{insight.titulo}</p>
                      <p className={styles.insightDesc}>{insight.descricao}</p>
                    </div>
                  ))}
                </div>
              )}

              {categoriasEmAlta.length > 0 && (
                <>
                  <p className={styles.predictionTitle}>Categorias em alta</p>
                  <div className={styles.trendingList}>
                    {categoriasEmAlta.map((cat: any, i: number) => (
                      <div key={i} className={styles.trendingRow}>
                        <span>{cat.categoria}</span>
                        <Badge tone={cat.status === 'positivo' ? 'positive' : cat.status === 'negativo' ? 'negative' : 'neutral'}>
                          {cat.crescimento > 0 ? '+' : ''}
                          {cat.crescimento.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function ChartHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className={styles.chartHeader}>
      <p className={styles.chartTitle}>{title}</p>
      <p className={styles.chartSubtitle}>{subtitle}</p>
    </div>
  );
}

function KpiCard({ label, value, sublabel }: { label: string; value: ReactNode; sublabel?: string }) {
  return (
    <Card perforated>
      <p className={styles.kpiLabel}>{label}</p>
      <div className={styles.kpiValue}>{value}</div>
      {sublabel && <p className={styles.kpiSublabel}>{sublabel}</p>}
    </Card>
  );
}

function TrendKpiCard({ label, trend }: { label: string; trend: { direcao: string; percentual: number; status: string } }) {
  const tone = trend.status === 'positivo' ? 'positive' : trend.status === 'negativo' ? 'negative' : 'neutral';
  return (
    <Card perforated>
      <p className={styles.kpiLabel}>{label}</p>
      <div className={[styles.kpiValue, styles[`tone-${tone}`]].join(' ')}>{trend.direcao}</div>
      <p className={styles.kpiSublabel}>{trend.percentual.toFixed(1)}% ao mês</p>
    </Card>
  );
}

interface CategorySlice {
  name: string;
  total: number;
  percentage: number;
}

function PieCategoryCard({ title, subtitle, data }: { title: string; subtitle: string; data: CategorySlice[] }) {
  const hasData = data.length > 0 && data.some((d) => d.total > 0);
  return (
    <Card>
      <ChartHeader title={title} subtitle={subtitle} />
      {!hasData ? (
        <p className={styles.emptyHint}>Sem gastos registrados no período.</p>
      ) : (
        <div className={styles.pieRow}>
          <div className={styles.pieWrap}>
            <Pie
              data={{
                labels: data.map((d) => d.name),
                datasets: [{ data: data.map((d) => d.total), backgroundColor: data.map((_, i) => categoryColor(i)) }]
              }}
              options={pieOptions}
            />
          </div>
          <div className={styles.legend}>
            {data.map((d, i) => (
              <div key={d.name} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: categoryColor(i) }} />
                <span className={styles.legendLabel}>{d.name}</span>
                <span className={styles.legendPct}>{d.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
