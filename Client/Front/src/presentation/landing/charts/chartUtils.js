import { useEffect, useRef, useState } from 'react';

// ============================================================================
// Ferramentas de gráfico. SVG inline, sem biblioteca.
//
// Por que sem chart.js aqui: o painel logado já usa chart.js e faz sentido lá,
// onde há interação de verdade. Na landing, seis gráficos estáticos não
// justificam ~70 kB de JS antes da primeira pintura. Estes gráficos são
// centenas de bytes de path.
//
// Medimos o container em px com ResizeObserver em vez de esticar um viewBox.
// Um viewBox esticado deforma a espessura do traço e o tamanho do texto, e é
// exatamente o que faz um gráfico parecer barato quando a tela muda.
// ============================================================================

/** Largura real do container, em px. */
export function useSize(fallback = 720) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof ResizeObserver === 'undefined') {
      setWidth(node.getBoundingClientRect().width || fallback);
      return undefined;
    }

    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setWidth(w);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [fallback]);

  return [ref, width];
}

/** Escala linear domínio -> pixels. */
export const scale = (value, [d0, d1], [r0, r1]) =>
  d1 === d0 ? r0 : r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);

/**
 * Ticks em números redondos. Um eixo com 6.847 e 9.271 escrito nele é um eixo
 * que ninguém lê.
 */
export function niceTicks(min, max, count = 4) {
  if (max === min) return [min];
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;

  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/** Domínio arredondado para tick, com folga proporcional em cima. */
export function domainFor(values, { padTop = 0.08, zeroBase = false } = {}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.abs(max) || 1;
  const lo = zeroBase ? 0 : min - span * 0.12;
  const hi = max + span * padTop;
  const ticks = niceTicks(lo, hi, 4);
  return { lo: ticks[0], hi: ticks[ticks.length - 1], ticks };
}

/** Polilinha. Segmento reto de propósito: saldo não é curva suave. */
export function linePath(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
}

/** Mesma polilinha fechada na base, para o preenchimento em lavagem. */
export function areaPath(points, baseY) {
  if (!points.length) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath(points)} L${last.x.toFixed(2)} ${baseY.toFixed(2)} L${first.x.toFixed(2)} ${baseY.toFixed(2)} Z`;
}

/**
 * Índice do ponto mais próximo do cursor. O alvo de acerto é a faixa inteira
 * entre dois pontos, não o ponto: ninguém deveria precisar mirar num raio de
 * 4px.
 */
export function nearestIndex(clientX, svgNode, xs) {
  const box = svgNode.getBoundingClientRect();
  const x = clientX - box.left;
  let best = 0;
  let dist = Infinity;
  for (let i = 0; i < xs.length; i += 1) {
    const d = Math.abs(xs[i] - x);
    if (d < dist) { dist = d; best = i; }
  }
  return best;
}

/** Alvo de toque confortável decide quantos rótulos de eixo cabem. */
export function tickStride(count, width, minPx = 44) {
  const per = width / Math.max(1, count);
  return Math.max(1, Math.ceil(minPx / per));
}
