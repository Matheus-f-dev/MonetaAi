import { Link } from 'react-router-dom';
import { BrandMark, ROUTES } from '../components/ui';
import { FOOTER, NAV } from '../data/content';
import s from '../Landing.module.css';
import f from './Footer.module.css';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={f.footer}>
      <div className={`${s.wrap} ${f.grid}`}>
        <div className={f.brandCol}>
          <a href="#topo" className={f.brand} aria-label="Moneta AI, voltar ao início">
            <BrandMark size={32} />
            <span>
              Moneta<span className={f.ai}> AI</span>
            </span>
          </a>
          <p className={f.tagline}>{FOOTER.tagline}</p>
        </div>

        <nav className={f.col} aria-label="Produto">
          <h2 className={f.colTitle}>Produto</h2>
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href}>{n.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className={f.col} aria-label="Acesso">
          <h2 className={f.colTitle}>Acesso</h2>
          <ul>
            <li>
              <Link to={ROUTES.signup}>Criar conta grátis</Link>
            </li>
            <li>
              <Link to={ROUTES.signin}>Entrar</Link>
            </li>
            <li>
              <Link to="/esqueci-senha">Esqueci minha senha</Link>
            </li>
          </ul>
        </nav>

        <nav className={f.col} aria-label="Legal">
          <h2 className={f.colTitle}>Legal</h2>
          <ul>
            <li>
              <Link to={ROUTES.privacy}>Política de privacidade</Link>
            </li>
            <li>
              <Link to={ROUTES.terms}>Termos de uso</Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className={`${s.wrap} ${f.bottom}`}>
        <span>
          © {year} {FOOTER.legal}
        </span>
        <span className={f.signature} aria-hidden="true">
          Seu dinheiro. <em>Mais claro.</em>
        </span>
      </div>

      <div className={f.giant} aria-hidden="true">
        Moneta
      </div>
    </footer>
  );
}
