import Glyph from './Glyphs';
import { QUESTIONS } from './content';

// details/summary nativo: teclado, leitor de tela e busca do browser já
// funcionam sem eu reimplementar nada.

export default function Questions() {
  return (
    <section className="questions" id="perguntas">
      <h2 className="questions__title">Perguntas que aparecem antes de criar a conta</h2>

      <div className="questions__list">
        {QUESTIONS.map((item) => (
          <details key={item.q} className="question">
            <summary className="question__summary">
              <span>{item.q}</span>
              <Glyph name="plus" size={20} className="question__sign" />
            </summary>
            <div className="question__answer">
              <p>{item.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
