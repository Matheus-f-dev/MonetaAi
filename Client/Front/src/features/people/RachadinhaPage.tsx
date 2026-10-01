import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Badge, Button, Card, Input, Modal, MoneyFigure, Select } from '../../design-system';
import { useAccounts } from '../../presentation/hooks/useAccounts';
import { usePeople } from '../../presentation/hooks/usePeople';
import { useToast } from '../../presentation/hooks/useToast';
import { ValidationContext, AmountValidation } from '../../core/services/ValidationStrategy';
import { CATEGORIES } from '../../shared/categories';
import { useCreateTransactionMutation, useCurrentUserId } from '../movements/queries';
import { useSplitParticipants } from '../movements/useSplitParticipants';
import styles from './RachadinhaPage.module.css';

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));

/**
 * Pedido do usuário: "crie um modo chamado rachadinha" -- inicialmente
 * tinha virado uma seção dentro do modal de Nova despesa, mas o usuário
 * queria mesmo uma aba própria no menu (confirmado depois de ele não
 * achar a seção escondida lá dentro). Esta página É a Rachadinha: um
 * fluxo dedicado só pra "divido uma conta com um grupo de gente" --
 * registra a despesa já com a divisão, em vez de ser um passo a mais
 * dentro do formulário genérico de transação.
 *
 * A lógica de participantes (gerar divisão igual, transferir a parte de
 * alguém pra outra pessoa pagar) é a mesma do modal -- useSplitParticipants
 * (features/movements/useSplitParticipants.ts) foi extraído de lá
 * exatamente pra essa página não divergir do comportamento que já existia.
 */
