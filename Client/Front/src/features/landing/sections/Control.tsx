import type { CSSProperties } from 'react';
import { DemoTag, SectionHead } from '../components/ui';
import { Glyph } from '../components/glyphs';
import { CONTROL } from '../data/content';
import { BUDGETS, CALENDAR, RECURRING, SPLIT, UPCOMING } from '../data/demo';
import { brl, signedBrl } from '../lib/format';
import s from '../Landing.module.css';
import c from './Control.module.css';

const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const food = BUDGETS.find((b) => b.category === 'Alimentação')!;
const ALERT_LIMIT = 650;

function monthCells() {
  const first = new Date(CALENDAR.year, CALENDAR.month, 1).getDay();
  const days = new Date(CALENDAR.year, CALENDAR.month + 1, 0).getDate();
  return [...Array<null>(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
}

export function Control() {
  const cells = monthCells();
  const dueSet = new Set<number>(CALENDAR.due);
  const paidSet = new Set<number>(CALENDAR.paid);

  return (
    <section id="controle" className={`${s.section} ${s.lazyRender} ${c.control}`} aria-labelledby="controle-title">
      <div className={s.wrap}>
        <div className={c.top}>
          <SectionHead
            id="controle-title"
            eyebrow={CONTROL.eyebrow}
            title={CONTROL.title}
            accent={CONTROL.accent}
            className={c.head}
          />
          <p className={`${s.lead} ${c.lead}`} data-reveal style={{ '--d': '200ms' } as CSSProperties}>
            {CONTROL.lead}
          </p>
        </div>

        <DemoTag className={c.tag} />
        <div className={c.bento}>
          {/* Alerta */}
          <article data-glow className={`${c.card} ${c.alert}`} data-reveal>
            <div className={c.cardHead}>
              <Glyph name="bell" width={18} height={18} />
              <h3>Alertas por categoria</h3>
            </div>
            <div className={c.notice}>
              <span className={c.noticeIcon}>
                <Glyph name="bell" width={16} height={16} />
              </span>
              <div>
                <strong>Alimentação passou de {brl(ALERT_LIMIT)}</strong>
                <span>
                  Gasto no mês: {brl(food.spent)} · orçamento de {brl(food.limit)}
                </span>
              </div>
              <span className={c.noticeTime}>agora</span>
            </div>
            <div className={c.channels}>
              <span>
                <Glyph name="check" width={14} height={14} /> No app
              </span>
              <span>
                <Glyph name="check" width={14} height={14} /> Por e-mail
              </span>
            </div>
          </article>

          {/* Calendário */}
          <article data-glow className={`${c.card} ${c.calendar}`} data-reveal style={{ '--d': '100ms' } as CSSProperties}>
            <div className={c.cardHead}>
              <Glyph name="calendar" width={18} height={18} />
              <h3>Calendário de contas</h3>
              <span className={c.month}>outubro 2026</span>
            </div>
            <div className={c.calBody}>
              <div className={c.calGrid} aria-hidden="true">
                {WEEK.map((w, i) => (
                  <span key={`w${i}`} className={c.week}>
                    {w}
                  </span>
                ))}
                {cells.map((d, i) =>
                  d === null ? (
                    <span key={`e${i}`} />
                  ) : (
                    <span
                      key={d}
                      className={c.day}
                      data-today={d === CALENDAR.today}
                      data-due={dueSet.has(d)}
                      data-paid={paidSet.has(d)}
                      data-past={d < CALENDAR.today}
                    >
                      {d}
                    </span>
                  )
                )}
                <div className={c.legend}>
                  <span data-k="today">hoje</span>
                  <span data-k="due">a vencer</span>
                  <span data-k="paid">lançado</span>
                </div>
              </div>
              <ul className={c.dueList}>
                {UPCOMING.map((u) => (
                  <li key={u.name}>
                    <span className={c.dueDay}>{u.day}</span>
                    <span>{u.name}</span>
                    <span className={s.num}>{brl(u.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* Recorrentes */}
          <article data-glow className={`${c.card} ${c.recurring}`} data-reveal style={{ '--d': '80ms' } as CSSProperties}>
            <div className={c.cardHead}>
              <Glyph name="repeat" width={18} height={18} />
              <h3>Gastos e receitas fixos</h3>
            </div>
            <ul className={c.rows}>
              {RECURRING.map((r) => (
                <li key={r.name}>
                  <span>
                    {r.name}
                    <em>todo dia {r.day}</em>
                  </span>
                  <span className={`${s.num} ${r.value > 0 ? c.mint : ''}`}>{signedBrl(r.value)}</span>
                  <span className={c.status} data-pending={r.status === 'Lançar'}>
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          </article>

          {/* Rachadinha */}
          <article data-glow className={`${c.card} ${c.split}`} data-reveal style={{ '--d': '160ms' } as CSSProperties}>
            <div className={c.cardHead}>
              <Glyph name="people" width={18} height={18} />
              <h3>Rachadinha</h3>
            </div>
            <div className={c.splitTop}>
              <strong>{SPLIT.title}</strong>
              <span className={s.num}>
                {brl(SPLIT.total)} ÷ {SPLIT.people.length + 1}
              </span>
            </div>
            <ul className={c.people}>
              {SPLIT.people.map((p) => (
                <li key={p.name} data-paid={p.paid}>
                  <span className={c.avatar}>{p.name[0]}</span>
                  <span>{p.name}</span>
                  <span className={s.num}>{brl(SPLIT.each)}</span>
                  <span className={c.paid}>{p.paid ? 'pagou' : 'falta'}</span>
                </li>
              ))}
            </ul>
          </article>

          {/* Relatórios e importação */}
          <article data-glow className={`${c.card} ${c.files}`} data-reveal style={{ '--d': '240ms' } as CSSProperties}>
            <div className={c.cardHead}>
              <Glyph name="chart" width={18} height={18} />
              <h3>Relatórios e extratos</h3>
            </div>
            <span className={c.fileLabel}>Exportar o mês</span>
            <div className={c.formats}>
              <span>CSV</span>
              <span>PDF</span>
              <span>Excel</span>
            </div>
            <span className={c.fileLabel}>Importar extrato do banco</span>
            <div className={c.drop}>
              <Glyph name="upload" width={16} height={16} />
              <span>Arquivo OFX ou CSV</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
