import { startTransition, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './motion/hooks';
import { Header } from './sections/Header';
import { Rail } from './sections/Rail';
import { Hero } from './sections/Hero';
import { Problem } from './sections/Problem';
import { Platform } from './sections/Platform';
import { Method } from './sections/Method';
import { Agent } from './sections/Agent';
import { Demo } from './sections/Demo';
import { Connected } from './sections/Connected';
import { Insights } from './sections/Insights';
import { Goals } from './sections/Goals';
import { Control } from './sections/Control';
import { Trust } from './sections/Trust';
import { Closing } from './sections/Closing';
import { Footer } from './sections/Footer';
import { OrbitStage } from './scene/OrbitStage';
import s from './Landing.module.css';

// ============================================================================
// A landing da Moneta AI. A ordem abaixo É a narrativa:
//
//   hero        o que é, em cinco segundos: a peça da marca nasce atrás do painel
//   problema    dinheiro espalhado (a peça desfeita) virando um lugar só
//   plataforma  o painel inteiro, assentando sobre a peça deitada
//   método      Registrar -> Organizar -> Compreender -> Planejar -> Decidir
//   01 agente   a frase vira ação; a peça é o núcleo que entende
//      demo     o visitante registra, consulta e vê o painel recalcular
//   02 recursos tudo converge para o saldo (a peça como anel do núcleo)
//   03 análises média, categorias, cenários, impacto, saúde
//   04 metas    o objetivo como percurso desenhado pela rolagem
//   05 controle alertas, calendário, fixos, rachadinha, arquivos
//   confiança   o que é verificável, e o painel com a sua cara
//   fecho       a peça inteira, de frente, e a ação
//
// A peça 3D é uma só (OrbitStage): vive atrás do conteúdo e atraca no ponto
// focal de cada capítulo que a declara.
// ============================================================================
export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // A primeira dobra pinta sozinha; o resto da página entra numa transição
  // logo em seguida. Transições do React são fatiadas (cedem a vez ao
  // navegador a cada poucos ms), então montar as seções pesadas não trava a
  // thread principal -- e nada abaixo da dobra é visível nesse instante.
  const [rest, setRest] = useState(false);
  useEffect(() => {
    startTransition(() => setRest(true));
  }, []);

  // Entrou direto num endereço com âncora (/#demo): rola até lá quando a
  // seção existir e as fontes tiverem assentado (a troca de fonte muda a
  // altura dos títulos acima do alvo).
  useEffect(() => {
    if (!rest || !window.location.hash) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    let cancelled = false;
    const go = () => {
      if (cancelled) return;
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
    };
    go();
    document.fonts?.ready.then(() => requestAnimationFrame(go));
    return () => {
      cancelled = true;
    };
  }, [rest]);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Moneta AI: gestão financeira pessoal com inteligência artificial';
    return () => {
      document.title = prev;
    };
  }, []);

  // Um observador só para todo [data-reveal] da página. Revela uma vez e
  // para de observar; com movimento reduzido nem chega a esconder nada (ver
  // [data-motion] no CSS). Roda de novo quando o resto da página monta.
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
  }, [reduced, rest]);

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
      const fix = () => {
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        if (window.scrollY > 0 && Math.abs(target.getBoundingClientRect().top - margin) > 2) {
          target.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
        }
      };
      // Confere ao fim da rolagem e mais uma vez logo depois (seções que
      // acabaram de renderizar ainda podem ajustar a altura).
      const settle = () => {
        fix();
        setTimeout(fix, 350);
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

  // Luz que segue o cursor nos cartões marcados com data-glow. Um listener só;
  // escreve --gx/--gy no cartão sob o ponteiro, sem re-render.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest<HTMLElement>('[data-glow]');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--gx', `${(e.clientX - r.left).toFixed(0)}px`);
      card.style.setProperty('--gy', `${(e.clientY - r.top).toFixed(0)}px`);
    };
    root.addEventListener('pointermove', onMove, { passive: true });
    return () => root.removeEventListener('pointermove', onMove);
  }, [reduced]);

  return (
    <div ref={rootRef} className={`${s.root} landingRoot`} data-motion={reduced ? 'off' : 'on'}>
      <a className={s.skip} href="#conteudo">
        Pular para o conteúdo
      </a>
      <OrbitStage>
        <Header />
        <Rail />
        <main id="conteudo" className={s.main}>
          <Hero />
          {rest && (
            <>
              <Problem />
              <Platform />
              <Method />
              <Agent />
              <Demo />
              <Connected />
              <Insights />
              <Goals />
              <Control />
              <Trust />
              <Closing />
            </>
          )}
        </main>
        {rest && <Footer />}
      </OrbitStage>
    </div>
  );
}
