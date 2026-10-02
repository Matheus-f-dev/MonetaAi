import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArcElement, Chart as ChartJS, Legend, Tooltip, type ChartOptions } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Badge, Button, Card, EmptyState, Input, Modal, MoneyFigure, QueryState, Select, Skeleton } from '../../design-system';
import { useToast } from '../../presentation/hooks/useToast';
import type { Investment } from './api';
import {
  useCreateInvestmentMutation,
  useCurrentUserId,
  useDeleteInvestmentMutation,
  useInvestmentsQuery,
  useMarketQuoteQuery,
  useUpdateInvestmentMutation
} from './queries';
import styles from './CryptoPage.module.css';

ChartJS.register(ArcElement, Legend, Tooltip);

// Mesma lista curada do InvestimentosPage (CoinGecko identifica por id,
// não por ticker -- ver MarketDataService.fetchCryptoPrice no backend).
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

const COIN_LABEL: Record<string, string> = Object.fromEntries(CRYPTO_OPTIONS.map((o) => [o.value, o.label]));

const DOUGHNUT_COLORS = [
  '#2f6f4e', '#d6a24a', '#a8322b', '#3d6b94', '#8a5fae',
  '#4a9b8e', '#c77d3f', '#6b7fd7', '#9b4f6b', '#5a8c3f'
];

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const emptyForm = {
  nome: '',
  ticker: '',
  quantidade: '',
  dataInicio: new Date().toISOString().slice(0, 10)
};

interface HoldingValue {
  valor: number;
  variacao: number;
}

interface CryptoHoldingCardProps {
  investment: Investment;
  onValueChange: (id: string, value: HoldingValue | null) => void;
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
}

