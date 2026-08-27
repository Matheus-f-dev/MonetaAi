import { MonetaMark } from './Glyphs';
import { NAV } from './content';

export default function SiteFooter({ onNavigate }) {
  return (
    <footer className="foot">
      <div className="foot__inner">
        <div className="foot__brand">
          <div className="foot__mark">
            <MonetaMark size={30} />
            <span>Moneta</span>
          </div>
          <p className="foot__line">Gestão financeira que começa numa frase.</p>
        </div>

        <nav className="foot__nav" aria-label="Seções, rodapé">
          <p className="foot__nav-title">Navegar</p>
          {NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <nav className="foot__nav" aria-label="Documentos legais">
          <p className="foot__nav-title">Legal</p>
          <button type="button" onClick={() => onNavigate('/terms-of-service')}>
            Termos de Uso
          </button>
          <button type="button" onClick={() => onNavigate('/privacy-policy')}>
            Política de Privacidade
          </button>
        </nav>
      </div>

      <p className="foot__rule">© 2026 Moneta. Todos os direitos reservados.</p>
    </footer>
  );
}
