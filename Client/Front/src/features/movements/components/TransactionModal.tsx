import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Modal, Select } from '../../../design-system';
import { ValidationContext, AmountValidation } from '../../../core/services/ValidationStrategy';
import { TransactionFactory } from '../../../core/services/TransactionFactory';
import { CATEGORIES } from '../../../shared/categories';
import type { TransactionPayload } from '../api';
import { useSplitParticipants } from '../useSplitParticipants';
import styles from './TransactionModal.module.css';

export interface TransactionModalAccount {
  id: string;
  nome: string;
}

export interface TransactionModalCard {
  id: string;
  nome: string;
  final: string;
}

export interface EditingTransaction {
  id: string;
  descricao?: string;
  valor: number;
  categoria?: string;
  tipo?: string;
  accountId?: string;
  /** Divisão já existente, se a transação já tinha uma -- pré-preenche a
   * seção de divisão ao abrir pra editar (ver useEffect abaixo). */
  split?: { participantes: Array<{ nome: string; valor: number; pago: boolean }> } | null;
}

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: Omit<TransactionPayload, 'userId'>) => void;
  accounts?: TransactionModalAccount[];
  cards?: TransactionModalCard[];
  knownNames?: string[];
  editingTransaction?: EditingTransaction | null;
  /** Tipo pré-selecionado ao abrir pra uma nova transação (ex.: a página
   * de Receitas abre o modal já em "Receita") -- ignorado quando estiver
   * editando, que usa o tipo da transação existente. */
  defaultTipo?: 'Despesa' | 'Receita';
  isSubmitting?: boolean;
  /** Mensagem de validação vinda de fora (ex.: erro devolvido pela API) --
   * separada da validação de Strategy, que roda antes mesmo de tentar
   * submeter. */
  submitError?: string | null;
}

const emptyForm = {
  descricao: '',
  valor: '',
  categoria: '',
  tipo: 'Despesa' as 'Despesa' | 'Receita',
  data: new Date().toISOString().split('T')[0],
  cardId: '',
  parcelas: '1',
  accountId: ''
};

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));

/**
 * Reconstrução do modal de nova/editar transação (Fase 3) -- mesmos dois
 * padrões GoF do original (ver README, seção Padrões GoF):
 *
 * - Strategy: ValidationContext + AmountValidation valida o valor antes
 *   de qualquer outra coisa, do mesmo jeito que Login/Register usam
 *   EmailValidation/PasswordValidation.
 * - Factory Method: TransactionFactory.createTransaction(tipo, dados)
 *   decide qual classe instanciar (IncomeTransaction/ExpenseTransaction)
 *   -- chamado aqui só pra validar que o tipo é reconhecido antes de
 *   montar o payload de verdade que vai pro backend, igual o modal
 *   antigo fazia.
 *
 * Divisão de despesa (pedido do usuário): passou a funcionar também ao
 * EDITAR uma despesa já lançada, não só ao criar -- antes a seção inteira
 * ficava escondida em modo de edição, e nem o backend aceitava `split`
 * no PUT (só no POST). "Rachadinha" é o gerador rápido (quantidade de
 * pessoas -> N linhas com o valor dividido igual) por cima da mesma
 * lista de participantes de sempre -- cada linha continua editável na
 * mão pros "casos especiais" (delimitar um valor diferente pra alguém,
 * ou transferir a parte de uma pessoa pra outra pagar).
 */
