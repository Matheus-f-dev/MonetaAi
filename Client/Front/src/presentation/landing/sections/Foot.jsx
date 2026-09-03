import { Mark } from '../ui/Icon';
import { FOOTER, BRAND, ROUTES, CTA } from '../data/copy';
import { Button } from '../ui/Primitives';

// ============================================================================
// Rodapé
//
// Só links que resolvem: âncoras desta página, as duas rotas legais que
// existem em App.jsx (/privacy-policy e /terms-of-service) e dois mailto.
// Sem coluna de rede social, porque não há perfil confirmado no repositório e
// um ícone social que leva a lugar nenhum é pior que a ausência dele.
//
// As rotas legais usam `route: true` e passam pela navegação cifrada do app,
// como qualquer outra rota interna.
// ============================================================================
export default function Foot({ onNavigate }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mn-foot">
      <div className="mn-page mn-page--wide">
        <div className="mn-foot__top">
          <div className="mn-foot__brand">
            <a className="mn-foot__logo" href="/" aria-label="MonetaAI, página inicial">
              <Mark size={26} />
              <span className="mn-foot__word">
                Moneta<span className="mn-foot__ai">AI</span>
              </span>
            </a>
            <p className="mn-foot__tag">{FOOTER.tagline}</p>
            <Button variant="outline" size="sm" onClick={() => onNavigate(ROUTES.signup)}>
              {CTA.primary}
            </Button>
          </div>

          <nav className="mn-foot__cols" aria-label="Rodapé">
            {FOOTER.columns.map((col) => (
              <div key={col.title} className="mn-foot__col">
                <h2 className="mn-mono mn-foot__ct">{col.title}</h2>
                <ul>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.route ? (
                        <button type="button" onClick={() => onNavigate(link.href)}>
                          {link.label}
                        </button>
                      ) : (
                        <a
                          href={link.href}
                          {...(link.external ? { rel: 'noopener' } : {})}
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mn-foot__legal">
          <p className="mn-num mn-foot__copy">
            &copy; {year} {FOOTER.legal}
          </p>
          <p className="mn-foot__site">{BRAND.domain}</p>
        </div>
      </div>
    </footer>
  );
}
