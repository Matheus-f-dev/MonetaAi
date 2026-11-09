import { useRef } from 'react';
import { useOrbitDock, useOrbitMode, type Dock } from './OrbitStage';
import { SculpturePoster } from './SculpturePoster';
import styles from './OrbitAnchor.module.css';

/**
 * Lugar reservado para a peça num capítulo que a apresenta inteira (hero e
 * fechamento). Ocupa o espaço da peça desde o primeiro paint -- zero layout
 * shift -- e mostra o pôster SVG até a cena WebGL assumir; sem WebGL, o pôster
 * é a versão final.
 */
export function OrbitAnchor({ id, pose, className }: { id: string; pose: Dock['pose']; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mode = useOrbitMode();
  useOrbitDock(id, ref, pose);
  return (
    <div ref={ref} className={`${styles.anchor} ${className ?? ''}`} data-mode={mode} aria-hidden="true">
      <SculpturePoster className={styles.poster} />
    </div>
  );
}
