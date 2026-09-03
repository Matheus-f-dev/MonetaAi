import { useState, type FormEvent } from 'react';
import { Badge, Button, Card, Input, Modal, QueryState, Skeleton } from '../../design-system';
import { useToast } from '../../presentation/hooks/useToast';
import type { CardItem } from './api';
import { useCardInvoiceQuery, useCardsQuery, useCreateCardMutation, useCurrentUserId, useDeleteCardMutation, useUpdateCardMutation } from './queries';
import styles from './CartoesPage.module.css';

const CORES = ['roxo', 'azul', 'verde', 'grafite'];

const emptyForm = { nome: '', instituicao: '', final: '', limite: '', diaFechamento: '1', diaVencimento: '10', cor: 'roxo' };

export default function CartoesPage() {
  const userId = useCurrentUserId();
  const { addToast } = useToast();

  const cardsQuery = useCardsQuery(userId);
  const createMutation = useCreateCardMutation();
  const updateMutation = useUpdateCardMutation();
  const deleteMutation = useDeleteCardMutation();

  const cards = cardsQuery.data ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CardItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(card: CardItem) {
    setEditing(card);
    setForm({
      nome: card.nome,
      instituicao: card.instituicao || '',
      final: card.final,
      limite: String(card.limite ?? ''),
      diaFechamento: String(card.diaFechamento ?? 1),
      diaVencimento: String(card.diaVencimento ?? 10),
      cor: card.cor || 'roxo'
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.final) {
      addToast('Preencha ao menos o nome e os 4 últimos dígitos do cartão', 'error');
      return;
    }
    const input = {
      nome: form.nome,
      instituicao: form.instituicao,
      final: form.final,
      limite: parseFloat(form.limite) || 0,
      diaFechamento: parseInt(form.diaFechamento, 10),
      diaVencimento: parseInt(form.diaVencimento, 10),
      cor: form.cor
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
        addToast('Cartão atualizado com sucesso!', 'success');
      } else {
        await createMutation.mutateAsync(input);
        addToast('Cartão cadastrado com sucesso!', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao salvar cartão', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remover este cartão? O histórico de compras vinculado a ele é mantido.')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Cartão removido com sucesso', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao remover cartão', 'error');
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cartões</h1>
          <p className={styles.subtitle}>Fatura atual e limite usado por cartão</p>
        </div>
        <Button onClick={openNew}>+ Novo cartão</Button>
      </div>

      <QueryState
        isLoading={cardsQuery.isLoading}
        isError={cardsQuery.isError}
        isEmpty={!cardsQuery.isLoading && !cardsQuery.isError && cards.length === 0}
        onRetry={cardsQuery.refetch}
        skeleton={
          <div className={styles.grid}>
            {[0, 1].map((i) => (
              <Skeleton key={i} height="9rem" />
            ))}
          </div>
        }
        emptyTitle="Nenhum cartão cadastrado"
        emptyDescription="Cadastre seus cartões de crédito pra acompanhar a fatura e o limite usado de cada um."
      >
        <div className={styles.grid}>
          {cards.map((card) => (
            <CardTile key={card.id} card={card} onEdit={() => openEdit(card)} onDelete={() => handleDelete(card.id)} />
          ))}
        </div>
      </QueryState>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar cartão' : 'Novo cartão'}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input label="Apelido do cartão" placeholder="Ex: Nubank Roxinho" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          <Input label="Instituição" placeholder="Ex: Nubank" value={form.instituicao} onChange={(e) => setForm({ ...form, instituicao: e.target.value })} />
          <Input label="4 últimos dígitos" maxLength={4} placeholder="0000" value={form.final} onChange={(e) => setForm({ ...form, final: e.target.value })} required />
          <Input label="Limite (R$)" type="number" step="0.01" min="0" placeholder="0,00" value={form.limite} onChange={(e) => setForm({ ...form, limite: e.target.value })} />
          <div className={styles.formRow}>
            <Input label="Dia de fechamento" type="number" min="1" max="28" value={form.diaFechamento} onChange={(e) => setForm({ ...form, diaFechamento: e.target.value })} />
            <Input label="Dia de vencimento" type="number" min="1" max="28" value={form.diaVencimento} onChange={(e) => setForm({ ...form, diaVencimento: e.target.value })} />
          </div>
          <div>
            <label className={styles.colorLabel}>Cor</label>
            <div className={styles.colorPicker}>
              {CORES.map((cor) => (
                <button
                  type="button"
                  key={cor}
                  className={[styles.swatch, styles[`swatch-${cor}`], form.cor === cor && styles.swatchActive].filter(Boolean).join(' ')}
                  onClick={() => setForm({ ...form, cor })}
                  aria-label={cor}
                />
              ))}
            </div>
          </div>
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

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function CardTile({ card, onEdit, onDelete }: { card: CardItem; onEdit: () => void; onDelete: () => void }) {
  const invoiceQuery = useCardInvoiceQuery(card.id);
  const invoice = invoiceQuery.data;
  const pct = invoice?.usoPercentual ?? 0;

  return (
    <Card className={[styles.tile, styles[`tile-${card.cor || 'roxo'}`]].join(' ')}>
      <div className={styles.tileTop}>
        <span className={styles.tileInst}>{card.instituicao || card.nome}</span>
        <span className={styles.tileFinal}>•• {card.final}</span>
      </div>
      <div className={styles.tileName}>{card.nome}</div>
      <div className={styles.tileInvoice}>
        Fatura atual: <strong>{brl(invoice?.total ?? 0)}</strong>
      </div>
      <div className={styles.tileBottom}>
        <span>
          fecha dia {card.diaFechamento} · vence dia {card.diaVencimento}
        </span>
        <Badge tone={card.limite ? (pct >= 90 ? 'negative' : 'neutral') : 'neutral'}>
          {card.limite ? `${pct}% do limite` : 'sem limite definido'}
        </Badge>
      </div>
      {card.limite > 0 && (
        <div className={styles.tileBar}>
          <div className={[styles.tileBarFill, pct >= 90 && styles.tileBarFillOver].filter(Boolean).join(' ')} style={{ width: `${pct}%` }} />
        </div>
      )}
      <div className={styles.tileActions}>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Editar
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          Remover
        </Button>
      </div>
    </Card>
  );
}
