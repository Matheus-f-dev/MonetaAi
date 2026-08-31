import Glyph from './Glyphs';
import { ASSURANCES } from './content';

// Linhas divididas, sem cartão: aqui elevação não significaria hierarquia,
// significaria decoração. São quatro fatos de arquitetura, não quatro produtos.

export default function Assurances() {
  return (
    <section className="assurances" id="seguranca">
      <div className="assurances__head">
        <h2 className="assurances__title">Por que o seu dinheiro fica seguro aqui</h2>
        <p className="assurances__lede">
          Nada disso é promessa de marketing. São decisões que já estão no jeito como o sistema
          guarda e movimenta os seus dados.
        </p>
      </div>

      <ul className="assurances__list">
        {ASSURANCES.map((item) => (
          <li key={item.title} className="assurance">
            <span className="assurance__glyph" aria-hidden="true">
              <Glyph name={item.glyph} size={22} />
            </span>
            <h3 className="assurance__title">{item.title}</h3>
            <p className="assurance__body">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
