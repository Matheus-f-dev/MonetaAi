import { useEffect, useId, useRef, useState } from 'react';
import { onScrollFrame } from '../motion/scroll';
import { useReducedMotion } from '../motion/hooks';
import { clamp01 } from '../lib/format';
import type { SculptureHandle, SculptureQuality, SculptureVariant } from './sculptureScene';
import styles from './BrandSculpture.module.css';

interface Props {
  variant: SculptureVariant;
  className?: string;
}

type Mode = 'poster' | 'live' | 'fallback';

/** WebGL2 disponível e o aparelho não pediu economia? Senão, fica no pôster SVG. */
function detectQuality(): SculptureQuality | null {
  try {
    const probe = document.createElement('canvas');
    if (!probe.getContext('webgl2')) return null;
  } catch {
    return null;
  }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return null;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  if (cores <= 2 || memory <= 2) return null;
  const small = window.matchMedia('(max-width: 760px)').matches;
  return small || cores <= 4 ? 'low' : 'high';
}

/**
 * Palco da escultura. O pôster SVG é renderizado sempre e ocupa o mesmo
 * espaço da cena (zero layout shift); a cena WebGL é importada sob demanda
 * depois do primeiro paint e entra por cima com um fade quando o primeiro
 * quadro fica pronto. Sem WebGL2, com economia de dados ou em aparelho
 * modesto, o pôster é a versão final -- e foi desenhado pra ser.
 */
export function BrandSculpture({ variant, className }: Props) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('poster');

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const quality = detectQuality();
    if (!quality) {
      setMode('fallback');
      return;
    }

    let handle: SculptureHandle | null = null;
    let cancelled = false;
    let visible = false;
    const cleanups: Array<() => void> = [];

    const syncActive = () => handle?.setActive(visible && !document.hidden);

    const start = async () => {
      const { createSculpture } = await import('./sculptureScene');
      if (cancelled) return;
      try {
        handle = createSculpture({
          canvas,
          variant,
          quality,
          still: reduced,
          onFirstFrame: () => !cancelled && setMode('live'),
          onContextLost: () => !cancelled && setMode('fallback'),
        });
      } catch {
        setMode('fallback');
        return;
      }
      syncActive();

      // Rolagem: quanto do palco já saiu por cima da tela.
      cleanups.push(
        onScrollFrame(() => {
          const r = wrap.getBoundingClientRect();
          handle?.setScroll(clamp01(-r.top / Math.max(r.height, 1)));
        })
      );

      // Cursor: só com ponteiro fino e sem pedido de menos movimento.
      if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const move = (e: PointerEvent) => {
          const r = wrap.getBoundingClientRect();
          const x = ((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2));
          const y = ((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2));
          handle?.setPointer(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
        };
        window.addEventListener('pointermove', move, { passive: true });
        cleanups.push(() => window.removeEventListener('pointermove', move));
      }
    };

    // Só renderiza enquanto o palco está na tela.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        syncActive();
      },
      { rootMargin: '120px' }
    );
    io.observe(wrap);
    document.addEventListener('visibilitychange', syncActive);

    // A cena só é baixada quando o palco está perto da tela -- no celular a
    // escultura do hero fica abaixo da primeira dobra, então nem entra na
    // disputa pelo primeiro carregamento -- e, no hero, nunca antes do evento
    // load + um respiro do navegador: a proposta de valor vem primeiro.
    let idleId = 0;
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    const whenCalm = () => {
      idleId = ric ? ric(() => void start(), { timeout: 1500 }) : window.setTimeout(() => void start(), 400);
    };
    const afterLoad = () => (document.readyState === 'complete' ? whenCalm() : window.addEventListener('load', whenCalm, { once: true }));
    // Celular: além disso, espera o primeiro gesto (rolar ou tocar). A peça
    // fica abaixo da primeira dobra e o pôster SVG segura o lugar até lá.
    const touchFirst = variant === 'hero' && quality === 'low';
    let engaged = !touchFirst;
    let near = false;
    const maybeStart = () => {
      if (!engaged || !near) return;
      if (variant === 'hero') afterLoad();
      else void start();
    };
    const engage = () => {
      engaged = true;
      maybeStart();
    };
    if (touchFirst) {
      const opts = { once: true, passive: true } as const;
      window.addEventListener('scroll', engage, opts);
      window.addEventListener('pointerdown', engage, opts);
      cleanups.push(() => {
        window.removeEventListener('scroll', engage);
        window.removeEventListener('pointerdown', engage);
      });
    }
    const lazyIo = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        lazyIo.disconnect();
        near = true;
        maybeStart();
      },
      { rootMargin: variant === 'hero' ? '100px' : '600px' }
    );
    lazyIo.observe(wrap);

    return () => {
      cancelled = true;
      window.removeEventListener('load', whenCalm);
      const cic = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (cic) cic(idleId);
      window.clearTimeout(idleId);
      lazyIo.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', syncActive);
      cleanups.forEach((fn) => fn());
      handle?.dispose();
    };
  }, [variant, reduced]);

  return (
    <div ref={wrapRef} className={`${styles.stage} ${className ?? ''}`} data-mode={mode} aria-hidden="true">
      <SculpturePoster className={styles.poster} />
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}

