import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/charts.css';
import './styles/panel.css';
import './styles/masthead.css';
import './styles/hero.css';
import './styles/sections.css';

import { useSecureNavigation } from '../hooks/useSecureNavigation';
import { useAppearance } from './lib/useAppearance';

import Masthead from './sections/Masthead';
import Hero from './sections/Hero';
import Problem from './sections/Problem';
import Mechanic from './sections/Mechanic';
import Intelligence from './sections/Intelligence';
import Product from './sections/Product';
import Features from './sections/Features';
import Security from './sections/Security';
import Outcome from './sections/Outcome';
import Plans from './sections/Plans';
import Questions from './sections/Questions';
import Closing from './sections/Closing';
import Foot from './sections/Foot';

// ============================================================================
// A página. A ordem das seções É a narrativa, e ela está aqui, legível de uma
// vez, em vez de espalhada:
//
//   hero        o que é, em cinco segundos, com o produto na tela
//   01 problema por que isso é difícil hoje
//   02 mecânica como a MonetaAI resolve a parte chata
//   03 IA       por que organizar não basta
//   04 produto  a vida financeira inteira em uma vista
//   05 recursos o que isso muda no mês de quem usa
//   06 seguran. por que confiar os próprios dados
//   07 result.  a promessa, sem número inventado
//   08 planos   quanto custa
//   09 pergunt. as objeções que sobram
//   fecho       a ação
// ============================================================================
export default function LandingPage() {
  const { secureNavigate } = useSecureNavigation();
  const appearance = useAppearance();

  return (
    <div className="mn" data-appearance={appearance}>
      <a className="mn-skip" href="#mn-main">Pular para o conteúdo</a>

      <Masthead onNavigate={secureNavigate} />

      <main id="mn-main">
        <Hero onNavigate={secureNavigate} />
        <Problem />
        <Mechanic />
        <Intelligence />
        <Product />
        <Features />
        <Security />
        <Outcome />
        <Plans onNavigate={secureNavigate} />
        <Questions />
        <Closing onNavigate={secureNavigate} />
      </main>

      <Foot onNavigate={secureNavigate} />
    </div>
  );
}
