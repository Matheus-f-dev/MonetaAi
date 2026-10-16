import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { onScrollFrame } from '../motion/scroll';
import { BrandMark, ROUTES, RouteCta } from '../components/ui';
import { NAV } from '../data/content';
import s from '../Landing.module.css';
import h from './Header.module.css';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => onScrollFrame(() => setScrolled(window.scrollY > 24)), []);

  // Menu mobile: Esc fecha e devolve o foco ao botão; rolagem do fundo trava.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className={h.header} data-scrolled={scrolled || open} data-open={open}>
      <div className={`${s.wrap} ${h.bar}`}>
        <a href="#topo" className={h.brand} aria-label="Moneta AI, voltar ao início">
          <BrandMark size={30} />
          <span className={h.wordmark}>
            Moneta<span> AI</span>
          </span>
        </a>

        <nav className={h.nav} aria-label="Seções da página">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={h.navLink}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className={h.actions}>
          <Link to={ROUTES.signin} className={h.signin}>
            Entrar
          </Link>
          <RouteCta to={ROUTES.signup} small className={h.cta}>
            Começar grátis
          </RouteCta>
          <button
            ref={toggleRef}
            type="button"
            className={h.toggle}
            aria-expanded={open}
            aria-controls="mn-menu"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div id="mn-menu" ref={menuRef} className={h.menu} hidden={!open}>
        <nav aria-label="Menu" className={h.menuNav}>
          {NAV.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              className={h.menuLink}
              style={{ transitionDelay: `${60 + i * 40}ms` }}
              onClick={() => setOpen(false)}
            >
              <span className={h.menuIndex}>{String(i + 1).padStart(2, '0')}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div className={h.menuActions}>
          <RouteCta to={ROUTES.signup} arrow>
            Começar gratuitamente
          </RouteCta>
          <RouteCta to={ROUTES.signin} variant="ghost">
            Entrar na minha conta
          </RouteCta>
        </div>
      </div>
    </header>
  );
}
