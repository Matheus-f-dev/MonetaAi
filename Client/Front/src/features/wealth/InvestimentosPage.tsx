import { useMemo, useState, type FormEvent } from 'react';
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
import { Badge, Button, Card, Input, Modal, MoneyFigure, QueryState, Select, Skeleton } from '../../design-system';
import { useToast } from '../../presentation/hooks/useToast';
import { INVESTMENT_CATEGORIES } from '../../shared/categories';
import type { Investment, TipoAporte } from './api';
import { HORIZON_OPTIONS, projectPortfolio } from './investmentProjection';
import {
  useCreateInvestmentMutation,
  useCurrentUserId,
  useDeleteInvestmentMutation,
  useInvestmentsQuery,
  useUpdateInvestmentMutation
} from './queries';
import styles from './InvestimentosPage.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const CATEGORY_OPTIONS = INVESTMENT_CATEGORIES.map((c) => ({ value: c, label: c }));
const TIPO_APORTE_OPTIONS: Array<{ value: TipoAporte; label: string }> = [
  { value: 'mensal', label: 'Aportes mensais' },
  { value: 'unico', label: 'Aporte único' }
];

const emptyForm = {
  nome: '',
  categoria: INVESTMENT_CATEGORIES[0],
  tipoAporte: 'mensal' as TipoAporte,
  valorInicial: '',
  aporteMensal: '',
  taxaRetornoAnual: '',
  dataInicio: new Date().toISOString().slice(0, 10)
};

function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function buildChartData(investments: Investment[], horizonMonths: number) {
  const { months, aportado, projetado } = projectPortfolio(investments, horizonMonths);
  const today = new Date();
  const labels = months.map((m) => {
    const d = new Date(today.getFullYear(), today.getMonth() + m, 1);
    return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  });

  const brand = readToken('--color-brand') || '#2f6f4e';
  const brandSoft = readToken('--color-brand-soft') || 'rgba(47, 111, 78, 0.14)';
  const muted = readToken('--color-ink-muted') || '#8a8276';
  const mutedSoft = readToken('--color-bg-sunken') || 'rgba(138, 130, 118, 0.12)';

  return {
    labels,
    datasets: [
      {
        label: 'Total investido (aportes)',
        data: aportado,
        borderColor: muted,
        backgroundColor: mutedSoft,
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderDash: [4, 4]
      },
      {
        label: 'Valor projetado',
        data: projetado,
        borderColor: brand,
        backgroundColor: brandSoft,
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4
      }
    ]
  };
}

function buildChartOptions(): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { boxWidth: 12, boxHeight: 12, color: readToken('--color-ink-muted') || undefined }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatMoney(Number(ctx.parsed.y))}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => `R$ ${v}` },
        grid: { color: readToken('--color-line') || 'rgba(107, 100, 89, 0.12)' }
      },
      x: { grid: { display: false } }
    }
  };
}

