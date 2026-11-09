import { useState, type CSSProperties } from 'react';
import { DemoTag, SectionHead } from '../components/ui';
import { Glyph } from '../components/glyphs';
import { TRUST } from '../data/content';
import { BALANCE_BEFORE } from '../data/demo';
import { brl } from '../lib/format';
import s from '../Landing.module.css';
import t from './Trust.module.css';

const ICONS = ['google', 'lock', 'shield', 'moon', 'user'];

type Theme = 'escuro' | 'claro';
// Cores de destaque oferecidas aqui são ilustrativas da preferência que
// existe no Perfil (useBrandColor), não a paleta exata do produto.
const ACCENTS = [
  { id: 'menta', color: '#74E8AE' },
  { id: 'azul', color: '#7DB4FF' },
  { id: 'âmbar', color: '#F2C66D' },
  { id: 'rosa', color: '#F59BC0' },
];

export function Trust() {
  const [theme, setTheme] = useState<Theme>('escuro');
  const [accent, setAccent] = useState(ACCENTS[0]);

  return (
    <section id="seguranca" className={`${s.section} ${s.lazyRender} ${t.trust}`} aria-labelledby="seguranca-title">
      <div className={`${s.wrap} ${t.layout}`}>
        <div className={t.copy}>
          <SectionHead
            id="seguranca-title"
            eyebrow={TRUST.eyebrow}
            title={TRUST.title}
            accent={TRUST.accent}
            lead={TRUST.lead}
          />
          <ol className={t.items}>
            {TRUST.items.map((item, i) => (
              <li key={item.title} className={t.item} data-reveal style={{ '--d': `${i * 70}ms` } as CSSProperties}>
                <span className={t.itemIcon}>
                  <Glyph name={ICONS[i]} width={18} height={18} />
                </span>
                <div>
                  <h3 className={t.itemTitle}>{item.title}</h3>
                  <p className={t.itemBody}>{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className={t.side} data-reveal="scale">
          <div className={t.prefs} data-glow>
            <DemoTag text="Prévia interativa" className={t.tag} />
            <div className={t.prefsHead}>
              <span className={t.avatar} style={{ '--a': accent.color } as CSSProperties}>
                B
              </span>
              <div>
                <strong>Bia Souza</strong>
                <span>Perfil · Aparência</span>
              </div>
            </div>

            <fieldset className={t.group}>
              <legend>Tema</legend>
              <div className={t.segment}>
                {(['escuro', 'claro'] as Theme[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={theme === opt}
                    className={t.segBtn}
                    onClick={() => setTheme(opt)}
                  >
                    {opt === 'escuro' ? 'Escuro' : 'Claro'}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className={t.group}>
              <legend>Cor de destaque</legend>
              <div className={t.swatches}>
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={t.swatch}
                    style={{ '--c': a.color } as CSSProperties}
                    aria-pressed={accent.id === a.id}
                    aria-label={`Destaque ${a.id}`}
                    onClick={() => setAccent(a)}
                  />
                ))}
              </div>
            </fieldset>

            <div className={t.preview} data-theme={theme} style={{ '--a': accent.color } as CSSProperties} aria-hidden="true">
              <div className={t.previewTop}>
                <span>Saldo disponível</span>
                <span className={t.previewChip}>outubro</span>
              </div>
              <strong className={t.previewValue}>{brl(BALANCE_BEFORE)}</strong>
              <div className={t.previewBars}>
                {[42, 64, 52, 78, 60, 88].map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }} data-last={i === 5} />
                ))}
              </div>
            </div>
            <p className={t.prefsNote}>Experimente: a prévia muda como no seu perfil.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
