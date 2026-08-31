// Inventário de CTAs. Cada um é um componente com classe e identidade de
// interação próprias, de propósito: não existe um .btn genérico nesta página.
// O rótulo, sim, é reaproveitado por intenção ("Criar conta grátis" é sempre
// "Criar conta grátis", nunca "Comece agora" numa seção e "Teste grátis" noutra).

import Glyph from './Glyphs';

const SIGNUP = '/cadastro';
const SIGNIN = '/login';

// Herói: laje sólida. Um anel usinado cresce da esquerda no hover, ecoando
// o objeto do filme.
export function CtaHero({ onNavigate }) {
  return (
    <button className="cta-hero" type="button" onClick={() => onNavigate(SIGNUP)}>
      <span className="cta-hero__ring" aria-hidden="true" />
      <span className="cta-hero__label">Criar conta grátis</span>
    </button>
  );
}

// Herói secundário: texto mono com seta que viaja. Ancora, não navega.
export function CtaJourney() {
  return (
    <a className="cta-journey" href="#mecanica">
      <span>Ver como funciona</span>
      <Glyph name="arrow" size={18} className="cta-journey__arrow" />
    </a>
  );
}

// Cabeçalho: bloco contornado que se preenche de jade de baixo pra cima.
export function CtaHeader({ onNavigate }) {
  return (
    <button className="cta-header" type="button" onClick={() => onNavigate(SIGNUP)}>
      <span>Criar conta grátis</span>
    </button>
  );
}

// Entrar: só texto, com um filete que se desenha da esquerda.
export function CtaEnter({ onNavigate }) {
  return (
    <button className="cta-enter" type="button" onClick={() => onNavigate(SIGNIN)}>
      <span>Entrar</span>
    </button>
  );
}

// Plano: bloco de largura total. O jade sobe do rodapé do bloco.
export function CtaPlan({ label, onNavigate, featured }) {
  return (
    <button
      className={`cta-plan${featured ? ' cta-plan--featured' : ''}`}
      type="button"
      onClick={() => onNavigate(SIGNUP)}
    >
      <span>{label}</span>
    </button>
  );
}

// Vendas: link discreto de contato, seta que desliza. Intenção diferente de
// cadastro, então rótulo e vestimenta diferentes.
//
// CONFIRMAR: o endereço abaixo segue o domínio de produção (monetaai.site).
// Se a caixa de vendas for outra, é só trocar aqui.
const SALES_MAIL = 'mailto:contato@monetaai.site?subject=Plano%20Business';

export function CtaSales({ label }) {
  return (
    <a className="cta-sales" href={SALES_MAIL}>
      <span>{label}</span>
      <Glyph name="arrow" size={17} className="cta-sales__arrow" />
    </a>
  );
}

// Fechamento: laje grande com contorno duplo que se fecha no hover.
export function CtaClosing({ onNavigate }) {
  return (
    <button className="cta-closing" type="button" onClick={() => onNavigate(SIGNUP)}>
      <span className="cta-closing__label">Criar conta grátis</span>
      <span className="cta-closing__edge" aria-hidden="true" />
    </button>
  );
}
