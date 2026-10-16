import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { onScrollFrame } from './scroll';
import { clamp01 } from '../lib/format';

// ---------------------------------------------------------------------------
// Movimento reduzido. Lido de forma síncrona já no primeiro render, para a
// página nunca nascer escondida e depois "aparecer" em quem pediu menos
// movimento.
// ---------------------------------------------------------------------------
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false
  );
}

// ---------------------------------------------------------------------------
// Progresso de rolagem de um elemento, escrito direto como variável CSS
// (sem re-render do React a cada quadro).
//
//   sticky   0 quando o topo do elemento encosta no topo da tela, 1 quando o
//            fim dele chega no fim da tela. Para palcos com position:sticky.
//   enter    0 quando o topo entra por baixo da tela, 1 quando ele chega a
//            35% da altura da tela. Para "assentar" algo ao entrar.
//   through  0 quando o topo entra por baixo, 1 quando o fim sai por cima.
// ---------------------------------------------------------------------------
export type ScrollMode = 'sticky' | 'enter' | 'through';

export function measureProgress(el: Element, mode: ScrollMode): number {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  if (mode === 'sticky') {
    const total = r.height - vh;
    return total > 0 ? clamp01(-r.top / total) : r.top < 0 ? 1 : 0;
  }
  if (mode === 'enter') return clamp01((vh - r.top) / (vh * 0.65));
  return clamp01((vh - r.top) / (vh + r.height));
}

interface ScrollProgressOptions {
  mode: ScrollMode;
  enabled?: boolean;
  /** Recebe o progresso cru (0-1) e devolve as variáveis CSS a escrever. */
  vars?: (p: number) => Record<string, number>;
  /** Para o caso raro em que o JS precisa do número (ex.: um contador). */
  onProgress?: (p: number) => void;
}

export function useScrollProgress(ref: RefObject<HTMLElement | null>, opts: ScrollProgressOptions) {
  const { mode, enabled = true, vars, onProgress } = opts;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let last = -1;
    return onScrollFrame(() => {
      const p = measureProgress(el, mode);
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      const out = vars ? vars(p) : { '--p': p };
      for (const key in out) el.style.setProperty(key, out[key].toFixed(4));
      onProgress?.(p);
    });
    // vars/onProgress são funções estáveis por convenção (definidas fora do
    // componente ou memorizadas) -- não entram nas dependências de propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, mode, enabled]);
}

// ---------------------------------------------------------------------------
// "Já apareceu na tela?" -- para disparar gráficos e a conversa do agente uma
// vez só, quando o visitante chega neles.
// ---------------------------------------------------------------------------
export function useInView(ref: RefObject<Element | null>, opts: { once?: boolean; threshold?: number; rootMargin?: string } = {}) {
  const { once = true, threshold = 0.25, rootMargin = '0px' } = opts;
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, threshold, rootMargin]);
  return inView;
}

// ---------------------------------------------------------------------------
// Número que conta até o valor quando `run` vira true. Com movimento
// reduzido, entrega o valor final direto.
// ---------------------------------------------------------------------------
export function useCountUp(target: number, run: boolean, duration = 1400): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = clamp01((now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * e);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration, reduced]);
  return value;
}

/** Transição suave entre dois valores sempre que `target` muda. */
export function useTween(target: number, duration = 900): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    if (reduced) {
      current.current = target;
      setValue(target);
      return;
    }
    let raf = 0;
    const from = current.current;
    const start = performance.now();
    const tick = (now: number) => {
      const t = clamp01((now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      current.current = from + (target - from) * e;
      setValue(current.current);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);
  return value;
}

/** Ponteiro fino (mouse/trackpad) e tela larga: onde parallax por cursor faz sentido. */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setFine(mq.matches);
    const cb = () => setFine(mq.matches);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  }, []);
  return fine;
}
