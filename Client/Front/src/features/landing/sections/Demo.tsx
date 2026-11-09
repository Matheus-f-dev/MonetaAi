import { SandboxDemo } from '../components/SandboxDemo';
import { SectionHead } from '../components/ui';
import { DEMO } from '../data/content';
import s from '../Landing.module.css';
import d from './Demo.module.css';

export function Demo() {
  return (
    <section id="demo" className={`${s.section} ${d.demo}`} aria-labelledby="demo-title">
      <div className={s.wrap}>
        <SectionHead
          id="demo-title"
          eyebrow={DEMO.eyebrow}
          title={DEMO.title}
          accent={DEMO.accent}
          lead={DEMO.lead}
          className={d.head}
        />
        <div className={d.body} data-reveal="scale">
          <SandboxDemo />
        </div>
      </div>
    </section>
  );
}
