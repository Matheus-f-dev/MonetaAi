import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  MoneyFigure,
  Skeleton,
  Table,
  TableNumericCell
} from '../index';
import styles from './DesignSystemPage.module.css';

const COLORS: Array<{ name: string; token: string }> = [
  { name: 'Fundo', token: '--color-bg' },
  { name: 'Fundo elevado', token: '--color-bg-raised' },
  { name: 'Fundo rebaixado', token: '--color-bg-sunken' },
  { name: 'Tinta', token: '--color-ink' },
  { name: 'Tinta suave', token: '--color-ink-muted' },
  { name: 'Linha', token: '--color-line' },
  { name: 'Marca', token: '--color-brand' },
  { name: 'Marca suave', token: '--color-brand-soft' },
  { name: 'Destaque', token: '--color-accent' },
  { name: 'Destaque suave', token: '--color-accent-soft' },
  { name: 'Entrada', token: '--color-positive' },
  { name: 'Saída', token: '--color-negative' },
  { name: 'Atenção', token: '--color-warning' }
];

const TYPE_SCALE: Array<{ label: string; token: string; sample: string; display?: boolean }> = [
  { label: '--text-2xl', token: 'var(--text-2xl)', sample: 'Saldo do mês', display: true },
  { label: '--text-xl', token: 'var(--text-xl)', sample: 'Título de página', display: true },
  { label: '--text-lg', token: 'var(--text-lg)', sample: 'Título de seção', display: true },
  { label: '--text-md', token: 'var(--text-md)', sample: 'Subtítulo de card', display: true },
  { label: '--text-base', token: 'var(--text-base)', sample: 'Corpo de texto padrão do produto.' },
  { label: '--text-sm', token: 'var(--text-sm)', sample: 'Corpo denso, linha de tabela.' },
  { label: '--text-xs', token: 'var(--text-xs)', sample: 'Legenda, data, rótulo.' }
];

