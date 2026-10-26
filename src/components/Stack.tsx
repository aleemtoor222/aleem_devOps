import type { CSSProperties } from 'react';
import { skills } from '@/content/profile';
import { partName, partProjects, sections, skillCount, skillProjects, toolCount } from '@/content/derive';
import { SectionHeading, TermBar } from './ui';
import SkillChip from './SkillChip';
import { ActivityIcon, BoxesIcon, CloudIcon, GlobeIcon, LockIcon, TerminalIcon, WorkflowIcon } from './icons';

const icons: Record<string, typeof CloudIcon> = {
  cloud: CloudIcon,
  monitoring: ActivityIcon,
  cicd: WorkflowIcon,
  containers: BoxesIcon,
  security: LockIcon,
  web: GlobeIcon,
  linux: TerminalIcon,
};

// Balanced bento: 3 columns with two wide cards (3 + 3 + 3 cells), 2 columns on tablets, 1 on phones
export default function Stack() {
  return (
    <section id="stack" className="section" aria-labelledby="stack-title">
      <div className="container">
        <SectionHeading
          id="stack-title"
          index={sections.find((s) => s.id === 'stack')?.index}
          label="stack"
          title="The toolchain I run in production"
          lead={`${toolCount} tools across ${skills.length} areas. Tools marked with a number appear in the projects above: select one to see them.`}
        />
        <ul className="bento" data-reveal-stagger>
          {skills.map((g, i) => {
            const Icon = icons[g.id] ?? BoxesIcon;
            const n = skillCount(g);
            return (
              <li key={g.id} className={`bento-item${g.wide ? ' is-wide' : ''}`} style={{ '--i': i } as CSSProperties}>
                <article className="card skill-card" aria-labelledby={`skill-${g.id}`}>
                  <div className="card-inner">
                    <TermBar>
                      <span className="accent">~/skills</span> $ {g.command}
                    </TermBar>
                    <div className="skill-body">
                      <div className="skill-head">
                        <span className="skill-icon">
                          <Icon />
                        </span>
                        <div>
                          <h3 id={`skill-${g.id}`}>{g.title}</h3>
                          <p className="skill-count">
                            {n} {n === 1 ? 'skill' : 'skills'}
                          </p>
                        </div>
                      </div>
                      <ul className="skill-list">
                        {g.items.map((it) =>
                          it.parts ? (
                            <li key={it.name} className="skill-group">
                              <p className="skill-group-name">
                                {skillProjects(it).length ? <SkillChip name={it.name} note={it.note} slugs={skillProjects(it)} /> : it.name}
                              </p>
                              <ul className="skill-parts" aria-label={`${it.name}: ${it.parts.map(partName).join(', ')}`}>
                                {it.parts.map((p) => (
                                  <li key={partName(p)}>
                                    <SkillChip sub name={partName(p)} slugs={partProjects(p)} />
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ) : (
                            <li key={it.name}>
                              <SkillChip name={it.name} note={it.note} slugs={skillProjects(it)} />
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