// Reporta o valor atual (quantidade × cotação) pra cima via onValueChange
// -- é assim que o card "Patrimônio em cripto" consegue somar todas as
// moedas sem violar as regras de hooks (cada card chama seu próprio
// useMarketQuoteQuery, independente).
function CryptoHoldingCard({ investment, onValueChange, onEdit, onDelete }: CryptoHoldingCardProps) {
  const quoteQuery = useMarketQuoteQuery('cripto', investment.ticker);
  const quantidade = investment.quantidade ?? 0;
  const preco = quoteQuery.data?.preco ?? 0;
  const valorAtual = quantidade * preco;
  const variacao = quoteQuery.data?.variacaoPercentual ?? 0;

  useEffect(() => {
    onValueChange(investment.id, quoteQuery.data ? { valor: valorAtual, variacao } : null);
    return () => onValueChange(investment.id, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investment.id, valorAtual, variacao, quoteQuery.data]);

  return (
    <Card perforated>
      <div className={styles.cardTop}>
        <span className={styles.nome}>{investment.nome}</span>
        <Badge tone="brand">{COIN_LABEL[investment.ticker || ''] || investment.ticker?.toUpperCase()}</Badge>
      </div>
      <div className={styles.meta}>desde {new Date(investment.dataInicio).toLocaleDateString('pt-BR')}</div>
      <div className={styles.cardBody}>
        <div className={styles.row}>
          <span>Quantidade</span>
          <span>{quantidade}</span>
        </div>
        <div className={styles.row}>
          <span>Preço atual</span>
          {quoteQuery.isLoading ? (
            <span className={styles.loadingText}>carregando...</span>
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
            <span>Variação 24h</span>
            <Badge tone={variacao >= 0 ? 'positive' : 'negative'}>
              {variacao >= 0 ? '+' : ''}
              {variacao.toFixed(2)}%
            </Badge>
          </div>
        )}
      </div>
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

/**
 * Pedido do usuário: "crie a aba cripto" -- separada de Investimentos
 * (que já ganhou tipos de ativo incluindo cripto como filtro), essa tela
 * é dedicada: resumo do patrimônio total em cripto, gráfico de composição
 * por moeda, e gestão direta das moedas, tudo com cotação ao vivo
 * (CoinGecko). Reaproveita o mesmo registro de investimentos do backend
 * (tipoAtivo='cripto') -- não é uma tabela nova, é outra tela em cima do
 * mesmo dado.
 */
export default function CryptoPage() {
  const userId = useCurrentUserId();
  const { addToast } = useToast();

  const investmentsQuery = useInvestmentsQuery(userId);
  const createMutation = useCreateInvestmentMutation();
  const updateMutation = useUpdateInvestmentMutation();
  const deleteMutation = useDeleteInvestmentMutation();

  const holdings = useMemo(
    () => (investmentsQuery.data ?? []).filter((inv) => inv.tipoAtivo === 'cripto'),
    [investmentsQuery.data]
  );

  const [valores, setValores] = useState<Record<string, HoldingValue>>({});
  const handleValueChange = useCallback((id: string, value: HoldingValue | null) => {
    setValores((prev) => {
      if (!value) {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }
      const atual = prev[id];
      if (atual && atual.valor === value.valor && atual.variacao === value.variacao) return prev;
      return { ...prev, [id]: value };
    });
  }, []);

  const totalCarteira = useMemo(() => Object.values(valores).reduce((acc, v) => acc + v.valor, 0), [valores]);

  const doughnutData = useMemo(() => {
    const entradas = holdings
      .map((h) => ({ nome: h.nome, valor: valores[h.id]?.valor ?? 0 }))
      .filter((e) => e.valor > 0);
    return {
      labels: entradas.map((e) => e.nome),
      datasets: [
        {
          data: entradas.map((e) => e.valor),
          backgroundColor: entradas.map((_, i) => DOUGHNUT_COLORS[i % DOUGHNUT_COLORS.length]),
          borderWidth: 0
        }
      ]
    };
  }, [holdings, valores]);

  const doughnutOptions: ChartOptions<'doughnut'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 12, boxHeight: 12 } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatMoney(Number(ctx.parsed))}` } }
      }
    }),
    []
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(investment: Investment) {
    setEditing(investment);
    setForm({
      nome: investment.nome,
      ticker: investment.ticker || '',
      quantidade: investment.quantidade !== null ? String(investment.quantidade) : '',
      dataInicio: investment.dataInicio.slice(0, 10)
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.ticker) {
      addToast('Dê um nome e escolha a moeda', 'error');
      return;
    }
    if (!form.quantidade || parseFloat(form.quantidade) <= 0) {
      addToast('Informe uma quantidade maior que zero', 'error');
      return;
    }

    const input = {
      nome: form.nome,
      categoria: 'Criptomoedas',
      tipoAtivo: 'cripto' as const,
      ticker: form.ticker,
      quantidade: parseFloat(form.quantidade) || 0,
      tipoAporte: 'unico' as const,
      valorInicial: 0,
      aporteMensal: 0,
      taxaRetornoAnual: 0,
      dataInicio: form.dataInicio
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
        addToast('Criptomoeda atualizada com sucesso!', 'success');
      } else {
        await createMutation.mutateAsync(input);
        addToast('Criptomoeda adicionada com sucesso!', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao salvar criptomoeda', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remover esta criptomoeda da carteira?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Criptomoeda removida com sucesso', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao remover criptomoeda', 'error');
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isEmpty = !investmentsQuery.isLoading && !investmentsQuery.isError && holdings.length === 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Criptomoedas</h1>
          <p className={styles.subtitle}>Sua carteira cripto, com cotação ao vivo via CoinGecko.</p>
        </div>
        <Button onClick={openNew}>+ Nova criptomoeda</Button>
      </div>

      <QueryState
        isLoading={investmentsQuery.isLoading}
        isError={investmentsQuery.isError}
        onRetry={investmentsQuery.refetch}
        skeleton={<Skeleton height="200px" />}
      >
        {isEmpty ? (
          <EmptyState
            title="Nenhuma criptomoeda cadastrada"
            description="Adicione uma moeda pra acompanhar o valor da sua carteira cripto em tempo real."
            actionLabel="+ Nova criptomoeda"
            onAction={openNew}
          />
        ) : (
          <>
            <Card>
              <div className={styles.summaryRow}>
                <div>
                  <p className={styles.summaryLabel}>Patrimônio total em cripto</p>
                  <MoneyFigure value={totalCarteira} sign="neutral" size="lg" />
                  <p className={styles.summaryHint}>
                    {holdings.length} moeda{holdings.length !== 1 ? 's' : ''} · cotação de hoje, atualizada automaticamente
                  </p>
                </div>
                {doughnutData.labels.length > 0 && (
                  <div className={styles.doughnutWrap}>
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </div>
                )}
              </div>
            </Card>

            <div className={styles.grid}>
              {holdings.map((investment) => (
                <CryptoHoldingCard
                  key={investment.id}
                  investment={investment}
                  onValueChange={handleValueChange}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </QueryState>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar criptomoeda' : 'Nova criptomoeda'}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Nome"
            placeholder="Ex: Minha reserva em Bitcoin"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
          />
          <Select
            label="Moeda"
            options={CRYPTO_OPTIONS}
            value={form.ticker}
            onChange={(e) => setForm({ ...form, ticker: e.target.value })}
            placeholder="Selecione a criptomoeda"
          />
          <Input
            label="Quantidade"
            type="number"
            step="any"
            min="0"
            placeholder="0"
            value={form.quantidade}
            onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
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
