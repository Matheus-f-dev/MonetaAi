import type { SVGProps } from 'react';

// Ícones de traço único, 20x20, mesma espessura em toda a landing. Desenhados
// aqui (poucos, específicos) em vez de puxar uma biblioteca de ícones.

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const PATHS: Record<string, string> = {
  card: 'M3 6.5h14v8.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6.5Zm0 0V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1.5M3 9.5h14M6 13h3',
  pix: 'M10 3 17 10 10 17 3 10 10 3Zm-3.5 7h7',
  sheet: 'M5 3h7l3 3v11H5V3Zm7 0v3h3M8 10h4M8 13h4',
  ride: 'M4 13V9.5L5.6 6h8.8L16 9.5V13M4 13h12M4 13v2M16 13v2M6.5 10.5h.01M13.5 10.5h.01',
  food: 'M6 3v6a2 2 0 0 0 4 0V3M8 9v8M14 3c-1.5 1-2 3-2 5h2v9',
  sub: 'M3 5h14v9H3V5Zm4 12h6M8.5 8v3l3-1.5-3-1.5Z',
  goal: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0-3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-3.5h.01',
  rent: 'M3.5 9 10 3.5 16.5 9M5 8v8h10V8M8.5 16v-4h3v4',
  salary: 'M3 6h14v9H3V6Zm7 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 9h.01M14 12h.01',
  wallet: 'M3 6.5A1.5 1.5 0 0 1 4.5 5H15v3M3 6.5V15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H4.5A1.5 1.5 0 0 1 3 6.5ZM13.5 12h.01',
  repeat: 'M4 8a6 6 0 0 1 10.5-3.5L16 6M16 3v3h-3M16 12a6 6 0 0 1-10.5 3.5L4 14M4 17v-3h3',
  budget: 'M10 3v7l5 4.5M17 10a7 7 0 1 1-7-7',
  calendar: 'M4 5h12v11H4V5Zm0 3.5h12M7.5 3v3M12.5 3v3',
  upload: 'M10 13V4M6.5 7.5 10 4l3.5 3.5M4 13v3h12v-3',
  people: 'M7.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M13 4.2a2.5 2.5 0 0 1 0 4.6M14.5 12c1.5.4 2.5 1.7 2.5 4',
  bell: 'M5 13.5V9a5 5 0 0 1 10 0v4.5l1.5 1.5h-13L5 13.5ZM8.5 17.5h3',
  file: 'M5 3h7l3 3v11H5V3Zm7 0v3h3',
  google: 'M16.5 10.2c0-.5 0-1-.1-1.4H10v2.7h3.7a3.2 3.2 0 0 1-1.4 2.1v1.7h2.2c1.3-1.2 2-3 2-5.1ZM10 17c1.8 0 3.4-.6 4.5-1.7l-2.2-1.7c-.6.4-1.4.7-2.3.7-1.8 0-3.3-1.2-3.8-2.8H3.9v1.8A7 7 0 0 0 10 17ZM6.2 11.5a4.2 4.2 0 0 1 0-2.9V6.8H3.9a7 7 0 0 0 0 6.5l2.3-1.8ZM10 5.8c1 0 1.9.3 2.6 1l1.9-2A7 7 0 0 0 3.9 6.8l2.3 1.8C6.7 7 8.2 5.8 10 5.8Z',
  lock: 'M5.5 9h9v7.5h-9V9Zm2-0V6.5a2.5 2.5 0 0 1 5 0V9M10 12v2',
  shield: 'M10 3 16 5.5V10c0 3.5-2.5 6-6 7-3.5-1-6-3.5-6-7V5.5L10 3Zm-2.5 7 2 2 3.5-3.5',
  moon: 'M15.5 12.5A6 6 0 0 1 7.5 4.5a6 6 0 1 0 8 8Z',
  user: 'M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.5 7c.5-3 2.7-4.5 5.5-4.5s5 1.5 5.5 4.5',
  spark: 'M10 3v3M10 14v3M3 10h3M14 10h3M5.5 5.5l2 2M12.5 12.5l2 2M14.5 5.5l-2 2M7.5 12.5l-2 2',
  send: 'M4 10 16 4l-4 12-2.5-5L4 10Z',
  check: 'M4.5 10.5 8 14l7.5-8',
  chart: 'M3.5 16.5h13M5.5 13.5V10M9 13.5V6.5M12.5 13.5V9M16 13.5v-6',
};

export function Glyph({ name, ...props }: { name: keyof typeof PATHS | string } & SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d={PATHS[name] ?? PATHS.spark} />
    </svg>
  );
}

export function FragmentGlyph({ kind }: { kind: string }) {
  return <Glyph name={kind} />;
}
