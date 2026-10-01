import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip, type ChartOptions } from 'chart.js';
import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Badge, Button, Card, MoneyFigure, Select } from '../../design-system';
import { useToast } from '../../presentation/hooks/useToast';
import { useReports } from '../../presentation/hooks/useReports';
import { exportReport, type ExportFormat, type ExportPeriodo } from './api';
import styles from './ReportsPage.module.css';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PERIOD_OPTIONS = [
  { value: 'Este Mês', label: 'Este mês' },
  { value: 'Últimos 3 Meses', label: 'Últimos 3 meses' },
  { value: 'Este Ano', label: 'Este ano' }
];

// A tela usa dois vocabulários de período que já existiam separados: os
// hooks de tela (useReports/useAnalytics, "Este Mês"/"Este Ano"...) e a
// rota de exportação (mes/ano/tudo). Mapeado aqui em vez de unificar os
// dois -- exportação não tem "Últimos 3 Meses" no backend, cai pra "mês".
const EXPORT_PERIODO: Record<string, ExportPeriodo> = { 'Este Mês': 'mes', 'Últimos 3 Meses': 'mes', 'Este Ano': 'ano' };

const TABS = [
  { value: 'resumo', label: 'Resumo' },
  { value: 'receitas-despesas', label: 'Receitas e despesas' },
  { value: 'categorias', label: 'Categorias' }
] as const;

type Tab = (typeof TABS)[number]['value'];

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

const barOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom' },
    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${brl(Number(ctx.parsed.y))}` } }
  },
  scales: {
    y: { beginAtZero: true, ticks: { callback: (v) => `R$ ${v}` }, grid: { color: 'rgba(107, 100, 89, 0.12)' } },
    x: { grid: { display: false } }
  }
};

/**
 * Fase 6 -- reconstrução de /reports dentro do AppShell. useReports
 * continua calculando tudo (mesmo motivo do AnalyticsPage -- não
 * recalcula nada que já funciona). Novo nesta fase: exportação CSV/PDF
 * de verdade (FRONTEND_TODO.md item 3, backend já pronto, nunca teve
 * UI) ao lado da exportação Excel client-side que já existia.
 */
export default function ReportsPage() {
  const userId = useCurrentUserId();
  const { addToast } = useToast();
  const [period, setPeriod] = useState('Este Mês');
  const [tab, setTab] = useState<Tab>('resumo');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exporting, setExporting] = useState(false);

  // as any: hook JS puro, mesmo raciocínio do AnalyticsPage.
  const { filteredTransactions, chartData, totals, getCategoriesData } = useReports(userId || '', period) as any;
  const { income, expenses, balance } = totals;
  const categories = getCategoriesData();

  async function handleExport() {
    if (!userId) return;
    setExporting(true);
    try {
      await exportReport(userId, exportFormat, EXPORT_PERIODO[period] ?? 'mes');
      addToast(`Relatório ${exportFormat.toUpperCase()} baixado com sucesso!`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao gerar relatório', 'error');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportExcel() {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    const resumoData = [
      ['RELATÓRIO FINANCEIRO - ' + period.toUpperCase()],
      [''],
      ['RESUMO GERAL'],
      ['Total de Receitas', 'R$ ' + income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      ['Total de Despesas', 'R$ ' + expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      ['Balanço', 'R$ ' + balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumoData), 'Resumo');

    const transacoesData = [['DATA', 'DESCRIÇÃO', 'CATEGORIA', 'TIPO', 'VALOR']];
    (filteredTransactions || []).forEach((t: any) => {
      transacoesData.push([
        t.dataHora || t.data || t.criadoEm,
        t.descricao || '',
        t.categoria || 'Outros',
        t.tipo || '',
        'R$ ' + Math.abs(t.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(transacoesData), 'Transações');

    const categoriasData = [['CATEGORIA', 'TIPO', 'VALOR TOTAL', 'PERCENTUAL']];
    categories.forEach((cat: any) => {
      categoriasData.push([cat.name, cat.type === 'positive' ? 'Receita' : 'Despesa', 'R$ ' + cat.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), cat.percentage + '%']);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(categoriasData), 'Categorias');

    if (chartData) {
      const evolucaoData = [['MÊS', 'RECEITAS', 'DESPESAS', 'SALDO']];
      chartData.labels.forEach((label: string, index: number) => {
        evolucaoData.push([
          label,
          'R$ ' + (chartData.receitas[index] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          'R$ ' + (chartData.despesas[index] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          'R$ ' + (chartData.saldo[index] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        ]);
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(evolucaoData), 'Evolução');
    }

    const now = new Date();
    const fileName = `relatorio-financeiro-${period.toLowerCase().replace(' ', '-')}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Relatórios</h1>
          <p className={styles.subtitle}>Resumo, receitas e despesas, e detalhamento por categoria</p>
        </div>
        <div className={styles.periodField}>
          <Select label="Período" options={PERIOD_OPTIONS} value={period} onChange={(e) => setPeriod(e.target.value)} />
        </div>
      </div>

      <Card padding="sm">
        <div className={styles.exportRow}>
          <span className={styles.exportLabel}>Exportar relatório:</span>
          <div className={styles.exportFormatField}>
            <Select
              label="Formato"
              options={[
                { value: 'csv', label: 'CSV' },
                { value: 'pdf', label: 'PDF' }
              ]}
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            />
          </div>
          <Button variant="secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Gerando...' : '📥 Exportar'}
          </Button>
          <Button variant="ghost" onClick={handleExportExcel}>
            📊 Exportar Excel
          </Button>
        </div>
      </Card>

      <div className={styles.kpiGrid}>
        <Card perforated>
          <p className={styles.kpiLabel}>Total de receitas</p>
          <MoneyFigure value={income} sign="positive" size="lg" />
        </Card>
        <Card perforated>
          <p className={styles.kpiLabel}>Total de despesas</p>
          <MoneyFigure value={expenses} sign="negative" size="lg" />
        </Card>
        <Card perforated>
          <p className={styles.kpiLabel}>Balanço</p>
          <MoneyFigure value={balance} sign="auto" size="lg" />
        </Card>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Seção do relatório">
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

      {tab === 'resumo' && (
        <Card>
          <p className={styles.chartTitle}>Evolução financeira</p>
          <p className={styles.chartSubtitle}>Comparativo de receitas, despesas e saldo — {period}</p>
          <div className={styles.chartWrap}>
            {chartData && (
              <Bar
                data={{
                  labels: chartData.labels,
                  datasets: [
                    { label: 'Receitas', data: chartData.receitas, backgroundColor: '#0a6b3d', borderRadius: 4 },
                    { label: 'Despesas', data: chartData.despesas, backgroundColor: '#a8322b', borderRadius: 4 },
                    { label: 'Saldo', data: chartData.saldo, backgroundColor: '#0a5741', borderRadius: 4 }
                  ]
                }}
                options={barOptions}
              />
            )}
          </div>
        </Card>
      )}

      {tab === 'receitas-despesas' && (
        <div className={styles.transGrid}>
          <Card>
            <p className={styles.chartTitle}>Receitas ({period})</p>
            <div className={styles.transList}>
              {(filteredTransactions || [])
                .filter((t: any) => t.tipo?.toLowerCase() === 'receita')
                .map((t: any, i: number) => (
                  <div key={i} className={styles.transItem}>
                    <div>
                      <p className={styles.transDesc}>{t.descricao}</p>
                      <p className={styles.transDate}>{t.dataHora || t.data}</p>
                    </div>
                    <MoneyFigure value={Math.abs(t.valor || 0)} sign="positive" size="sm" />
                  </div>
                ))}
            </div>
          </Card>
          <Card>
            <p className={styles.chartTitle}>Despesas ({period})</p>
            <div className={styles.transList}>
              {(filteredTransactions || [])
                .filter((t: any) => t.tipo?.toLowerCase() === 'despesa')
                .map((t: any, i: number) => (
                  <div key={i} className={styles.transItem}>
                    <div>
                      <p className={styles.transDesc}>{t.descricao}</p>
                      <p className={styles.transDate}>{t.dataHora || t.data}</p>
                    </div>
                    <MoneyFigure value={Math.abs(t.valor || 0)} sign="negative" size="sm" />
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'categorias' && (
        <div className={styles.categoriesGrid}>
          {categories.map((cat: any, i: number) => (
            <Card key={i} padding="sm">
              <div className={styles.categoryRow}>
                <span className={styles.categoryName}>{cat.name}</span>
                <Badge tone={cat.type === 'positive' ? 'positive' : 'negative'}>{brl(cat.total)}</Badge>
              </div>
              <p className={styles.categoryPct}>{cat.percentage}% do total</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
