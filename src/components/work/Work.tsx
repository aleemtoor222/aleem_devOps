import { sections } from '@/content/derive';
import { SectionHeading } from '../ui';
import WorkGrid from './WorkGrid';

export default function Work() {
  return (
    <section id="work" className="section" aria-labelledby="work-title">
      <div className="container">
        <SectionHeading
          id="work-title"
          index={sections.find((s) => s.id === 'work')?.index}
          label="work"
          title="Infrastructure I’ve built and run"
          lead="Orchestration, pipelines, observability, security and networking. Open a case study for the architecture and what I did."
        />
        <WorkGrid />
      </div>
    </section>
  );
}
