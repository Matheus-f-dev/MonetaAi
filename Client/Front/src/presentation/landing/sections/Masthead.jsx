import { useEffect, useRef, useState } from 'react';
import { Mark } from '../ui/Icon';
import { Button } from '../ui/Primitives';
import { NAV, CTA, ROUTES } from '../data/copy';

// Cabeçalho. Cinco links, dois botões e a marca. Nada mais: navbar de produto
// financeiro não é painel de controle.
//
// Estados: transparente sobre o hero, com fundo e hairline depois que o
// visitante passa da primeira tela. A seção corrente fica marcada, para o
// visitante saber onde está numa página longa.
export default function Masthead({ onNavigate }) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const panelRef = useRef(null);
  const burgerRef = useRef(null);

  useEffect(() => {
    const read = () => setSolid(window.scrollY > 24);
    read();
    window.addEventListener('scroll', read, { passive: true });
    return () => window.removeEventListener('scroll', read);
  }, []);

  // Marca a seção visível. Um observer só, com as âncoras da navbar.
  useEffect(() => {
    const ids = NAV.map((n) => n.href.slice(1));
    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!nodes.length || typeof IntersectionObserver === 'undefined') return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setCurrent(`#${visible.target.id}`);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.2, 0.6] }
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  // Painel mobile: trava o scroll, fecha no Esc e devolve o foco ao botão.
  useEffect(() => {
    if (!open) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);

    const first = panelRef.current?.querySelector('a, button');
    first?.focus();

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Fecha ao passar de 900px com o painel aberto.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    const close = () => { if (mq.matches) setOpen(false); };
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, []);

  return (
    <header className={`mn-mast${solid ? ' is-solid' : ''}${open ? ' is-open' : ''}`}>
      <div className="mn-mast__in mn-page mn-page--wide">
        <a className="mn-mast__brand" href="/" aria-label={`MonetaAI, página inicial`}>
          <Mark size={26} className="mn-mast__mark" />
          <span className="mn-mast__word">
            Moneta<span className="mn-mast__ai">AI</span>
          </span>
        </a>

        <nav className="mn-mast__nav" aria-label="Seções da página">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`mn-mast__link${current === item.href ? ' is-current' : ''}`}
              aria-current={current === item.href ? 'true' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mn-mast__acts">
          <Button variant="text" size="sm" onClick={() => onNavigate(ROUTES.signin)}>
            {CTA.signin}
          </Button>
          <Button variant="solid" size="sm" onClick={() => onNavigate(ROUTES.signup)}>
            {CTA.primary}
          </Button>
        </div>

        <button
          ref={burgerRef}
          type="button"
          className="mn-burger"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="mn-mast-panel"
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      <div
        id="mn-mast-panel"
        ref={panelRef}
        className="mn-mast__panel"
        hidden={!open}
      >
        <nav aria-label="Seções da página, menu compacto">
          {NAV.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{ '--i': i }}
            >
              <span className="mn-mono mn-mast__panel-n">{String(i + 1).padStart(2, '0')}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mn-mast__panel-acts">
          <Button
            variant="solid"
            size="lg"
            onClick={() => { setOpen(false); onNavigate(ROUTES.signup); }}
          >
            {CTA.primary}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => { setOpen(false); onNavigate(ROUTES.signin); }}
          >
            {CTA.signin}
          </Button>
        </div>
      </div>

      {open ? (
        <button
          type="button"
          className="mn-mast__scrim"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </header>
  );
}
