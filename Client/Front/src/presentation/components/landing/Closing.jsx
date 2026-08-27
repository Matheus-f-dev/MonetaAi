import { CtaClosing } from './Ctas';

// O único lugar da página onde centralizar é a decisão certa: é uma frase
// final, não uma seção de conteúdo.

export default function Closing({ onNavigate }) {
  return (
    <section className="closing">
      <div className="closing__inner">
        <h2 className="closing__title">Sua próxima despesa pode ser só uma mensagem.</h2>
        <p className="closing__body">
          Crie a conta, mande a primeira frase e veja o saldo se ajustar. O plano Starter é grátis e
          não pede cartão.
        </p>
        <div className="closing__action">
          <CtaClosing onNavigate={onNavigate} />
        </div>
      </div>
    </section>
  );
}
