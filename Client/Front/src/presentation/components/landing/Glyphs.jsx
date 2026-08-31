// Conjunto de ícones da landing. Um único estilo: grade 24, traço 1.5,
// ponta e junção redondas, sem preenchimento. Só ícone funcional, nada de
// ilustração decorativa.

const BASE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
};

const PATHS = {
  // Etiqueta: categorização.
  tag: (
    <>
      <path d="M13.4 3.5H19a1.5 1.5 0 0 1 1.5 1.5v5.6a2 2 0 0 1-.59 1.42l-7.4 7.4a1.5 1.5 0 0 1-2.12 0l-6.31-6.31a1.5 1.5 0 0 1 0-2.12l7.4-7.4a2 2 0 0 1 1.42-.59Z" />
      <circle cx="16.2" cy="7.8" r="1.15" />
    </>
  ),
  // Carteira: saldo por conta e cartão.
  wallet: (
    <>
      <path d="M3.5 7.75A2.25 2.25 0 0 1 5.75 5.5h12.5a2.25 2.25 0 0 1 2.25 2.25v8.5a2.25 2.25 0 0 1-2.25 2.25H5.75a2.25 2.25 0 0 1-2.25-2.25Z" />
      <path d="M3.5 10.25h17" />
      <path d="M16 14.25h1.75" />
    </>
  ),
  // Alvo: meta e orçamento.
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.9" />
    </>
  ),
  // Sino: alerta de limite.
  bell: (
    <>
      <path d="M17.5 11.25a5.5 5.5 0 1 0-11 0c0 3.2-1.1 4.6-1.75 5.25h14.5c-.65-.65-1.75-2.05-1.75-5.25Z" />
      <path d="M10.25 19.5a2 2 0 0 0 3.5 0" />
    </>
  ),
  // Barras crescentes: relatório e tendência.
  chart: (
    <>
      <path d="M4 19.5V4.5" />
      <path d="M4 19.5h16" />
      <path d="M8.25 19.5v-5" />
      <path d="M12.75 19.5v-9" />
      <path d="M17.25 19.5v-6" />
    </>
  ),
  // Escudo: isolamento de dados.
  shield: (
    <>
      <path d="M12 3.5l7 2.5v5.6c0 4.1-2.85 7.3-7 8.9-4.15-1.6-7-4.8-7-8.9V6Z" />
      <path d="M9.25 12.1l1.9 1.9 3.6-3.6" />
    </>
  ),
  // Chave: autenticação externa, senha não guardada.
  key: (
    <>
      <circle cx="8.5" cy="15.5" r="3.5" />
      <path d="M11 13l8-8" />
      <path d="M16.25 7.75l2 2" />
      <path d="M18.5 5.5l2 2" />
    </>
  ),
  // Trilha: rastro de movimentação.
  trail: (
    <>
      <circle cx="6.5" cy="6.5" r="2" />
      <circle cx="17.5" cy="17.5" r="2" />
      <path d="M8.5 6.5h5.25a2.75 2.75 0 0 1 0 5.5h-3.5a2.75 2.75 0 0 0 0 5.5H15.5" />
    </>
  ),
  // Ciclo: reenvio idempotente.
  repeat: (
    <>
      <path d="M4.75 12a7.25 7.25 0 0 1 12.4-5.1l2.1 2.1" />
      <path d="M19.25 5.25V9h-3.75" />
      <path d="M19.25 12a7.25 7.25 0 0 1-12.4 5.1l-2.1-2.1" />
      <path d="M4.75 18.75V15h3.75" />
    </>
  ),
  // Seta curta: usada dentro de CTA e link.
  arrow: <path d="M5 12h13m0 0l-4.75-4.75M18 12l-4.75 4.75" />,
  // Mais e menos do acordeão.
  plus: (
    <>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </>
  ),
  // Marca de item em lista de plano.
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
};

export default function Glyph({ name, size = 24, className }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg {...BASE} width={size} height={size} className={className}>
      {path}
    </svg>
  );
}

// Monograma da marca. Anéis concêntricos usinados, o mesmo objeto do filme,
// com o M no centro. Inline porque é marca, não ícone de interface.
export function MonetaMark({ size = 28, className }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="16" cy="16" r="14.6" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.32" />
      <circle cx="16" cy="16" r="11.2" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.62" />
      <path
        d="M11.1 20.6V11.4l4.9 5.3 4.9-5.3v9.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
