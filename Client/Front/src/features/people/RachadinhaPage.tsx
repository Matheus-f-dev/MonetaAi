import { useState, type FormEvent } from 'react';
import { Badge, Button, Card, Input, MoneyFigure, Select } from '../../design-system';
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
  const { accounts } = useAccounts(userId);
  const { people } = usePeople(userId);
  const createMutation = useCreateTransactionMutation();

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoria, setCategoria] = useState('');
  const [accountId, setAccountId] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(e: FormEvent) {
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

    const validParticipants = participants
      .map((p) => ({ nome: p.nome.trim(), valor: parseFloat(p.valor) || 0 }))
      .filter((p) => p.nome && p.valor > 0);

    if (validParticipants.length === 0) {
      setError('Adicione ao menos uma pessoa com nome e valor pra dividir.');
      return;
    }

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

      <form className={styles.form} onSubmit={handleSubmit}>
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
                options={accounts.map((a: { id: string; nome: string }) => ({ value: a.id, label: a.nome }))}
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
    </div>
  );
}
