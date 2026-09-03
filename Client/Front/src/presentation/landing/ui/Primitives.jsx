import Icon from './Icon';
import { useReveal } from '../lib/hooks';

// ---------------------------------------------------------------------------
// Botão. Três variantes e nada mais: sólido (a ação), contornado (a alternativa
// séria) e texto (a navegação lateral). Uma landing com sete estilos de botão
// não tem hierarquia nenhuma.
// ---------------------------------------------------------------------------
export function Button({
  as = 'button',
  variant = 'solid',
  size = 'md',
  icon,
  iconAfter = true,
  className = '',
  children,
  ...rest
}) {
  const Tag = as;
  const cls = ['mn-btn', `mn-btn--${variant}`, `mn-btn--${size}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={cls} {...rest}>
      {icon && !iconAfter ? <Icon name={icon} size={size === 'lg' ? 19 : 17} className="mn-btn__i" /> : null}
      <span className="mn-btn__label">{children}</span>
      {icon && iconAfter ? <Icon name={icon} size={size === 'lg' ? 19 : 17} className="mn-btn__i" /> : null}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Cabeçalho de seção. O número em mono à esquerda é o fio condutor editorial
// que costura a página inteira; sem ele, cada seção seria uma ilha.
// ---------------------------------------------------------------------------
export function SectionHead({
  index,
  eyebrow,
  title,
  titleAccent,
  lead,
  align = 'left',
  children,
}) {
  const ref = useReveal();

  return (
    <header ref={ref} className={`mn-head mn-head--${align} mn-rev`}>
      {(index || eyebrow) && (
        <p className="mn-head__meta mn-mono">
          {index ? <span className="mn-head__idx">{index}</span> : null}
          {eyebrow}
        </p>
      )}
      <h2 className="mn-h2 mn-head__title">
        {title}
        {titleAccent ? (
          <>
            {' '}
            <span className="mn-serif mn-head__accent">{titleAccent}</span>
          </>
        ) : null}
      </h2>
      {lead ? <p className="mn-lead mn-head__lead">{lead}</p> : null}
      {children}
    </header>
  );
}

// ---------------------------------------------------------------------------
// Revelação no scroll. Envelope fino em volta do hook para o JSX das seções
// não ficar cheio de ref.
// ---------------------------------------------------------------------------
export function Reveal({ as = 'div', delay = 0, className = '', children, ...rest }) {
  const Tag = as;
  const ref = useReveal();
  return (
    <Tag
      ref={ref}
      className={`mn-rev ${className}`.trim()}
      style={delay ? { '--rev-delay': `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Selo. Duas intenções: marca e inteligência. A de IA é a única coisa na
// página que usa cobre por padrão, e é assim que ela se destaca sem gritar.
// ---------------------------------------------------------------------------
export function Badge({ tone = 'brand', icon, children }) {
  return (
    <span className={`mn-badge mn-badge--${tone}`}>
      {icon ? <Icon name={icon} size={13} className="mn-badge__i" /> : null}
      <span className="mn-mono mn-badge__t">{children}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Delta. Direção é dado, então ela nunca é só cor: vem com sinal e com seta.
// `positiveIsGood` existe porque despesa subindo não é uma boa notícia.
// ---------------------------------------------------------------------------
export function Delta({ value, suffix = '', positiveIsGood = true, label }) {
  const up = value >= 0;
  const good = up === positiveIsGood;
  const shown = `${up ? '+' : '-'}${Math.abs(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}${suffix}`;

  return (
    <span className={`mn-delta ${good ? 'is-good' : 'is-bad'}`}>
      <svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true" focusable="false">
        <path
          d={up ? 'M5 1.5 9 8.5H1Z' : 'M5 8.5 1 1.5h8Z'}
          fill="currentColor"
        />
      </svg>
      <span className="mn-num">{shown}</span>
      {label ? <span className="mn-delta__label">{label}</span> : null}
    </span>
  );
}