export function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  accounts = [],
  cards = [],
  knownNames = [],
  editingTransaction = null,
  defaultTipo = 'Despesa',
  isSubmitting = false,
  submitError = null
}: TransactionModalProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [splitEnabled, setSplitEnabled] = useState(false);
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
  const isEditing = Boolean(editingTransaction);

  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setFormData({
        descricao: editingTransaction.descricao || '',
        valor: Math.abs(editingTransaction.valor || 0).toString(),
        categoria: editingTransaction.categoria || '',
        tipo: editingTransaction.tipo?.toLowerCase() === 'receita' ? 'Receita' : 'Despesa',
        data: new Date().toISOString().split('T')[0],
        cardId: '',
        parcelas: '1',
        accountId: editingTransaction.accountId || ''
      });

      const existing = editingTransaction.split?.participantes;
      if (existing?.length) {
        setSplitEnabled(true);
        resetParticipants(existing.map((p) => ({ nome: p.nome, valor: String(p.valor) })));
      } else {
        setSplitEnabled(false);
        resetParticipants();
      }
    } else {
      setFormData({ ...emptyForm, tipo: defaultTipo });
      setSplitEnabled(false);
      resetParticipants();
    }
    setValidationError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingTransaction, defaultTipo]);

  // Os dois precisam do valor total digitado no formulário -- o hook
  // compartilhado não sabe dele (não tem campo "valor" nenhum, só a lista
  // de participantes), então a conta entra aqui na hora de chamar.
  const generateEqualSplit = () => generateEqualSplitFor(parseFloat(formData.valor) || 0);
  const splitEqually = () => splitEquallyFor(parseFloat(formData.valor) || 0);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);

    // Strategy -- valor primeiro, antes de qualquer outra checagem.
    const validator = new ValidationContext(new AmountValidation());
    const validation = validator.validate(formData.valor);
    if (!validation.isValid) {
      setValidationError(validation.message);
      return;
    }

    // Factory Method -- só pra confirmar que o tipo é reconhecido antes
    // de montar o payload de verdade (mesmo raciocínio do modal antigo).
    try {
      TransactionFactory.createTransaction(formData.tipo, {
        valor: formData.valor,
        descricao: formData.descricao,
        categoria: formData.categoria,
        data: formData.data,
        userId: 'validation-only'
      });
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Tipo de transação inválido');
      return;
    }

    const parcelas = parseInt(formData.parcelas, 10) || 1;
    const validParticipants = participants
      .map((p) => ({ nome: p.nome.trim(), valor: parseFloat(p.valor) || 0 }))
      .filter((p) => p.nome && p.valor > 0);

    if (formData.tipo === 'Despesa' && splitEnabled && validParticipants.length === 0) {
      setValidationError('Adicione ao menos uma pessoa com nome e valor para dividir a despesa');
      return;
    }

    // O backend espera dataHora em "DD/MM/AAAA, HH:mm:ss" (mesmo formato
    // que grava em toda transação nova) -- o <input type="date"> devolve
    // "AAAA-MM-DD". Resolvido aqui dentro pra quem usa o modal não
    // precisar lembrar dessa conversão toda vez.
    const [year, month, day] = formData.data.split('-');
    const dataHora = `${day}/${month}/${year}, ${new Date().toLocaleTimeString('pt-BR')}`;

    // `undefined` (chave ausente) preserva a divisão já existente no
    // backend; `{ participantes: [] }` some com ela -- é o que permite
    // desmarcar "Dividir com outras pessoas" numa edição pra remover a
    // divisão de vez, sem precisar apagar e recriar a transação.
    const splitPayload =
      formData.tipo === 'Despesa' && (splitEnabled || (isEditing && editingTransaction?.split))
        ? { participantes: splitEnabled ? validParticipants.map((p) => ({ ...p, pago: false })) : [] }
        : undefined;

    const payload: Omit<TransactionPayload, 'userId'> = {
      tipo: formData.tipo,
      valor: formData.tipo === 'Receita' ? Math.abs(parseFloat(formData.valor)) : -Math.abs(parseFloat(formData.valor)),
      descricao: formData.descricao,
      categoria: formData.categoria,
      dataHora,
      ...(formData.accountId ? { accountId: formData.accountId } : {}),
      ...(formData.tipo === 'Despesa' && formData.cardId ? { cardId: formData.cardId } : {}),
      ...(formData.tipo === 'Despesa' && formData.cardId && parcelas > 1 ? { parcelas } : {}),
      ...(splitPayload ? { split: splitPayload } : {})
    };

    onSubmit(payload);
  }

  return (
    <Modal open={isOpen} onClose={onClose} title={isEditing ? 'Editar transação' : 'Nova transação'}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.typeToggle}>
          <button
            type="button"
            className={[styles.typeButton, formData.tipo === 'Receita' && styles.typeButtonActiveIncome].filter(Boolean).join(' ')}
            onClick={() => setFormData({ ...formData, tipo: 'Receita' })}
          >
            Receita
          </button>
          <button
            type="button"
            className={[styles.typeButton, formData.tipo === 'Despesa' && styles.typeButtonActiveExpense].filter(Boolean).join(' ')}
            onClick={() => setFormData({ ...formData, tipo: 'Despesa' })}
          >
            Despesa
          </button>
        </div>

        <Input
          label="Descrição"
          placeholder="Ex: Almoço no restaurante"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          required
        />

        <div className={styles.row}>
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            error={validationError ?? undefined}
            required
          />
          <Input
            label="Data"
            type="date"
            value={formData.data}
            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
            required
          />
        </div>

        <Select
          label="Categoria"
          placeholder="Selecione uma categoria"
          options={CATEGORY_OPTIONS}
          value={formData.categoria}
          onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
          required
        />

        {accounts.length > 0 && !isEditing && (
          <Select
            label="Conta (opcional)"
            placeholder="Conta principal"
            options={accounts.map((a) => ({ value: a.id, label: a.nome }))}
            value={formData.accountId}
            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
          />
        )}

        {formData.tipo === 'Despesa' && cards.length > 0 && !isEditing && (
          <Select
            label="Cartão (opcional)"
            placeholder="Não usar cartão"
            options={cards.map((c) => ({ value: c.id, label: `${c.nome} •• ${c.final}` }))}
            value={formData.cardId}
            onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
          />
        )}

        {formData.tipo === 'Despesa' && formData.cardId && !isEditing && (
          <Select
            label="Parcelas"
            options={Array.from({ length: 12 }, (_, i) => i + 1).map((n) => ({
              value: String(n),
              label: n === 1 ? 'À vista' : `${n}x de R$ ${(parseFloat(formData.valor || '0') / n).toFixed(2)}`
            }))}
            value={formData.parcelas}
            onChange={(e) => setFormData({ ...formData, parcelas: e.target.value })}
          />
        )}

        {formData.tipo === 'Despesa' && (
          <div>
            <label className={styles.splitToggle}>
              <input type="checkbox" checked={splitEnabled} onChange={(e) => setSplitEnabled(e.target.checked)} />
              Dividir com outras pessoas
            </label>

            {splitEnabled && (
              <div className={styles.splitBox} style={{ marginTop: 8 }}>
                <div className={styles.rachadinha}>
                  <span className={styles.rachadinhaLabel}>Rachadinha</span>
                  <div className={styles.rachadinhaRow}>
                    <input
                      className={styles.rachadinhaInput}
                      type="number"
                      min="1"
                      placeholder="Quantas pessoas?"
                      value={headcount}
                      onChange={(e) => setHeadcount(e.target.value)}
                      aria-label="Quantidade de pessoas"
                    />
                    <button type="button" className={styles.linkButton} onClick={generateEqualSplit}>
                      Gerar divisão igual
                    </button>
                  </div>
                  <p className={styles.rachadinhaHint}>
                    Preenche {Math.max(1, parseInt(headcount, 10) || 1)} pessoa(s) com o valor dividido igualmente --
                    dá pra editar nome e valor de cada uma depois, ou transferir a parte de alguém pra outra pessoa
                    pagar.
                  </p>
                </div>

                <datalist id="known-people">
                  {knownNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>

                {participants.map((p, index) => (
                  <div className={styles.splitRow} key={index}>
                    <input
                      className={styles.splitInput}
                      type="text"
                      list="known-people"
                      placeholder="Nome da pessoa"
                      value={p.nome}
                      onChange={(e) => updateParticipant(index, 'nome', e.target.value)}
                    />
                    <input
                      className={styles.splitInput}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={p.valor}
                      onChange={(e) => updateParticipant(index, 'valor', e.target.value)}
                    />
                    {participants.length > 1 && (
                      <select
                        className={styles.splitTransfer}
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
                      className={styles.splitRemove}
                      onClick={() => removeParticipant(index)}
                      disabled={participants.length <= 1}
                      aria-label="Remover pessoa"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <div className={styles.splitActions}>
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
              </div>
            )}
          </div>
        )}

        {submitError && (
          <p role="alert" style={{ color: 'var(--color-negative)', fontSize: 'var(--text-sm)' }}>
            {submitError}
          </p>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