export default function RachadinhaPage() {
  const userId = useCurrentUserId();
  const { addToast } = useToast();
  // useAccounts é .js puro -- sem anotação, `accounts` infere como
  // `never[]` a partir do useState([]) interno, e some .find/.map vira
  // dor de cabeça de tipo lá na frente (ver uso em "Conta" no modal de
  // confirmação).
  const { accounts } = useAccounts(userId) as { accounts: Array<{ id: string; nome: string }> };
  const { people } = usePeople(userId);
  const createMutation = useCreateTransactionMutation();

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoria, setCategoria] = useState('');
  const [accountId, setAccountId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const {
    participants,
    headcount,
    setHeadcount,
    updateParticipant,
    addParticipant,
    removeParticipant,
    transferTo,
    generateEqualSplit: generateEqualSplitFor,
    splitEqually: splitEquallyFor,
    undo,
    canUndo,
    reset: resetParticipants
  } = useSplitParticipants();

  const total = parseFloat(valor) || 0;
  const dividido = participants.reduce((sum, p) => sum + (parseFloat(p.valor) || 0), 0);
  const diferenca = total - dividido;
  const bate = Math.abs(diferenca) < 0.01;

  function generateEqualSplit() {
    generateEqualSplitFor(total);
  }

  function splitEqually() {
    splitEquallyFor(total);
  }

  const validParticipants = participants
    .map((p) => ({ nome: p.nome.trim(), valor: parseFloat(p.valor) || 0 }))
    .filter((p) => p.nome && p.valor > 0);

  // Foca o botão "Confirmar" quando o modal abre -- roda depois do Modal
  // focar o próprio diálogo (efeito do filho comita primeiro), então essa
  // chamada "ganha" e Enter já confirma sem precisar de Tab antes.
  useEffect(() => {
    if (confirmOpen) confirmButtonRef.current?.focus();
  }, [confirmOpen]);

  // Pedido do usuário: Enter estava submetendo a operação direto (padrão
  // do HTML -- Enter num input dispara o submit do form). Agora Enter só
  // avança pro próximo campo (como Tab); só confirma de verdade quando
  // não sobra mais nenhum campo pra preencher, e mesmo aí passa pelo
  // modal de confirmação (handleSubmit abaixo), nunca cria a transação
  // direto.
  function handleFormKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key !== 'Enter') return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA') return;
    e.preventDefault();

    const focusables = Array.from(e.currentTarget.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')).filter(
      (el) => !el.disabled
    );
    const index = focusables.indexOf(target as HTMLInputElement | HTMLSelectElement);
    const next = focusables[index + 1];
    if (next) {
      next.focus();
      if (next instanceof HTMLInputElement) next.select();
    } else {
      e.currentTarget.requestSubmit();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Strategy -- mesma validação de valor que o resto do app usa
    // (ValidationContext + AmountValidation, ver TransactionModal).
    const validator = new ValidationContext(new AmountValidation());
    const validation = validator.validate(valor);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    if (!descricao.trim()) {
      setError('Descreva a despesa (ex: Jantar de sexta).');
      return;
    }
    if (!categoria) {
      setError('Selecione uma categoria.');
      return;
    }

    if (validParticipants.length === 0) {
      setError('Adicione ao menos uma pessoa com nome e valor pra dividir.');
      return;
    }

    // Só abre a confirmação -- a criação de verdade só acontece se a
    // pessoa confirmar no modal (ver confirmarRegistro).
    setConfirmOpen(true);
  }

  async function confirmarRegistro() {
    // Mesma conversão de data que o resto do app faz (ver TransactionModal)
    // -- o backend espera "DD/MM/AAAA, HH:mm:ss".
    const [year, month, day] = data.split('-');
    const dataHora = `${day}/${month}/${year}, ${new Date().toLocaleTimeString('pt-BR')}`;

    try {
      await createMutation.mutateAsync({
        userId: userId as string,
        tipo: 'Despesa',
        valor: -Math.abs(total),
        descricao,
        categoria,
        dataHora,
        ...(accountId ? { accountId } : {}),
        split: { participantes: validParticipants.map((p) => ({ ...p, pago: false })) }
      });
      addToast('Despesa dividida registrada com sucesso!', 'success');
      setConfirmOpen(false);
      setDescricao('');
      setValor('');
      setCategoria('');
      setAccountId('');
      resetParticipants();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao registrar a despesa', 'error');
    }
  }

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Rachadinha</h1>
        <p className={styles.subtitle}>
          Divida uma despesa com outras pessoas -- registra o gasto já com a divisão certa, direto em Pessoas.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
        <Card>
          <h2 className={styles.sectionTitle}>A conta</h2>
          <div className={styles.fields}>
            <Input
              label="Descrição"
              placeholder="Ex: Jantar de sexta"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />
            <div className={styles.row}>
              <Input
                label="Valor total (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                error={error ?? undefined}
                required
              />
              <Input label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>
            <Select
              label="Categoria"
              placeholder="Selecione uma categoria"
              options={CATEGORY_OPTIONS}
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              required
            />
            {accounts.length > 0 && (
              <Select
                label="Conta (opcional)"
                placeholder="Conta principal"
                options={accounts.map((a) => ({ value: a.id, label: a.nome }))}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
            )}
          </div>
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Quem participa</h2>
          <p className={styles.sectionHint}>
            Diga quantas pessoas dividem a conta e deixe a Rachadinha calcular -- edite nome e valor de qualquer uma
            depois, ou transfira a parte de alguém pra outra pessoa pagar.
          </p>

          <div className={styles.generatorRow}>
            <input
              className={styles.headcountInput}
              type="number"
              min="1"
              placeholder="Quantas pessoas?"
              value={headcount}
              onChange={(e) => setHeadcount(e.target.value)}
              aria-label="Quantidade de pessoas"
            />
            <Button type="button" variant="secondary" onClick={generateEqualSplit}>
              Gerar divisão igual
            </Button>
          </div>

          <datalist id="known-people-rachadinha">
            {people.map((p: { nome: string }) => (
              <option key={p.nome} value={p.nome} />
            ))}
          </datalist>

          <div className={styles.participants}>
            {participants.map((p, index) => (
              <div className={styles.participantRow} key={index}>
                <input
                  className={styles.participantInput}
                  type="text"
                  list="known-people-rachadinha"
                  placeholder="Nome da pessoa"
                  value={p.nome}
                  onChange={(e) => updateParticipant(index, 'nome', e.target.value)}
                />
                <input
                  className={styles.participantInput}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={p.valor}
                  onChange={(e) => updateParticipant(index, 'valor', e.target.value)}
                />
                {participants.length > 1 && (
                  <select
                    className={styles.participantTransfer}
                    value=""
                    onChange={(e) => {
                      const targetIndex = Number(e.target.value);
                      if (!Number.isNaN(targetIndex)) transferTo(index, targetIndex);
                    }}
                    aria-label={`Transferir a parte de ${p.nome || 'esta pessoa'} pra outra pessoa pagar`}
                  >
                    <option value="" disabled>
                      Transferir pra...
                    </option>
                    {participants
                      .map((other, i) => ({ other, i }))
                      .filter(({ i }) => i !== index)
                      .map(({ other, i }) => (
                        <option key={i} value={i}>
                          {other.nome || `Pessoa ${i + 1}`}
                        </option>
                      ))}
                  </select>
                )}
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeParticipant(index)}
                  disabled={participants.length <= 1}
                  aria-label="Remover pessoa"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className={styles.participantsActions}>
            <button type="button" className={styles.linkButton} onClick={addParticipant}>
              + Adicionar pessoa
            </button>
            <button type="button" className={styles.linkButton} onClick={splitEqually}>
              Dividir valor igualmente
            </button>
            {canUndo && (
              <button type="button" className={styles.linkButton} onClick={undo}>
                Desfazer
              </button>
            )}
          </div>

          <div className={styles.summary}>
            <span className={styles.summaryItem}>
              Total da conta <MoneyFigure value={total} sign="neutral" size="sm" />
            </span>
            <span className={styles.summaryItem}>
              Dividido <MoneyFigure value={dividido} sign="neutral" size="sm" />
            </span>
            {dividido > 0 &&
              (bate ? (
                <Badge tone="positive">Bate certinho</Badge>
              ) : (
                <Badge tone="warning">
                  {diferenca > 0 ? 'Falta' : 'Passou'} <MoneyFigure value={Math.abs(diferenca)} sign="neutral" size="sm" />
                </Badge>
              ))}
          </div>
        </Card>

        <div className={styles.actions}>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Registrando...' : 'Registrar despesa dividida'}
          </Button>
        </div>
      </form>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar despesa dividida">
        <div className={styles.confirmBody}>
          <div className={styles.confirmRow}>
            <span>Descrição</span>
            <strong>{descricao}</strong>
          </div>
          <div className={styles.confirmRow}>
            <span>Valor total</span>
            <MoneyFigure value={total} sign="neutral" size="sm" />
          </div>
          <div className={styles.confirmRow}>
            <span>Data</span>
            <strong>{new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')}</strong>
          </div>
          <div className={styles.confirmRow}>
            <span>Categoria</span>
            <strong>{categoria}</strong>
          </div>
          {accountId && (
            <div className={styles.confirmRow}>
              <span>Conta</span>
              <strong>{accounts.find((a) => a.id === accountId)?.nome}</strong>
            </div>
          )}

          <div className={styles.confirmParticipants}>
            <span className={styles.confirmParticipantsTitle}>Quem paga</span>
            {validParticipants.map((p, i) => (
              <div className={styles.confirmRow} key={i}>
                <span>{p.nome}</span>
                <MoneyFigure value={p.valor} sign="neutral" size="sm" />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.confirmActions}>
          <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>
            Voltar e editar
          </Button>
          <Button type="button" ref={confirmButtonRef} onClick={confirmarRegistro} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Registrando...' : 'Confirmar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
