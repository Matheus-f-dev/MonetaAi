import { useId } from 'react';

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
