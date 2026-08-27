import { useEffect, useState } from 'react';
import { PARSES } from './content';

// A seção que é o produto: a frase crua de um lado, o lançamento resolvido do
// outro. Cicla sozinha porque a variedade dos exemplos é o argumento.
//
// Nada aqui imita a interface de um mensageiro nem desenha um painel falso: é
// tipografia mostrando entrada e saída, que é exatamente o que acontece.

const CYCLE_MS = 3600;

export default function Mechanics() {
  const [reduced, setReduced] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener('change', read);
    return () => query.removeEventListener('change', read);
  }, []);

  useEffect(() => {
    if (reduced) return undefined;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % PARSES.length);
    }, CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [reduced]);

  // Sem movimento a lista inteira aparece de uma vez: o argumento continua
  // completo, só não gira.
  if (reduced) {
    return (
      <section className="mechanics" id="mecanica">
        <div className="mechanics__head">
          <p className="mechanics__eyebrow">A mecânica</p>
          <h2 className="mechanics__title">Uma frase entra. Um lançamento sai.</h2>
          <p className="mechanics__lede">
            Você escreve como falaria com uma pessoa. A Moneta resolve categoria, conta e valor a
            partir da própria frase.
          </p>
        </div>

        <ul className="mechanics__static">
          {PARSES.map((item) => (
            <li key={item.raw} className="mechanics__static-row">
              <p className="mechanics__raw">{item.raw}</p>
              <dl className="mechanics__fields">
                {item.fields.map(([label, value]) => (
                  <div key={label} className="mechanics__field">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const active = PARSES[index];

  return (
    <section className="mechanics" id="mecanica">
      <div className="mechanics__head">
        <p className="mechanics__eyebrow">A mecânica</p>
        <h2 className="mechanics__title">Uma frase entra. Um lançamento sai.</h2>
        <p className="mechanics__lede">
          Você escreve como falaria com uma pessoa. A Moneta resolve categoria, conta e valor a
          partir da própria frase.
        </p>
      </div>

      <div className="mechanics__press">
        <div className="mechanics__side mechanics__side--in">
          <p className="mechanics__side-label">Você manda</p>
          {/* key troca a cada exemplo, então a animação de entrada roda de novo */}
          <p className="mechanics__raw" key={active.raw}>
            {active.raw}
          </p>
        </div>

        <div className="mechanics__seam" aria-hidden="true">
          <span className="mechanics__seam-line" />
          <span className="mechanics__seam-dot" />
        </div>

        <div className="mechanics__side mechanics__side--out">
          <p className="mechanics__side-label">A Moneta registra</p>
          <dl className="mechanics__fields" key={active.raw}>
            {active.fields.map(([label, value], position) => (
              <div
                key={label}
                className="mechanics__field"
                style={{ '--field-delay': `${position * 90}ms` }}
              >
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <ol className="mechanics__ticks" aria-label="Exemplos">
        {PARSES.map((item, position) => (
          <li key={item.raw}>
            <button
              type="button"
              className="mechanics__tick"
              aria-current={position === index ? 'true' : undefined}
              aria-label={`Exemplo: ${item.raw}`}
              onClick={() => setIndex(position)}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
