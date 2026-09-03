import { brl, pct } from '../lib/format';
import Icon from '../ui/Icon';

// Medidor de orçamento por categoria.
//
// O preenchimento carrega a severidade (marca -> atenção -> estouro) e a
// trilha é um passo mais claro da MESMA rampa, para o estado se ler ao longo
// da barra inteira. Como a cor está significando estado, ela vem sempre
// acompanhada de ícone e rótulo: cor sozinha nunca decide nada aqui.
const TONE = {
  ok:   { fill: 'var(--brand-mark)', track: 'var(--brand-tint-2)', word: 'dentro do limite', icon: 'check' },
  near: { fill: 'var(--warn)',       track: 'var(--warn-tint)',    word: 'perto do limite',  icon: 'bell' },
  over: { fill: 'var(--neg)',        track: 'var(--neg-tint)',     word: 'acima do limite',  icon: 'bell' },
};

export function Meter({ label, spent, limit, state = 'ok', showWord = true }) {
  const tone = TONE[state] ?? TONE.ok;
  const ratio = limit > 0 ? spent / limit : 0;
  const filled = Math.min(100, ratio * 100);

  return (
    <div className="mn-meter">
      <div className="mn-meter__top">
        <span className="mn-meter__label">{label}</span>
        <span className="mn-meter__nums mn-num">
          {brl(spent)}
          <span className="mn-meter__of"> / {brl(limit)}</span>
        </span>
      </div>

      <div
        className="mn-meter__track"
        style={{ background: tone.track }}
        role="meter"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${pct(ratio * 100)} de ${brl(limit)}, ${tone.word}`}
      >
        <span
          className="mn-meter__fill"
          style={{ width: `${filled}%`, background: tone.fill }}
        />
      </div>

      {showWord ? (
        <p className={`mn-meter__state is-${state}`}>
          <Icon name={tone.icon} size={13} />
          <span className="mn-num">{pct(ratio * 100)}</span>
          <span>{tone.word}</span>
        </p>
      ) : null}
    </div>
  );
}

// Progresso de meta. Mesma mecânica, texto diferente: aqui subir é bom.
export function GoalMeter({ label, saved, target, monthly }) {
  const ratio = target > 0 ? saved / target : 0;
  const monthsLeft = monthly > 0 ? Math.ceil((target - saved) / monthly) : null;

  return (
    <div className="mn-meter mn-meter--goal">
      <div className="mn-meter__top">
        <span className="mn-meter__label">{label}</span>
        <span className="mn-meter__nums mn-num">{pct(ratio * 100)}</span>
      </div>

      <div
        className="mn-meter__track"
        style={{ background: 'var(--brand-tint-2)' }}
        role="meter"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${brl(saved)} de ${brl(target)}`}
      >
        <span
          className="mn-meter__fill"
          style={{ width: `${Math.min(100, ratio * 100)}%`, background: 'var(--brand-mark)' }}
        />
      </div>

      <p className="mn-meter__state">
        <span className="mn-num">{brl(saved)}</span>
        <span>de {brl(target)}</span>
        {monthsLeft ? <span className="mn-meter__eta">faltam {monthsLeft} meses no ritmo atual</span> : null}
      </p>
    </div>
  );
}
