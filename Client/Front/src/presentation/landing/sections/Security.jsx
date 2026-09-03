import Icon from '../ui/Icon';
import { SectionHead, Reveal } from '../ui/Primitives';
import { SECURITY } from '../data/copy';

// ============================================================================
// 06 · Segurança e confiança
//
// Cada afirmação daqui é verificável no código do produto:
//   Firebase Auth ................ MonetaAi_bot/firebase_manager.py, Service
//   isolamento por usuário ....... consultas por userId em todo o repositório
//   rastro de transferência ...... registro de movimentação entre contas
//   idempotência de mensagem ..... reenvio reconhecido, sem lançamento duplo
//   LGPD, exportação ............. exportação em planilha na tela de relatórios
//
// O que NÃO está confirmado (certificação, criptografia específica, Open
// Finance, 2FA) fica em SECURITY_TODO em data/copy.js, comentado, e não é
// renderizado. Selo de conformidade inventado em produto financeiro não é
// exagero de marketing, é problema jurídico.
// ============================================================================
export default function Security() {
  return (
    <section id="seguranca" className="mn-band mn-sec-sec" aria-labelledby="mn-sec-title">
      <div className="mn-page">
        <SectionHead
          index={SECURITY.index}
          eyebrow={SECURITY.eyebrow}
          title={SECURITY.title}
          lead={SECURITY.lead}
        />

        <ul className="mn-assure">
          {SECURITY.items.map((item, i) => (
            <Reveal as="li" key={item.title} delay={(i % 3) * 70} className="mn-assure__row">
              <span className="mn-assure__icon">
                <Icon name={item.icon} size={19} />
              </span>
              <h3 className="mn-assure__t">{item.title}</h3>
              <p className="mn-assure__b">{item.body}</p>
            </Reveal>
          ))}
        </ul>

        {/* objeções, em pauta de uma linha só: não são features */}
        <Reveal className="mn-trust">
          {SECURITY.trust.map((t) => (
            <div key={t.title} className="mn-trust__cell">
              <h3 className="mn-trust__t">
                <Icon name="check" size={15} />
                {t.title}
              </h3>
              <p className="mn-trust__b">{t.body}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
