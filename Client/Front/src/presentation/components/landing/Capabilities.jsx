import Glyph from './Glyphs';
import { CAPABILITIES } from './content';

// Bento assimétrico: exatamente uma célula por recurso, nenhuma célula de
// enchimento. As duas células largas ganham a textura de anéis usinados e a
// célula alta ganha o fundo de jade, pra grade não virar cinco caixas iguais.

export default function Capabilities() {
  return (
    <section className="capabilities" id="recursos">
      <div className="capabilities__head">
        <h2 className="capabilities__title">O que a Moneta faz depois da mensagem</h2>
      </div>

      <ul className="capabilities__grid">
        {CAPABILITIES.map((item) => (
          <li key={item.title} className={`cap cap--${item.size}`}>
            <span className="cap__glyph" aria-hidden="true">
              <Glyph name={item.glyph} size={26} />
            </span>
            <h3 className="cap__title">{item.title}</h3>
            <p className="cap__body">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
