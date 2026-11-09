// Glifo da marca (dois anéis concêntricos e o M), em currentColor -- usado
// nas telas de autenticação. Veio da landing anterior quando ela saiu; a
// landing atual tem a sua própria versão em menta (features/landing).
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
