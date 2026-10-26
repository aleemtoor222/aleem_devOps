'use client';

import { useState, type CSSProperties } from 'react';
import { pipeline, type Stage } from '@/content/profile';
import { stageTools } from '@/content/derive';
import { finePointer } from '@/lib/client';
import { SectionHeading } from './ui';
import { ActivityIcon, BoxesIcon, CheckIcon, GitBranchIcon, LockIcon, ServerIcon } from './icons';

const icons: Record<Stage, typeof GitBranchIcon> = { commit: GitBranchIcon, build: BoxesIcon, test: CheckIcon, scan: LockIcon, deploy: ServerIcon, monitor: ActivityIcon };

// commit → build → test → scan → deploy → monitor, with a light pulse travelling along the line.
// Hover (fine pointer) or tap a stage to see the tools used there (derived from the skills data).
export default function Pipeline() {
  const [active, setActive] = useState(0);
  return (
    <section id="ship" className="section ship" aria-labelledby="ship-title">
      <div className="container">
        <SectionHeading
          id="ship-title"
          label="how I ship"
          title="From commit to monitored in production"
          lead="The delivery loop behind every service I run. Hover or tap a stage to see the tools I use there."
        />
        <div className="pipeline" data-reveal>
          <div className="pipeline-track" aria-hidden="true">
            <span className="pipeline-pulse" />
          </div>
          <ol className="pipeline-stages">
            {pipeline.map((st, i) => {
              const Icon = icons[st.id];
              const tools = stageTools[st.id];
              const on = i === active;
              return (
                <li key={st.id} className="stage" data-active={on || undefined} style={{ '--i': i } as CSSProperties}>
                  <button
                    type="button"
                    className="stage-node"
                    aria-expanded={on}
                    aria-controls={`stage-${st.id}`}
                    onClick={() => setActive(i)}
                    onMouseEnter={() => finePointer() && setActive(i)}
                    onFocus={() => setActive(i)}
                  >
                    <span className="stage-dot">
                      <Icon />
                    </span>
                    <span className="stage-text">
                      <span className="stage-label">{st.label}</span>
                      <span className="stage-count">{tools.length} tools</span>
                    </span>
                  </button>
                  <div id={`stage-${st.id}`} className="stage-panel" hidden={!on}>
                    <p className="stage-cmd">
                      <span className="prompt">$</span> {st.command}
                    </p>
                    <p className="stage-summary">{st.summary}</p>
                    <ul className="stage-tools" aria-label={`Tools used at the ${st.label} stage`}>
                      {tools.map((t) => (
                        <li key={t} className="chip">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
