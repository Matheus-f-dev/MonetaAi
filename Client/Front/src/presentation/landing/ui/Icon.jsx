// Conjunto de ícones da landing. UM estilo só: grade 24, traço 1.5, ponta e
// junção redondas, sem preenchimento. Só ícone funcional, nada de ilustração
// decorativa e nada de emoji.

const BASE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  focusable: 'false',
};

const PATHS = {
  // Balão: registro por mensagem.
  chat: (
    <>
      <path d="M20.5 11.6c0 3.9-3.8 7-8.5 7-.9 0-1.8-.1-2.6-.3l-4.4 1.7 1.2-3.4A6.6 6.6 0 0 1 3.5 11.6c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7Z" />
      <path d="M8.75 11.6h6.5" />
    </>
  ),
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
  // Sino: alerta de limite.
  bell: (
    <>
      <path d="M17.5 11.25a5.5 5.5 0 1 0-11 0c0 3.2-1.1 4.6-1.75 5.25h14.5c-.65-.65-1.75-2.05-1.75-5.25Z" />
      <path d="M10.25 19.5a2 2 0 0 0 3.5 0" />
    </>
  ),
  // Colunas: análise e tendência.
  chart: (
    <>
      <path d="M4 19.5V4.5" />
      <path d="M4 19.5h16" />
      <path d="M8.25 19.5v-5" />
      <path d="M12.75 19.5v-9" />
      <path d="M17.25 19.5v-6" />
    </>
  ),
  // Linha que continua pontilhada: projeção de saldo.
  forecast: (
    <>
      <path d="M3.5 15.5l4-4.5 3.25 2.75L14.5 8.5" />
      <path d="M16.5 7h4v4" />
      <path d="M17.25 17.5h.01M20 17.5h.01M14.5 17.5h.01" />
    </>
  ),
  // Balança: impacto de uma compra.
  scale: (
    <>
      <path d="M12 4.5v15" />
      <path d="M6 19.5h12" />
      <path d="M4.5 8.5h15" />
      <path d="M4.5 8.5 2.5 13.25a2.6 2.6 0 0 0 4 0Z" />
      <path d="M19.5 8.5 17.5 13.25a2.6 2.6 0 0 0 4 0Z" />
    </>
  ),
  // Seta saindo do documento: exportação.
  export: (
    <>
      <path d="M12 3.75v8.5" />
      <path d="M8.75 7 12 3.75 15.25 7" />
      <path d="M5 14.25v3.5a2.25 2.25 0 0 0 2.25 2.25h9.5A2.25 2.25 0 0 0 19 17.75v-3.5" />
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
  // Ciclo: idempotência, reenviar não duplica.
  repeat: (
    <>
      <path d="M4.5 11.5a7.5 7.5 0 0 1 12.9-5.2l2.1 2" />
      <path d="M19.5 3.5v4.8h-4.8" />
      <path d="M19.5 12.5a7.5 7.5 0 0 1-12.9 5.2l-2.1-2" />
      <path d="M4.5 20.5v-4.8h4.8" />
    </>
  ),
  // Olho: escopo da leitura.
  eye: (
    <>
      <path d="M2.75 12S6 6.5 12 6.5 21.25 12 21.25 12 18 17.5 12 17.5 2.75 12 2.75 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </>
  ),
  // Documento: LGPD, exportação e exclusão.
  doc: (
    <>
      <path d="M13.5 3.5H7.75A1.75 1.75 0 0 0 6 5.25v13.5A1.75 1.75 0 0 0 7.75 20.5h8.5A1.75 1.75 0 0 0 18 18.75V8Z" />
      <path d="M13.5 3.5V8H18" />
      <path d="M9.25 12.75h5.5M9.25 16h3.5" />
    </>
  ),
  // Setas e sinais de interface.
  arrow: <path d="M4.5 12h14m-5.25-5.25L18.5 12l-5.25 5.25" />,
  chevron: <path d="M6.5 9.5 12 15l5.5-5.5" />,
  check: <path d="M4.75 12.5l4.5 4.5 10-10.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  spark: (
    <>
      <path d="M12 3.5l1.6 4.4 4.4 1.6-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6Z" />
      <path d="M18.25 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z" />
    </>
  ),
  mic: (
    <>
      <rect x="9.25" y="3.5" width="5.5" height="9.5" rx="2.75" />
      <path d="M5.75 11.25a6.25 6.25 0 0 0 12.5 0" />
      <path d="M12 17.5v3" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8.75A1.75 1.75 0 0 1 5.25 7h1.9l1.2-2h5.3l1.2 2h3.9A1.75 1.75 0 0 1 20.5 8.75v8.5A1.75 1.75 0 0 1 18.75 19H5.25A1.75 1.75 0 0 1 3.5 17.25Z" />
      <circle cx="12" cy="13" r="3.25" />
    </>
  ),
};

/**
 * Ícone decorativo por padrão (aria-hidden). Passe `label` só quando o ícone
 * for a única fonte da informação, o que quase nunca acontece nesta página.
 */
export default function Icon({ name, size = 20, label, className, style }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      {...BASE}
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {label ? <title>{label}</title> : null}
      {path}
    </svg>
  );
}

/**
 * A marca. Dois anéis concêntricos e o M, os mesmos de public/moneta-mark.svg,
 * herdando a cor de quem a usa em vez de trazer hex próprio.
 */
export function Mark({ size = 28, className }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <circle cx="16" cy="16" r="12.2" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
      <circle cx="16" cy="16" r="9.2" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <path
        d="M11.5 20.4V11.6l4.5 4.9 4.5-4.9v8.8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