export default function InvestimentosPage() {
  const userId = useCurrentUserId();
  const { addToast } = useToast();

  const investmentsQuery = useInvestmentsQuery(userId);
  const createMutation = useCreateInvestmentMutation();
  const updateMutation = useUpdateInvestmentMutation();
  const deleteMutation = useDeleteInvestmentMutation();

  const investments = investmentsQuery.data ?? [];

  const [horizon, setHorizon] = useState(HORIZON_OPTIONS[2].value);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [form, setForm] = useState(emptyForm);

  const chartData = useMemo(() => buildChartData(investments, horizon), [investments, horizon]);
  const chartOptions = useMemo(() => buildChartOptions(), []);

  const aporteMensalTotal = useMemo(
    () => investments.filter((inv) => inv.tipoAporte === 'mensal').reduce((acc, inv) => acc + inv.aporteMensal, 0),
    [investments]
  );

  const projectedFinal = chartData.datasets[1]?.data.at(-1) ?? 0;
  const contributedFinal = chartData.datasets[0]?.data.at(-1) ?? 0;

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(investment: Investment) {
    setEditing(investment);
    setForm({
      nome: investment.nome,
      categoria: investment.categoria,
      tipoAporte: investment.tipoAporte,
      valorInicial: String(investment.valorInicial),
      aporteMensal: String(investment.aporteMensal),
      taxaRetornoAnual: String(investment.taxaRetornoAnual),
      dataInicio: investment.dataInicio.slice(0, 10)
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.categoria) {
      addToast('Dê um nome e uma categoria pro investimento', 'error');
      return;
    }
    const input = {
      nome: form.nome,
      categoria: form.categoria,
      tipoAporte: form.tipoAporte,
      valorInicial: parseFloat(form.valorInicial) || 0,
      aporteMensal: parseFloat(form.aporteMensal) || 0,
      taxaRetornoAnual: parseFloat(form.taxaRetornoAnual) || 0,
      dataInicio: form.dataInicio
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
        addToast('Investimento atualizado com sucesso!', 'success');
      } else {
        await createMutation.mutateAsync(input);
        addToast('Investimento criado com sucesso!', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao salvar investimento', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remover este investimento?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Investimento removido com sucesso', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao remover investimento', 'error');
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Investimentos</h1>
          <p className={styles.subtitle}>Acompanhe aportes, taxa de retorno e a projeção futura da carteira</p>
        </div>
        <Button onClick={openNew}>+ Novo investimento</Button>
      </div>

      {aporteMensalTotal > 0 && (
        <p className={styles.summaryLine}>
          Aportando <MoneyFigure value={aporteMensalTotal} sign="neutral" size="sm" /> por mês no total
        </p>
      )}

      <Card>
        <div className={styles.chartHeader}>
          <div>
            <p className={styles.chartTitle}>Projeção da carteira</p>
            <p className={styles.chartSubtitle}>Juros compostos a partir da taxa de retorno anual de cada investimento</p>
          </div>
          <div className={styles.tabs} role="tablist" aria-label="Horizonte da projeção">
            {HORIZON_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={horizon === opt.value}
                className={[styles.tab, horizon === opt.value && styles.tabActive].filter(Boolean).join(' ')}
                onClick={() => setHorizon(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <QueryState
          isLoading={investmentsQuery.isLoading}
          isError={investmentsQuery.isError}
          isEmpty={!investmentsQuery.isLoading && !investmentsQuery.isError && investments.length === 0}
          onRetry={investmentsQuery.refetch}
          skeleton={<Skeleton height="260px" />}
          emptyTitle="Nenhum investimento cadastrado"
          emptyDescription="Adicione um investimento pra ver a projeção de crescimento da carteira aqui."
        >
          <div className={styles.chartWrap}>
            <Line data={chartData} options={chartOptions} />
          </div>
          <div className={styles.chartFooter}>
            <span>
              Investido até o fim do período: <MoneyFigure value={contributedFinal} sign="neutral" size="sm" />
            </span>
            <span>
              Projetado com rendimento: <MoneyFigure value={projectedFinal} sign="neutral" size="sm" />
            </span>
          </div>
        </QueryState>
      </Card>

      {investments.length > 0 && (
        <div className={styles.grid}>
          {investments.map((investment) => (
            <Card key={investment.id} perforated>
              <div className={styles.cardTop}>
                <span className={styles.nome}>{investment.nome}</span>
                <Badge tone="brand">{investment.categoria}</Badge>
              </div>
              <div className={styles.meta}>
                {investment.tipoAporte === 'mensal' ? 'Aportes mensais' : 'Aporte único'}
                {' · '}
                desde {new Date(investment.dataInicio).toLocaleDateString('pt-BR')}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.row}>
                  <span>Valor inicial</span>
                  <MoneyFigure value={investment.valorInicial} sign="neutral" size="sm" />
                </div>
                {investment.tipoAporte === 'mensal' && (
                  <div className={styles.row}>
                    <span>Aporte mensal</span>
                    <MoneyFigure value={investment.aporteMensal} sign="neutral" size="sm" />
                  </div>
                )}
                <div className={styles.row}>
                  <span>Retorno esperado</span>
                  <span className={styles.percent}>{investment.taxaRetornoAnual.toFixed(2)}% a.a.</span>
                </div>
              </div>
              <div className={styles.cardActions}>
                <Button size="sm" variant="ghost" onClick={() => openEdit(investment)}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(investment.id)}>
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar investimento' : 'Novo investimento'}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Nome"
            placeholder="Ex: Tesouro Selic, Fundo imobiliário..."
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
          />
          <Select
            label="Categoria"
            options={CATEGORY_OPTIONS}
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          />
          <Select
            label="Tipo de aporte"
            options={TIPO_APORTE_OPTIONS}
            value={form.tipoAporte}
            onChange={(e) => setForm({ ...form, tipoAporte: e.target.value as TipoAporte })}
          />
          <Input
            label="Valor inicial (R$)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={form.valorInicial}
            onChange={(e) => setForm({ ...form, valorInicial: e.target.value })}
          />
          {form.tipoAporte === 'mensal' && (
            <Input
              label="Aporte mensal (R$)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={form.aporteMensal}
              onChange={(e) => setForm({ ...form, aporteMensal: e.target.value })}
            />
          )}
          <Input
            label="Taxa de retorno anual esperada (%)"
            type="number"
            step="0.01"
            placeholder="Ex: 10"
            value={form.taxaRetornoAnual}
            onChange={(e) => setForm({ ...form, taxaRetornoAnual: e.target.value })}
            required
          />
          <Input
            label="Data de início"
            type="date"
            value={form.dataInicio}
            onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
            required
          />
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : editing ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
