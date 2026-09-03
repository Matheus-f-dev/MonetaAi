import { useRef, useState, type ChangeEvent } from 'react';
import { Badge, Button, Card, EmptyState, MoneyFigure, Select, Skeleton, Table, TableNumericCell } from '../../design-system';
import { useToast } from '../../presentation/hooks/useToast';
import { CATEGORIES } from '../../shared/categories';
import type { ImportPreviewRow } from './api';
import { useConfirmImportMutation, usePreviewImportMutation } from './queries';
import styles from './ImportStatementPage.module.css';

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));
const FORMAT_OPTIONS = [
  { value: 'csv-nubank', label: 'CSV (Nubank — conta corrente)' },
  { value: 'ofx', label: 'OFX' }
];

interface EditableRow extends ImportPreviewRow {
  include: boolean;
}

/**
 * Fase 3 -- fluxo em duas etapas (upload → prévia editável → confirmar),
 * exatamente como o FRONTEND_TODO.md descreve o contrato do backend:
 * /transactions/import/preview nunca grava nada, só devolve a lista com
 * categoria sugerida e o aviso de duplicata; a gravação de verdade só
 * acontece quando o usuário confirma a lista (editada ou não) em
 * /transactions/import/confirm.
 */
export default function ImportStatementPage() {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formato, setFormato] = useState<'ofx' | 'csv-nubank'>('csv-nubank');
  const [rows, setRows] = useState<EditableRow[] | null>(null);

  const previewMutation = usePreviewImportMutation();
  const confirmMutation = useConfirmImportMutation();

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const preview = await previewMutation.mutateAsync({ formato, file });
      setRows(preview.map((r) => ({ ...r, include: !r.jaImportada })));
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao processar o arquivo', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function updateRow(index: number, patch: Partial<EditableRow>) {
    setRows((prev) => (prev ? prev.map((r, i) => (i === index ? { ...r, ...patch } : r)) : prev));
  }

  async function handleConfirm() {
    if (!rows) return;
    const included = rows.filter((r) => r.include);
    if (included.length === 0) {
      addToast('Selecione ao menos uma transação para importar.', 'error');
      return;
    }

    try {
      const result = await confirmMutation.mutateAsync(
        included.map((r) => ({
          externalId: r.externalId,
          data: r.data,
          descricao: r.descricao,
          categoria: r.categoriaSugerida,
          valor: r.valor,
          tipo: r.tipo
        }))
      );
      addToast(result.message, 'success');
      setRows(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao confirmar importação', 'error');
    }
  }

  const step = rows ? 'preview' : 'upload';
  const includedCount = rows?.filter((r) => r.include).length ?? 0;

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Importar extrato</h1>
        <p className={styles.subtitle}>Traga o extrato do banco em vez de lançar linha por linha.</p>
      </div>

      <div className={styles.steps}>
        <span className={step === 'upload' ? styles.stepActive : undefined}>1. Enviar arquivo</span>
        <span>→</span>
        <span className={step === 'preview' ? styles.stepActive : undefined}>2. Revisar e confirmar</span>
      </div>

      {step === 'upload' && (
        <Card>
          <div className={styles.dropzone}>
            {previewMutation.isPending ? (
              <Skeleton width="60%" height="1.5rem" />
            ) : (
              <>
                <p>Selecione o formato do arquivo e escolha o extrato exportado do seu banco.</p>
                <div className={styles.formatRow}>
                  <Select
                    label="Formato"
                    options={FORMAT_OPTIONS}
                    value={formato}
                    onChange={(e) => setFormato(e.target.value as 'ofx' | 'csv-nubank')}
                  />
                </div>
                <Button onClick={() => fileInputRef.current?.click()}>Escolher arquivo</Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={formato === 'ofx' ? '.ofx' : '.csv'}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>
        </Card>
      )}

      {step === 'preview' && rows && (
        <>
          {rows.length === 0 ? (
            <EmptyState
              title="Nenhuma transação encontrada"
              description="O arquivo não tinha nenhuma linha reconhecível. Confirme se o formato selecionado bate com o do arquivo."
              actionLabel="Tentar outro arquivo"
              onAction={() => setRows(null)}
            />
          ) : (
            <>
              <div className={styles.summary}>
                <Badge tone="brand">{rows.length} encontradas</Badge>
                <Badge tone="positive">{includedCount} selecionadas</Badge>
                <Badge tone="warning">{rows.filter((r) => r.jaImportada).length} já importadas antes</Badge>
              </div>

              <Table caption="Prévia da importação">
                <thead>
                  <tr>
                    <th scope="col" aria-label="Incluir" />
                    <th scope="col">Data</th>
                    <th scope="col">Descrição</th>
                    <th scope="col">Categoria</th>
                    <th scope="col" style={{ textAlign: 'right' }}>
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.externalId}-${index}`} className={!row.include ? styles.rowExcluded : undefined}>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.include}
                          onChange={(e) => updateRow(index, { include: e.target.checked })}
                          aria-label={`Incluir ${row.descricao}`}
                        />
                      </td>
                      <td>{row.data}</td>
                      <td>
                        {row.descricao}
                        {row.jaImportada && (
                          <>
                            {' '}
                            <Badge tone="warning">já importada</Badge>
                          </>
                        )}
                      </td>
                      <td>
                        <select
                          className={styles.categorySelect}
                          value={row.categoriaSugerida}
                          onChange={(e) => updateRow(index, { categoriaSugerida: e.target.value })}
                          aria-label="Categoria"
                        >
                          {CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <TableNumericCell>
                        <MoneyFigure value={row.valor} sign={row.tipo === 'receita' ? 'positive' : 'negative'} size="sm" />
                      </TableNumericCell>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className={styles.actions}>
                <Button variant="secondary" onClick={() => setRows(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirm} disabled={confirmMutation.isPending || includedCount === 0}>
                  {confirmMutation.isPending ? 'Importando...' : `Confirmar importação (${includedCount})`}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
