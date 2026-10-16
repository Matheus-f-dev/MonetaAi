import type { CSSProperties, ReactNode, SVGProps } from 'react';
import { Link } from 'react-router-dom';
import { DEMO_TAG } from '../data/content';
import s from '../Landing.module.css';

export const ROUTES = {
  signup: '/cadastro',
  signin: '/login',
  privacy: '/privacy-policy',
  terms: '/terms-of-service',
} as const;

/** Atraso de revelação como variável CSS, para escalonar elementos irmãos. */
export function delay(ms: number): CSSProperties {
  return { '--d': `${ms}ms` } as CSSProperties;
}

export function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M3 8h9.5M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Os dois anéis concêntricos e o M do logo, redesenhados no menta da landing. */
export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="14.4" stroke="#74E8AE" strokeOpacity="0.35" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="10.6" stroke="#74E8AE" strokeOpacity="0.75" strokeWidth="1.2" />
      <path d="M11.4 20.6v-9.2l4.6 5 4.6-5v9.2" stroke="#B8FFD5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Variant = 'primary' | 'ghost';

interface CtaProps {
  children: ReactNode;
  variant?: Variant;
  small?: boolean;
  arrow?: boolean;
  className?: string;
}

function classes(variant: Variant, small?: boolean, extra?: string) {
  return [s.btn, variant === 'primary' ? s.btnPrimary : s.btnGhost, small ? s.btnSmall : '', extra ?? '']
    .filter(Boolean)
    .join(' ');
}

/** Botão que navega para uma rota real do app (cadastro, login). */
export function RouteCta({ to, children, variant = 'primary', small, arrow, className }: CtaProps & { to: string }) {
  return (
    <Link to={to} className={classes(variant, small, className)}>
      {children}
      {arrow && <ArrowIcon />}
    </Link>
  );
}

/** Botão que leva a uma seção da própria página. */
export function AnchorCta({ href, children, variant = 'ghost', small, arrow, className }: CtaProps & { href: string }) {
  return (
    <a href={href} className={classes(variant, small, className)}>
      {children}
      {arrow && <ArrowIcon />}
    </a>
  );
}

/** Cabeçalho padrão de seção: rótulo, manchete com acento e texto de apoio. */
export function SectionHead({
  eyebrow,
  title,
  accent,
  lead,
  id,
  className,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  lead?: string;
  id: string;
  className?: string;
  align?: 'left' | 'center';
}) {
  return (
    <header className={className} style={align === 'center' ? { textAlign: 'center', marginInline: 'auto' } : undefined}>
      <p className={s.eyebrow} data-reveal="fade">
        {eyebrow}
      </p>
      <h2 id={id} className={`${s.h2} ${s.lines}`} data-reveal style={{ marginTop: 22 }}>
        <span className={s.line} style={{ '--li': 0 } as CSSProperties}>
          <span>{title}</span>
        </span>
        {' '}
        {accent && (
          <span className={s.line} style={{ '--li': 1 } as CSSProperties}>
            <span className={s.accent}>{accent}</span>
          </span>
        )}
      </h2>
      {lead && (
        <p
          className={s.lead}
          data-reveal
          style={{ ...delay(220), marginTop: 26, ...(align === 'center' ? { marginInline: 'auto' } : null) }}
        >
          {lead}
        </p>
      )}
    </header>
  );
}

/** Barra de progresso de interface (orçamento, meta, limite do cartão). */
export function Meter({ value, tone = 'mint', className }: { value: number; tone?: 'mint' | 'warn' | 'muted'; className?: string }) {
  const color = tone === 'warn' ? 'var(--warn)' : tone === 'muted' ? 'var(--text-3)' : 'var(--mint)';
  return (
    <span
      className={className}
      style={{
        display: 'block',
        height: 6,
        borderRadius: 99,
        background: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          display: 'block',
          height: '100%',
          width: `${Math.max(0, Math.min(100, value))}%`,
          borderRadius: 99,
          background: color,
          boxShadow: tone === 'mint' ? '0 0 12px rgba(116,232,174,0.45)' : undefined,
          transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </span>
  );
}

/**
 * Selo de demonstração: todo módulo com dados fictícios usa este, sempre com
 * a mesma cara (borda tracejada), para nunca se confundir com o produto real.
 */
export function DemoTag({ text = DEMO_TAG, className }: { text?: string; className?: string }) {
  return (
    <span className={`${s.demoTag} ${className ?? ''}`}>
      <svg width={12} height={12} viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M4.5 1.5h3M5 1.5v3L2 9.5a1 1 0 0 0 .9 1.5h6.2a1 1 0 0 0 .9-1.5L7 4.5v-3" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
      {text}
    </span>
  );
}
