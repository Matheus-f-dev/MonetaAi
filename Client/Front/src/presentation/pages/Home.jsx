import '../styles/pages/home.css';
import { useSecureNavigation } from '../hooks/useSecureNavigation';
import { CHAPTERS } from '../components/landing/content';
import SiteHeader from '../components/landing/SiteHeader';
import ScrollScrub from '../components/landing/ScrollScrub';
import { CtaHero, CtaJourney } from '../components/landing/Ctas';
import Mechanics from '../components/landing/Mechanics';
import Capabilities from '../components/landing/Capabilities';
import Assurances from '../components/landing/Assurances';
import Plans from '../components/landing/Plans';
import Questions from '../components/landing/Questions';
import Closing from '../components/landing/Closing';
import SiteFooter from '../components/landing/SiteFooter';

export default function LandingPage() {
  const { secureNavigate } = useSecureNavigation();

  // Só o primeiro capítulo carrega CTA: os outros três são narrativa, e um
  // botão em cada um transformaria a jornada numa fileira de botões.
  const chapterActions = (index) =>
    index === 0 ? (
      <>
        <CtaHero onNavigate={secureNavigate} />
        <CtaJourney />
      </>
    ) : null;

  return (
    <div className="landing">
      <SiteHeader onNavigate={secureNavigate} />

      <main>
        <ScrollScrub scenes={CHAPTERS} renderActions={chapterActions} />
        <Mechanics />
        <Capabilities />
        <Assurances />
        <Plans onNavigate={secureNavigate} />
        <Questions />
        <Closing onNavigate={secureNavigate} />
      </main>

      <SiteFooter onNavigate={secureNavigate} />
    </div>
  );
}
