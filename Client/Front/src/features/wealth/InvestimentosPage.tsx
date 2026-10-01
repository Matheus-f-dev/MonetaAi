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
import type { Investment, TipoAporte, TipoAtivo } from './api';
import { HORIZON_OPTIONS, projectPortfolio } from './investmentProjection';
import {
  useCreateInvestmentMutation,
  useCurrentUserId,
  useDeleteInvestmentMutation,
  useInvestmentsQuery,
  useMarketQuoteQuery,
  useUpdateInvestmentMutation
} from './queries';
import styles from './InvestimentosPage.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const CATEGORY_OPTIONS = INVESTMENT_CATEGORIES.map((c) => ({ value: c, label: c }));
const TIPO_APORTE_OPTIONS: Array<{ value: TipoAporte; label: string }> = [
  { value: 'mensal', label: 'Aportes mensais' },
  { value: 'unico', label: 'Aporte único' }
];

const TIPO_ATIVO_OPTIONS: Array<{ value: TipoAtivo; label: string }> = [
  { value: 'renda_fixa', label: 'Renda fixa' },
  { value: 'acao', label: 'Ação' },
  { value: 'fii', label: 'Fundo imobiliário (FII)' },
  { value: 'cripto', label: 'Criptomoeda' },
  { value: 'imovel', label: 'Imóvel' },
  { value: 'outro', label: 'Outro' }
];

const TIPO_ATIVO_LABEL: Record<TipoAtivo, string> = Object.fromEntries(
  TIPO_ATIVO_OPTIONS.map((o) => [o.value, o.label])
) as Record<TipoAtivo, string>;

// CoinGecko identifica a moeda pelo id interno, não pelo ticker (BTC) --
// lista curada das mais comuns pra não precisar resolver símbolo -> id
// na mão (ver MarketDataService.fetchCryptoPrice no backend).
const CRYPTO_OPTIONS = [
  { value: 'bitcoin', label: 'Bitcoin (BTC)' },
  { value: 'ethereum', label: 'Ethereum (ETH)' },
  { value: 'tether', label: 'Tether (USDT)' },
  { value: 'binancecoin', label: 'BNB' },
  { value: 'solana', label: 'Solana (SOL)' },
  { value: 'ripple', label: 'XRP' },
  { value: 'usd-coin', label: 'USD Coin (USDC)' },
  { value: 'cardano', label: 'Cardano (ADA)' },
  { value: 'dogecoin', label: 'Dogecoin (DOGE)' },
  { value: 'tron', label: 'TRON (TRX)' },
  { value: 'avalanche-2', label: 'Avalanche (AVAX)' },
  { value: 'chainlink', label: 'Chainlink (LINK)' },
  { value: 'polkadot', label: 'Polkadot (DOT)' },
  { value: 'litecoin', label: 'Litecoin (LTC)' },
  { value: 'shiba-inu', label: 'Shiba Inu (SHIB)' }
];

const FILTER_OPTIONS: Array<{ value: TipoAtivo | 'todos'; label: string }> = [
  { value: 'todos', label: 'Todos' },
  ...TIPO_ATIVO_OPTIONS
];

function isAtivoMercado(tipo: TipoAtivo): boolean {
  return tipo === 'acao' || tipo === 'fii' || tipo === 'cripto';
}