const SPACING = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-6', '--space-8', '--space-12'];

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {note && <p className={styles.sectionNote}>{note}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * Catálogo navegável dos tokens e componentes-base do redesign.
 * Montado só em desenvolvimento (ver a rota em App.jsx) -- serve de
 * referência viva durante as fases 1-9 e de checagem rápida de contraste
 * nos dois temas, sem precisar do Storybook e da manutenção que ele traz
 * pra um time de 6 pessoas num projeto de faculdade.
 */
export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className={`ds-scope ${styles.page}`}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Moneta · design system</p>
            <h1 className={styles.pageTitle}>Livro-razão</h1>
            <p className={styles.lede}>
              Tokens e componentes-base do app pós-login. Mesma direção da landing: papel quente,
              tinta quase preta, hairline estrutural, verde-esmeralda de marca e cobre reservado pra
              inteligência — e todo valor em reais em fonte monoespaçada com algarismos tabulares, o
              elemento que dá identidade ao produto inteiro.
            </p>
          </div>
        </header>

        <Section title="Cor" note="Mesmos nomes de token nos dois temas — nenhuma tela referencia hex direto.">
          <div className={styles.swatchGrid}>
            {COLORS.map((c) => (
              <div key={c.token} className={styles.swatch}>
                <div className={styles.swatchChip} style={{ background: `var(${c.token})` }} />
                <div className={styles.swatchMeta}>
                  <div className={styles.swatchName}>{c.name}</div>
                  <div className={styles.swatchVar}>{c.token}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Tipografia"
          note="Zilla Slab nos títulos, Hanken Grotesk no corpo, JetBrains Mono nos números. Três papéis, sem sobreposição -- mesma dupla de interface da landing (Instrument Sans/Instrument Serif), trocada pela que index.html já reserva pro painel."
        >
          <div>
            {TYPE_SCALE.map((t) => (
              <div key={t.label} className={styles.typeRow}>
                <span className={styles.typeLabel}>{t.label}</span>
                <span
                  className={t.display ? styles.sampleDisplay : styles.sampleBody}
                  style={{ fontSize: t.token }}
                >
                  {t.sample}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Figura monetária"
          note="O elemento assinatura. Nenhum valor em R$ deve ser formatado fora deste componente."
        >
          <div className={styles.grid2}>
            <Card perforated>
              <p className={styles.kpiLabel}>Saldo atual</p>
              <MoneyFigure value={4820.55} size="xl" sign="neutral" />
            </Card>
            <Card perforated>
              <p className={styles.kpiLabel}>Entradas do mês</p>
              <MoneyFigure value={7300} size="xl" />
            </Card>
            <Card perforated>
              <p className={styles.kpiLabel}>Saídas do mês</p>
              <MoneyFigure value={-2479.45} size="xl" />
            </Card>
          </div>
          <div className={styles.row}>
            <MoneyFigure value={1234.5} size="sm" showSign />
            <MoneyFigure value={-89.9} size="md" showSign />
            <MoneyFigure value={15000} size="lg" sign="neutral" />
          </div>
        </Section>

        <Section title="Botões">
          <div className={styles.row}>
            <Button>Salvar</Button>
            <Button variant="secondary">Cancelar</Button>
            <Button variant="ghost">Ver detalhes</Button>
            <Button variant="danger">Excluir conta</Button>
            <Button disabled>Indisponível</Button>
          </div>
          <div className={styles.row}>
            <Button size="sm">Pequeno</Button>
            <Button size="md">Médio</Button>
            <Button size="lg">Grande</Button>
          </div>
        </Section>

        <Section title="Selos de status">
          <div className={styles.row}>
            <Badge>Rascunho</Badge>
            <Badge tone="brand" withDot>Ativo</Badge>
            <Badge tone="positive" withDot>Dentro do orçamento</Badge>
            <Badge tone="negative" withDot>Estourado</Badge>
            <Badge tone="warning" withDot>Perto do limite</Badge>
          </div>
        </Section>

        <Section title="Campos">
          <div className={styles.grid2}>
            <Input
              label="Descrição"
              placeholder="Mercado, aluguel, Uber…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              hint="A categoria é sugerida automaticamente a partir da descrição."
            />
            <Input label="Valor" placeholder="0,00" inputMode="decimal" error="Informe um valor maior que zero." />
          </div>
        </Section>

        <Section title="Tabela" note="Valores sempre à direita, em algarismo tabular — alinham na coluna.">
          <Table caption="Transações recentes">
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Descrição</th>
                <th scope="col">Categoria</th>
                <th scope="col" style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>02/09</td>
                <td>Supermercado Verde</td>
                <td><Badge tone="neutral">Alimentação</Badge></td>
                <TableNumericCell><MoneyFigure value={-231.9} size="sm" /></TableNumericCell>
              </tr>
              <tr>
                <td>01/09</td>
                <td>Salário</td>
                <td><Badge tone="neutral">Renda</Badge></td>
                <TableNumericCell><MoneyFigure value={5200} size="sm" /></TableNumericCell>
              </tr>
              <tr>
                <td>31/08</td>
                <td>Assinatura streaming</td>
                <td><Badge tone="neutral">Lazer</Badge></td>
                <TableNumericCell><MoneyFigure value={-39.9} size="sm" /></TableNumericCell>
              </tr>
            </tbody>
          </Table>
        </Section>

        <Section
          title="Estados"
          note="Vazio e erro são caso central, não exceção — o primeiro acesso de quem acabou de se cadastrar é sempre o estado vazio."
        >
          <div className={styles.grid2}>
            <Card padding="none">
              <EmptyState
                title="Nenhuma transação ainda"
                description="Quando você registrar o primeiro gasto — aqui ou pelo WhatsApp — ele aparece nesta lista."
                actionLabel="Registrar gasto"
                onAction={() => setModalOpen(true)}
              />
            </Card>
            <Card padding="none">
              <EmptyState
                tone="error"
                title="Não foi possível carregar suas transações"
                description="A conexão com o servidor falhou. Seus dados estão salvos — é só tentar de novo."
                actionLabel="Tentar de novo"
                onAction={() => undefined}
              />
            </Card>
          </div>
          <Card>
            <div className={styles.stack}>
              <Skeleton width="40%" height="0.75rem" />
              <Skeleton width="65%" height="2rem" />
              <Skeleton height="0.75rem" />
              <Skeleton width="80%" height="0.75rem" />
            </div>
          </Card>
        </Section>

        <Section title="Modal" note="Foco preso, Esc fecha, foco volta pro botão de origem.">
          <Button onClick={() => setModalOpen(true)}>Abrir modal</Button>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova transação">
            <div className={styles.stack}>
              <Input label="Descrição" placeholder="Mercado, aluguel, Uber…" />
              <Input label="Valor" placeholder="0,00" inputMode="decimal" />
              <div className={styles.row}>
                <Button onClick={() => setModalOpen(false)}>Salvar</Button>
                <Button variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Modal>
        </Section>

        <Section title="Espaçamento" note="Escala de 4px. Nenhum valor solto em px nas telas.">
          <div className={styles.scaleList}>
            {SPACING.map((s) => (
              <div key={s} className={styles.scaleItem}>
                <div className={styles.scaleBox} style={{ width: `var(${s})`, height: `var(${s})` }} />
                {s.replace('--space-', '')}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
