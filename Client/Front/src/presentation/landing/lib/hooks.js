import { useCallback, useEffect, useRef, useState } from 'react';

/** Uma pergunta só ao browser: o visitante pediu menos movimento? */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia?.(query).matches ?? false
  );

  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [query]);

  return matches;
}

// Um observer só para a página inteira, em vez de um por elemento. Com ~60
// elementos revelados isso é a diferença entre 1 e 60 observers ativos
// durante todo o scroll.
const registry = new WeakMap();
let sharedObserver = null;

function observer() {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        registry.get(entry.target)?.();
        sharedObserver.unobserve(entry.target);
        registry.delete(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
  );
  return sharedObserver;
}

/**
 * Marca o elemento como revelado quando ele entra na viewport, uma vez só.
 * `onEnter` é opcional e serve para disparar contagem de número ou desenho de
 * gráfico no mesmo momento em que a seção aparece.
 */
export function useReveal(onEnter) {
  const ref = useRef(null);
  const callback = useRef(onEnter);
  callback.current = onEnter;

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-in');
      callback.current?.();
      return undefined;
    }

    const fire = () => callback.current?.();
    registry.set(node, fire);
    observer().observe(node);

    return () => {
      sharedObserver?.unobserve(node);
      registry.delete(node);
    };
  }, []);

  return ref;
}

/**
 * Conta de 0 até `target` com easing, mas só depois de `start`. Sob
 * prefers-reduced-motion entrega o valor final direto: um número que salta
 * não é informação, é enfeite.
 */
export function useCountUp(target, start, duration = 900) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  const frame = useRef(0);

  useEffect(() => {
    if (!start) return undefined;
    if (prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }

    let t0 = null;
    const tick = (now) => {
      if (t0 === null) t0 = now;
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, start, duration]);

  return value;
}

/**
 * Lista com navegação por setas e um único tab stop (roving tabindex), do
 * jeito que o padrão ARIA de tablist pede.
 */
export function useRovingTabs(count, active, setActive) {
  const refs = useRef([]);

  const onKeyDown = useCallback(
    (event) => {
      const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let next = null;

      if (event.key in map) next = (active + map[event.key] + count) % count;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = count - 1;
      if (next === null) return;

      event.preventDefault();
      setActive(next);
      refs.current[next]?.focus();
    },
    [active, count, setActive]
  );

  const register = useCallback((index) => (node) => {
    refs.current[index] = node;
  }, []);

  return { onKeyDown, register };
}
