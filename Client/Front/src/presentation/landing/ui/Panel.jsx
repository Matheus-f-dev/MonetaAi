import { PERIOD } from '../data/demo';

// Superfície de produto. É o mesmo objeto no hero e na seção do painel, então
// vive aqui: duas superfícies de produto com cromo diferente na mesma página
// destruiriam a ilusão de estarmos vendo o mesmo software.

export function Panel({ path = 'monetaai.site/app', period = PERIOD, children, className = '', tone }) {
  return (
    <div className={`mn-panel${tone ? ` mn-panel--${tone}` : ''} ${className}`.trim()}>
      <div className="mn-panel__chrome">
        <span className="mn-panel__dots" aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className="mn-panel__path mn-mono">{path}</span>
        <span className="mn-panel__period mn-mono">{period}</span>
      </div>
      {children}
    </div>
  );
}

export function PanelRow({ label, className = '', children, tone }) {
  return (
    <div className={`mn-prow${tone ? ` mn-prow--${tone}` : ''} ${className}`.trim()}>
      {label ? <p className="mn-mono mn-prow__label">{label}</p> : null}
      {children}
    </div>
  );
}