const emptyForm = {
  nome: '',
  categoria: INVESTMENT_CATEGORIES[0],
  tipoAtivo: 'renda_fixa' as TipoAtivo,
  ticker: '',
  quantidade: '',
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

interface InvestmentCardProps {
  investment: Investment;
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
}

// Ativo de mercado (ação/fii/cripto) ganha card próprio -- o valor não é
// digitado à mão, vem de quantidade × cotação ao vivo (useMarketQuoteQuery
// chama /api/market/quote, que por sua vez chama brapi.dev ou CoinGecko).
function InvestmentCard({ investment, onEdit, onDelete }: InvestmentCardProps) {
  const mercado = isAtivoMercado(investment.tipoAtivo);
  const quoteQuery = useMarketQuoteQuery(
    mercado ? (investment.tipoAtivo as 'acao' | 'fii' | 'cripto') : null,
    mercado ? investment.ticker : null
  );

  const quantidade = investment.quantidade ?? 0;
  const preco = quoteQuery.data?.preco ?? 0;
  const valorAtual = quantidade * preco;
  const variacao = quoteQuery.data?.variacaoPercentual ?? 0;

  return (
    <Card perforated>
      <div className={styles.cardTop}>
        <span className={styles.nome}>{investment.nome}</span>
        <Badge tone="brand">{investment.categoria}</Badge>
      </div>
      <div className={styles.meta}>
        {TIPO_ATIVO_LABEL[investment.tipoAtivo]}
        {investment.ticker && ` · ${investment.ticker.toUpperCase()}`}
        {' · '}
        desde {new Date(investment.dataInicio).toLocaleDateString('pt-BR')}
      </div>

      {mercado ? (
        <div className={styles.cardBody}>
          <div className={styles.row}>
            <span>Quantidade</span>
            <span>{quantidade}</span>
          </div>
          <div className={styles.row}>
            <span>Preço atual</span>
            {quoteQuery.isLoading ? (
              <span className={styles.percent}>carregando...</span>
            ) : quoteQuery.isError ? (
              <span className={styles.quoteError}>indisponível</span>
            ) : (
              <MoneyFigure value={preco} sign="neutral" size="sm" />
            )}
          </div>
          <div className={styles.row}>
            <span>Valor atual</span>
            <MoneyFigure value={valorAtual} sign="neutral" size="sm" />
          </div>
          {quoteQuery.data && (
            <div className={styles.row}>
              <span>Variação {investment.tipoAtivo === 'cripto' ? '24h' : 'do dia'}</span>
              <Badge tone={variacao >= 0 ? 'positive' : 'negative'}>
                {variacao >= 0 ? '+' : ''}
                {variacao.toFixed(2)}%
              </Badge>
            </div>
          )}
        </div>
      ) : (
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
      )}

      <div className={styles.cardActions}>
        <Button size="sm" variant="ghost" onClick={() => onEdit(investment)}>
          Editar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(investment.id)}>
          Excluir
        </Button>
      </div>
    </Card>
  );
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
  const [filtro, setFiltro] = useState<TipoAtivo | 'todos'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [form, setForm] = useState(emptyForm);

  const investmentsFiltrados = useMemo(
    () => (filtro === 'todos' ? investments : investments.filter((inv) => inv.tipoAtivo === filtro)),
    [investments, filtro]
  );

  // Juros compostos só faz sentido pra quem tem taxa de retorno esperada
  // (renda_fixa/imovel/outro) -- ação/fii/cripto têm valor ditado pelo
  // mercado, projetar "juros" em cima deles seria inventar um número.
  const investmentsParaProjecao = useMemo(() => investments.filter((inv) => !isAtivoMercado(inv.tipoAtivo)), [investments]);

  const chartData = useMemo(() => buildChartData(investmentsParaProjecao, horizon), [investmentsParaProjecao, horizon]);
  const chartOptions = useMemo(() => buildChartOptions(), []);

  const aporteMensalTotal = useMemo(
    () =>
      investmentsParaProjecao
        .filter((inv) => inv.tipoAporte === 'mensal')
        .reduce((acc, inv) => acc + inv.aporteMensal, 0),
    [investmentsParaProjecao]
  );

  const projectedFinal = chartData.datasets[1]?.data.at(-1) ?? 0;
  const contributedFinal = chartData.datasets[0]?.data.at(-1) ?? 0;

  const tipoAtivoEhMercado = isAtivoMercado(form.tipoAtivo);

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
      tipoAtivo: investment.tipoAtivo,
      ticker: investment.ticker || '',
      quantidade: investment.quantidade !== null ? String(investment.quantidade) : '',
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
    if (tipoAtivoEhMercado && (!form.ticker || !form.quantidade || parseFloat(form.quantidade) <= 0)) {
      addToast('Informe o ticker e a quantidade pra ação, FII ou criptomoeda', 'error');
      return;
    }

    const input = {
      nome: form.nome,
      categoria: form.categoria,
      tipoAtivo: form.tipoAtivo,
      ...(tipoAtivoEhMercado
        ? { ticker: form.ticker, quantidade: parseFloat(form.quantidade) || 0 }
        : {}),
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
          <p className={styles.subtitle}>
            Renda fixa, ações, FIIs, criptomoedas e imóveis -- cotação de mercado atualizada automaticamente.
          </p>
        </div>
        <Button onClick={openNew}>+ Novo investimento</Button>
      </div>

      {aporteMensalTotal > 0 && (
        <p className={styles.summaryLine}>
          Aportando <MoneyFigure value={aporteMensalTotal} sign="neutral" size="sm" /> por mês no total (renda fixa / imóveis / outros)
        </p>
      )}

      <Card>
        <div className={styles.chartHeader}>
          <div>
            <p className={styles.chartTitle}>Projeção da carteira</p>
            <p className={styles.chartSubtitle}>Juros compostos -- só considera investimentos com taxa de retorno fixa</p>
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
          isEmpty={!investmentsQuery.isLoading && !investmentsQuery.isError && investmentsParaProjecao.length === 0}
          onRetry={investmentsQuery.refetch}
          skeleton={<Skeleton height="260px" />}
          emptyTitle="Nenhum investimento de renda fixa cadastrado"
          emptyDescription="Ações, FIIs e criptomoedas não entram nessa projeção (o valor delas segue a cotação de mercado, não uma taxa fixa)."
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

      <div className={styles.filterTabs} role="tablist" aria-label="Filtrar por tipo de ativo">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={filtro === opt.value}
            className={[styles.filterTab, filtro === opt.value && styles.filterTabActive].filter(Boolean).join(' ')}
            onClick={() => setFiltro(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {investmentsFiltrados.length > 0 ? (
        <div className={styles.grid}>
          {investmentsFiltrados.map((investment) => (
            <InvestmentCard key={investment.id} investment={investment} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        investments.length > 0 && <p className={styles.emptyFilter}>Nenhum investimento desse tipo ainda.</p>
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
            label="Tipo de ativo"
            options={TIPO_ATIVO_OPTIONS}
            value={form.tipoAtivo}
            onChange={(e) => setForm({ ...form, tipoAtivo: e.target.value as TipoAtivo })}
          />
          <Select
            label="Categoria"
            options={CATEGORY_OPTIONS}
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          />

          {tipoAtivoEhMercado ? (
            <>
              {form.tipoAtivo === 'cripto' ? (
                <Select
                  label="Moeda"
                  options={CRYPTO_OPTIONS}
                  value={form.ticker}
                  onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                  placeholder="Selecione a criptomoeda"
                />
              ) : (
                <Input
                  label="Ticker (B3)"
                  placeholder="Ex: PETR4, MXRF11"
                  value={form.ticker}
                  onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                />
              )}
              <Input
                label="Quantidade"
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
              />
            </>
          ) : (
            <>
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
            </>
          )}

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