/**
 * Versão estática da escultura em SVG: o mesmo anel em três quartos, com a
 * faixa de reflexo, as linhas de fluxo e os dois aros do logo. Serve de
 * pôster enquanto a cena carrega e de versão final quando não há WebGL.
 */
export function SculpturePoster({ className }: { className?: string }) {
  // Dois pôsteres na página (hero e fechamento): ids de gradiente únicos.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const body = `${uid}-body`;
  const rim = `${uid}-rim`;
  const sheen = `${uid}-sheen`;
  return (
    <svg className={className} viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={body} cx="50%" cy="38%" r="62%">
          <stop offset="0" stopColor="#1a2420" />
          <stop offset="0.55" stopColor="#0b0f0d" />
          <stop offset="1" stopColor="#050605" />
        </radialGradient>
        <linearGradient id={rim} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B8FFD5" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#74E8AE" stopOpacity="0.15" />
          <stop offset="1" stopColor="#74E8AE" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={sheen} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#E8FFF3" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform="translate(300 300) rotate(-24)">
        <ellipse rx="268" ry="196" stroke="#74E8AE" strokeOpacity="0.14" />
        <ellipse rx="236" ry="172" stroke="#74E8AE" strokeOpacity="0.22" strokeDasharray="2 10" />
        <path
          fillRule="evenodd"
          d="M-196 0a196 132 0 1 0 392 0a196 132 0 1 0 -392 0ZM-118 6a118 70 0 1 0 236 0a118 70 0 1 0 -236 0Z"
          fill={`url(#${body})`}
        />
        <path
          fillRule="evenodd"
          d="M-196 0a196 132 0 1 0 392 0a196 132 0 1 0 -392 0ZM-118 6a118 70 0 1 0 236 0a118 70 0 1 0 -236 0Z"
          stroke={`url(#${rim})`}
          strokeWidth="1.4"
        />
        <ellipse rx="157" ry="101" stroke="#74E8AE" strokeOpacity="0.16" />
        <ellipse rx="176" ry="116" stroke="#74E8AE" strokeOpacity="0.1" />
        <ellipse rx="138" ry="86" stroke="#74E8AE" strokeOpacity="0.1" />
        <path d="M-150 -96 C -80 -140 70 -142 150 -92" stroke={`url(#${sheen})`} strokeWidth="10" strokeLinecap="round" opacity="0.55" />
        <path d="M120 88 C 150 70 175 40 186 14" stroke="#B8FFD5" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
      </g>
    </svg>
  );
}
