import { useEffect, useState } from 'react';
import { MonetaMark } from './Glyphs';
import { CtaEnter, CtaHeader } from './Ctas';
import { NAV } from './content';

// O cabeçalho fica transparente sobre o primeiro capítulo do filme e ganha
// fundo quando o visitante passa da primeira tela.
function useSolidOnScroll(threshold = 80) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const read = () => setSolid((window.scrollY || window.pageYOffset) > threshold);
    read();
    window.addEventListener('scroll', read, { passive: true });
    return () => window.removeEventListener('scroll', read);
  }, [threshold]);

  return solid;
}

export default function SiteHeader({ onNavigate }) {
  const solid = useSolidOnScroll();
  const [open, setOpen] = useState(false);

  // Trava o scroll do body enquanto o painel mobile está aberto.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Esc fecha o painel.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`masthead${solid ? ' is-solid' : ''}`}>
      <div className="masthead__inner">
        <a className="masthead__brand" href="/" aria-label="Moneta, página inicial">
          <MonetaMark size={30} className="masthead__mark" />
          <span className="masthead__wordmark">Moneta</span>
        </a>

        <nav className="masthead__nav" aria-label="Seções">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="masthead__link">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="masthead__ctas">
          <CtaEnter onNavigate={onNavigate} />
          <CtaHeader onNavigate={onNavigate} />
        </div>

        <button
          className="masthead__burger"
          type="button"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="masthead-panel"
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      <div id="masthead-panel" className="masthead__panel" hidden={!open}>
        <nav aria-label="Seções, menu compacto">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="masthead__panel-ctas">
          <CtaEnter onNavigate={onNavigate} />
          <CtaHeader onNavigate={onNavigate} />
        </div>
      </div>
    </header>
  );
}
