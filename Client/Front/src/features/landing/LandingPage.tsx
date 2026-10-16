import { useEffect, useRef } from 'react';
import { useReducedMotion } from './motion/hooks';
import { Header } from './sections/Header';
import { Rail } from './sections/Rail';
import { Hero } from './sections/Hero';
import { Problem } from './sections/Problem';
import { Platform } from './sections/Platform';
import { Agent } from './sections/Agent';
import { Connected } from './sections/Connected';
import { Insights } from './sections/Insights';
import { Goals } from './sections/Goals';
import { Control } from './sections/Control';
import { Trust } from './sections/Trust';
import { Closing } from './sections/Closing';
import { Footer } from './sections/Footer';
import s from './Landing.module.css';

// ============================================================================
// A landing da Moneta AI. A ordem abaixo É a narrativa:
//
//   hero        o que é, em cinco segundos, com a peça da marca e o produto
//   problema    dinheiro espalhado se organizando num lugar só
//   plataforma  o painel inteiro, assentando na tela
//   agente      a conversa que executa, e o painel reagindo
//   conectado   cada módulo ligado ao saldo
//   análises    além do saldo: média, categorias, cenários, impacto, saúde
//   metas       o objetivo como percurso desenhado pela rolagem
//   controle    alertas, calendário, fixos, rachadinha, arquivos
//   confiança   o que é verificável, e o painel com a sua cara
//   fecho       a peça da marca de novo, e a ação
// ============================================================================
export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const prev = document.title;
    document.title = 'Moneta AI: gestão financeira pessoal com inteligência artificial';
    return () => {
      document.title = prev;
    };
  }, []);

  // Um observador só para todo [data-reveal] da página. Revela uma vez e
  // para de observar; com movimento reduzido nem chega a esconder nada (ver
  // [data-motion] no CSS).
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-shown', '');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    root.querySelectorAll('[data-reveal]:not([data-shown])').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reduced]);

  // Links internos (#secao). As seções com content-visibility só ganham a
  // altura real quando renderizam, então uma rolagem longa pode pousar fora
  // do alvo: ao fim dela, confere e corrige. Também leva o foco para a seção,
  // para quem navega por teclado ou leitor de tela continuar dali.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const id = link?.getAttribute('href')?.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      history.pushState(null, '', `#${id}`);
      const settle = () => {
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        if (window.scrollY > 0 && Math.abs(target.getBoundingClientRect().top - margin) > 4) {
          target.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      };
      const hasScrollEnd = 'onscrollend' in document.documentElement;
      if (hasScrollEnd) window.addEventListener('scrollend', settle, { once: true });
      else setTimeout(settle, 1000);
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [reduced]);

  return (
    <div ref={rootRef} className={`${s.root} landingRoot`} data-motion={reduced ? 'off' : 'on'}>
      <a className={s.skip} href="#conteudo">
        Pular para o conteúdo
      </a>
      <Header />
      <Rail />
      <main id="conteudo">
        <Hero />
        <Problem />
        <Platform />
        <Agent />
        <Connected />
        <Insights />
        <Goals />
        <Control />
        <Trust />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}
