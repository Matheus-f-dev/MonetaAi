import { AgentPipeline } from '../components/AgentPipeline';
import { SectionHead } from '../components/ui';
import { AGENT } from '../data/content';
import s from '../Landing.module.css';
import g from './Agent.module.css';

export function Agent() {
  return (
    <section id="agente" className={`${s.section} ${g.agent}`} aria-labelledby="agente-title">
      <div className={g.backdrop} aria-hidden="true" />
      <div className={`${s.wrap} ${g.layout}`}>
        <SectionHead
          id="agente-title"
          eyebrow={AGENT.eyebrow}
          title={AGENT.title}
          accent={AGENT.accent}
          lead={AGENT.lead}
          className={g.head}
        />
        <div className={g.demo} data-reveal="scale">
          <AgentPipeline />
        </div>
      </div>
    </section>
  );
}
