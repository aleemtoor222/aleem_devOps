import { Fragment } from 'react';
import { about, certifications, experience } from '@/content/profile';
import { sections, shortHash } from '@/content/derive';
import { SectionHeading, TermBar } from './ui';
import { AwardIcon, ExternalIcon, GraduationIcon } from './icons';

// Highlight measurable results (40%, 99.9%) inside CV bullets
function withMetrics(text: string) {
  return text.split(/(\d+(?:\.\d+)?%)/).map((part, i) =>
    /^\d+(?:\.\d+)?%$/.test(part) ? (
      <strong key={i} className="metric">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export default function Experience() {
  return (
    <section id="experience" className="section" aria-labelledby="experience-title">
      <div className="container">
        <SectionHeading
          id="experience-title"
          index={sections.find((s) => s.id === 'experience')?.index}
          label="experience"
          title="Where I’ve shipped"
          lead="Three roles across DevOps and Linux administration, from production servers to Kubernetes platforms."
        />
        <div className="exp-grid">
          <article className="card about-card" data-reveal aria-labelledby="about-title">
            <div className="card-inner">
              <TermBar>~/about $ cat README.md</TermBar>
              <div className="about-body">
                <h3 id="about-title">About</h3>
                <p>{about.summary}</p>
                <ul className="strengths" aria-label="Strengths">
                  {about.strengths.map((s) => (
                    <li key={s} className="chip">
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="edu">
                  <GraduationIcon />
                  <span>
                    {about.education.degree} <span className="muted">·</span> {about.education.school}
                  </span>
                </p>
              </div>
            </div>
          </article>

          <div className="term exp-log" data-reveal>
            <TermBar>~/career $ git log --graph --oneline</TermBar>
            <ol className="git-log">
              {experience.map((r, i) => (
                <li key={r.company} className="commit">
                  <span className="commit-graph" aria-hidden="true">
                    <span className="commit-node" />
                  </span>
                  <div className="commit-body">
                    <p className="commit-head">
                      <span className="hash">{shortHash(r.company + r.start)}</span>
                      {i === 0 && (
                        <span className="ref">
                          (HEAD -&gt; <b>main</b>)
                        </span>
                      )}
                      <span className="commit-date">
                        {r.start} – {r.end}
                      </span>
                    </p>
                    <h3 className="commit-title">
                      {r.role} <span className="muted">@</span> {r.company}
                      {r.companyNote && <span className="commit-note"> ({r.companyNote})</span>}
                    </h3>
                    <p className="commit-type">{r.type}</p>
                    <ul className="commit-bullets">
                      {r.bullets.map((b) => (
                        <li key={b}>{withMetrics(b)}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {certifications.length > 0 && (
          <div className="certs">
            <h3 className="certs-title">Certifications</h3>
            <ul className="certs-grid" data-reveal-stagger>
              {certifications.map((c, i) => (
                <li key={c.name} className="card cert-card" style={{ '--i': i } as React.CSSProperties}>
                  <div className="card-inner cert-body">
                    <span className="cert-badge" aria-hidden="true">
                      {c.badge ?? <AwardIcon />}
                    </span>
                    <h4>{c.name}</h4>
                    <p className="muted">
                      {c.issuer} · {c.date}
                    </p>
                    {c.verifyUrl && (
                      <a className="btn btn-ghost btn-sm" href={c.verifyUrl} target="_blank" rel="noopener noreferrer">
                        Verify <ExternalIcon /> <span className="sr-only">{c.name} (opens in a new tab)</span>
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
