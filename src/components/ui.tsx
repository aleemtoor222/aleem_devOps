import type { ReactNode } from 'react';

// "// 01 work" eyebrow, then the section title and an optional lead paragraph
export function SectionHeading({ index, label, title, lead, id }: { index?: string; label: string; title: string; lead?: ReactNode; id: string }) {
  return (
    <div className="section-head" data-reveal>
      <p className="eyebrow">
        <span className="idx">// {index ? `${index} ` : ''}</span>
        {label}
      </p>
      <h2 id={id} className="section-title">
        {title}
      </h2>
      {lead && <p className="lead">{lead}</p>}
    </div>
  );
}

// The three window dots used on terminal and card title bars
export function WindowDots() {
  return (
    <span className="term-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

/** Terminal-window title bar: dots + a mono caption (e.g. "~/skills $ kubectl get pods -A"). */
export function TermBar({ children, end }: { children: ReactNode; end?: ReactNode }) {
  return (
    <div className="term-bar">
      <WindowDots />
      <p className="term-title">{children}</p>
      {end && <div className="ml-auto flex items-center gap-1">{end}</div>}
    </div>
  );
}
