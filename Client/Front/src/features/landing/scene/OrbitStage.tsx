import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { onScrollFrame } from '../motion/scroll';
import { useReducedMotion } from '../motion/hooks';
import type { Pose, SculptureHandle, SculptureQuality } from './sculptureScene';
import styles from './OrbitStage.module.css';

// ============================================================================
// O diretor da peça. Cada capítulo que quer a peça declara um ponto de
// atracação (useOrbitDock) -- um elemento do DOM e uma função que, a partir do
// retângulo desse elemento, devolve a pose. A cada quadro de rolagem o diretor
// escolhe o capítulo cujo ponto está mais perto do centro da tela e entrega a
// pose à cena; se nenhum estiver por perto, a peça some e o render dorme.
//
// Sem WebGL2, com economia de dados ou em aparelho modesto, a cena nem é
// baixada: as seções mostram os seus pôsteres SVG (ver SculpturePoster).
// ============================================================================

export type StageMode = 'poster' | 'live' | 'fallback';

export type DockPose = Omit<Pose, 'opacity'> & { opacity?: number };

export interface Dock {
  id: string;
  ref: RefObject<HTMLElement | null>;
  pose: (rect: DOMRect, view: { w: number; h: number }) => DockPose;
}

interface StageApi {
  mode: StageMode;
  register: (dock: Dock) => () => void;
  /** Peça para recalcular a pose fora de um evento de rolagem (estado interno mudou). */
  refresh: () => void;
}

const StageContext = createContext<StageApi>({ mode: 'poster', register: () => () => {}, refresh: () => {} });

export function useOrbitMode(): StageMode {
  return useContext(StageContext).mode;
}

/**
 * Declara um ponto de atracação. `pose` pode ler estado do componente: quando
 * esse estado mudar, chame o `refresh` devolvido para a peça reagir na hora.
 */
export function useOrbitDock(id: string, ref: RefObject<HTMLElement | null>, pose: Dock['pose']) {
  const { register, refresh } = useContext(StageContext);
  const poseRef = useRef(pose);
  poseRef.current = pose;
  useEffect(
    () => register({ id, ref, pose: (rect, view) => poseRef.current(rect, view) }),
    [id, ref, register]
  );
  return refresh;
}

/** WebGL2 disponível e o aparelho não pediu economia? Senão, fica nos pôsteres. */
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
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return small || coarse || cores <= 4 ? 'low' : 'high';
}

const HIDDEN_MARGIN = 0.48; // fração da altura da tela além da qual nenhum capítulo "segura" a peça

export function OrbitStage({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docks = useRef(new Map<string, Dock>());
  const handleRef = useRef<SculptureHandle | null>(null);
  const activeDock = useRef<string | null>(null);
  const lastPose = useRef<Pose | null>(null);
  const [mode, setMode] = useState<StageMode>('poster');

  // Escolhe o capítulo e entrega a pose.
  const update = useCallback(() => {
    const handle = handleRef.current;
    if (!handle) return;
    const view = { w: window.innerWidth, h: window.innerHeight };
    let best: { dock: Dock; rect: DOMRect } | null = null;
    let bestDist = Infinity;
    docks.current.forEach((dock) => {
      const el = dock.ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -view.h * 0.3 || rect.top > view.h * 1.3 || rect.width === 0) return;
      // Distância do centro da tela até a faixa ocupada pelo elemento.
      const cy = rect.top + rect.height / 2;
      const dist = Math.max(0, Math.abs(cy - view.h / 2) - rect.height * 0.35);
      if (dist < bestDist) {
        bestDist = dist;
        best = { dock, rect };
      }
    });

    const chosen = best as { dock: Dock; rect: DOMRect } | null;
    if (!chosen || bestDist > view.h * HIDDEN_MARGIN) {
      if (lastPose.current) {
        const hidden = { ...lastPose.current, opacity: 0 };
        lastPose.current = hidden;
        handle.setTarget(hidden);
      }
      activeDock.current = null;
      return;
    }

    const p = chosen.dock.pose(chosen.rect, view);
    const pose: Pose = { ...p, opacity: p.opacity ?? 1 };
    const switched = activeDock.current !== null && activeDock.current !== chosen.dock.id;
    const first = lastPose.current === null;
    activeDock.current = chosen.dock.id;
    lastPose.current = pose;
    handle.setTarget(pose, { flight: switched, snap: first });
  }, []);

  const api = useMemo<StageApi>(
    () => ({
      mode,
      register: (dock) => {
        docks.current.set(dock.id, dock);
        return () => {
          docks.current.delete(dock.id);
        };
      },
      refresh: () => update(),
    }),
    [mode, update]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const quality = detectQuality();
    if (!quality) {
      setMode('fallback');
      return;
    }

    let cancelled = false;
    const cleanups: Array<() => void> = [];
    const syncActive = () => handleRef.current?.setActive(!document.hidden);

    const start = async () => {
      const { createSculpture } = await import('./sculptureScene');
      if (cancelled) return;
      try {
        handleRef.current = createSculpture({
          canvas,
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
      cleanups.push(onScrollFrame(update));
      update();

      if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const move = (e: PointerEvent) => {
          handleRef.current?.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
        };
        window.addEventListener('pointermove', move, { passive: true });
        cleanups.push(() => window.removeEventListener('pointermove', move));
      }
    };

    document.addEventListener('visibilitychange', syncActive);

    // A proposta de valor vem primeiro: a cena só é baixada depois do load e
    // de um respiro do navegador. No celular, espera ainda o primeiro gesto
    // (rolar ou tocar) -- até lá, o pôster do hero segura o lugar.
    let idleId = 0;
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    const whenCalm = () => {
      idleId = ric ? ric(() => void start(), { timeout: 1500 }) : window.setTimeout(() => void start(), 400);
    };
    const afterLoad = () =>
      document.readyState === 'complete' ? whenCalm() : window.addEventListener('load', whenCalm, { once: true });

    if (quality === 'low') {
      const engage = () => {
        window.removeEventListener('scroll', engage);
        window.removeEventListener('pointerdown', engage);
        afterLoad();
      };
      window.addEventListener('scroll', engage, { once: true, passive: true });
      window.addEventListener('pointerdown', engage, { once: true, passive: true });
      cleanups.push(() => {
        window.removeEventListener('scroll', engage);
        window.removeEventListener('pointerdown', engage);
      });
    } else {
      afterLoad();
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', whenCalm);
      const cic = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (cic) cic(idleId);
      window.clearTimeout(idleId);
      document.removeEventListener('visibilitychange', syncActive);
      cleanups.forEach((fn) => fn());
      handleRef.current?.dispose();
      handleRef.current = null;
      lastPose.current = null;
      activeDock.current = null;
    };
  }, [reduced, update]);

  return (
    <StageContext.Provider value={api}>
      <canvas ref={canvasRef} className={styles.canvas} data-mode={mode} aria-hidden="true" />
      {children}
    </StageContext.Provider>
  );
}
