'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { profile, projects, type Category, type Project } from '@/content/profile';
import { categories } from '@/content/derive';
import { closeOnBackdrop, on, reducedMotion } from '@/lib/client';
import { TermBar, WindowDots } from '../ui';
import { CloseIcon, CodeIcon, ExternalIcon, MailIcon, WhatsappIcon } from '../icons';
import Diagram from './Diagram';

type Filter = 'All' | Category;
type SkillFilter = { name: string; slugs: string[] } | null;
type VTDoc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

// Bento spans: first card wide, last card fills the row, so the grid never has holes (3 cols / 2 cols)
function spans(n: number, i: number) {
  if (n === 1) return { lg: 3, md: 2 };
  const lg = (i === 0 && n % 3 !== 0) || (i === n - 1 && n % 3 === 1) ? 2 : 1;
  const md = i === 0 || (i === n - 1 && (n - 1) % 2 === 1) ? 2 : 1;
  return { lg, md };
}

export default function WorkGrid() {
  const [filter, setFilter] = useState<Filter>('All');
  const [skill, setSkill] = useState<SkillFilter>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const visible = projects.filter((p) => (filter === 'All' || p.categories.includes(filter)) && (!skill || skill.slugs.includes(p.slug)));

  // Smooth re-layout between filters with the View Transitions API (cards get names only meanwhile)
  const relayout = useCallback((update: () => void) => {
    const doc = document as VTDoc;
    const grid = gridRef.current;
    if (!doc.startViewTransition || reducedMotion() || !grid) return update();
    grid.dataset.vt = 'on';
    doc.startViewTransition(() => flushSync(update)).finished.finally(() => delete grid.dataset.vt);
  }, []);

  const choose = (f: Filter) => relayout(() => {
    setFilter(f);
    setSkill(null);
  });

  // Sliding indicator under the active tab (transform for position)
  useLayoutEffect(() => {
    const measure = () => {
      const el = tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (el) setIndicator({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (tabsRef.current) ro.observe(tabsRef.current);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [filter]);

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const all: Filter[] = ['All', ...categories];
    const i = all.indexOf(filter);
    const next = e.key === 'ArrowRight' ? all[(i + 1) % all.length] : e.key === 'ArrowLeft' ? all[(i - 1 + all.length) % all.length] : e.key === 'Home' ? all[0] : e.key === 'End' ? all[all.length - 1] : null;
    if (!next) return;
    e.preventDefault();
    choose(next);
    requestAnimationFrame(() => tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus());
  };

  // Case study modal: morphs out of its card where supported, deep link #<slug>
  const openProject = useCallback((slug: string, origin?: HTMLElement | null) => {
    const d = dialogRef.current;
    if (!d || !projects.some((p) => p.slug === slug)) return;
    const show = () => {
      flushSync(() => setOpenSlug(slug));
      if (!d.open) d.showModal();
      history.replaceState(null, '', `#${slug}`);
    };
    const doc = document as VTDoc;
    const card = origin?.closest<HTMLElement>('.project-card');
    const r = card?.getBoundingClientRect();
    if (!doc.startViewTransition || reducedMotion() || !card || !r || r.bottom < 0 || r.top > innerHeight || d.open) return show();
    card.style.viewTransitionName = 'case-morph';
    doc
      .startViewTransition(() => {
        card.style.viewTransitionName = '';
        d.style.viewTransitionName = 'case-morph';
        show();
      })
      .finished.finally(() => {
        d.style.viewTransitionName = '';
      });
  }, []);

  useEffect(() => {
    const fromHash = () => {
      const slug = decodeURIComponent(location.hash.slice(1));
      if (projects.some((p) => p.slug === slug)) openProject(slug);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    const offOpen = on('open-project', ({ slug }) => {
      document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((d) => d !== dialogRef.current && d.close());
      openProject(slug);
    });
    const offSkill = on('filter-skill', (s) =>
      relayout(() => {
        setFilter('All');
        setSkill(s);
      }),
    );
    return () => {
      window.removeEventListener('hashchange', fromHash);
      offOpen();
      offSkill();
    };
  }, [openProject, relayout]);

  const onClose = () => {
    setOpenSlug(null);
    if (projects.some((p) => `#${p.slug}` === location.hash)) history.replaceState(null, '', location.pathname + location.search);
  };

  const current = projects.find((p) => p.slug === openSlug);
  const all: Filter[] = ['All', ...categories];

  return (
    <>
      <div className="work-tools">
        <div className="tabs" role="tablist" aria-label="Filter projects by area" ref={tabsRef} onKeyDown={onTabKey}>
          <span
            className="tab-indicator"
            aria-hidden="true"
            data-ready={indicator ? 'true' : undefined}
            style={indicator ? { transform: `translateX(${indicator.x}px)`, width: indicator.w } : undefined}
          />
          {all.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              className="tab"
              aria-selected={filter === f && !skill}
              aria-controls="work-grid"
              tabIndex={filter === f ? 0 : -1}
              onClick={() => choose(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="work-count" aria-live="polite">
          {skill ? (
            <span className="skill-filter">
              {visible.length} project{visible.length === 1 ? '' : 's'} using <strong>{skill.name}</strong>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => choose('All')} aria-label={`Clear the ${skill.name} filter`}>
                <CloseIcon /> clear
              </button>
            </span>
          ) : (
            <span>
              {visible.length} of {projects.length} projects
            </span>
          )}
        </p>
      </div>

      <div id="work-grid" role="tabpanel" aria-label="Projects">
      <ul ref={gridRef} className="work-grid" data-reveal-stagger>
        {visible.map((p, i) => {
          const s = spans(visible.length, i);
          return (
            <li
              key={p.slug}
              className="work-item"
              data-lg={s.lg}
              data-md={s.md}
              data-highlight={skill ? 'true' : undefined}
              style={{ '--i': i, '--vt': `proj-${p.slug}` } as CSSProperties}
            >
              <ProjectCard project={p} wide={s.lg > 1} onOpen={openProject} />
            </li>
          );
        })}
      </ul>
      </div>

      <dialog ref={dialogRef} className="modal sheet case-modal" aria-labelledby="case-title" onClose={onClose} onClick={closeOnBackdrop}>
        {current && <CaseStudy project={current} onClose={() => dialogRef.current?.close()} />}
      </dialog>
    </>
  );
}

function ProjectCard({ project: p, wide, onOpen }: { project: Project; wide: boolean; onOpen: (slug: string, origin?: HTMLElement | null) => void }) {
  return (
    <article className="card project-card" id={p.slug} aria-labelledby={`${p.slug}-title`} data-wide={wide || undefined}>
      <div className="card-inner">
        <TermBar>{p.file}</TermBar>
        <div className="project-body">
          <p className="project-cat">
            {p.categories[0]}
            {p.featured && <span className="project-badge">featured</span>}
          </p>
          <h3 id={`${p.slug}-title`} className="project-title">
            {p.title}
          </h3>
          <p className="project-summary">{p.summary}</p>
          {p.impact && (
            <p className="project-impact">
              <span aria-hidden="true">↗</span> {p.impact}
            </p>
          )}
          <ul className="project-stack" aria-label="Tech stack">
            {p.stack.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
          </ul>
          {wide && (
            <div className="card-diagram" aria-hidden="true">
              <Diagram project={p} idPrefix="card" only="h" />
            </div>
          )}
          <div className="project-actions">
            <button type="button" className="btn btn-secondary btn-sm" aria-haspopup="dialog" onClick={(e) => onOpen(p.slug, e.currentTarget)}>
              Case study <span className="sr-only">: {p.title}</span>
            </button>
            {p.links.code && (
              <a className="btn btn-ghost btn-sm" href={p.links.code} target="_blank" rel="noopener noreferrer">
                <CodeIcon /> Code <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function CaseStudy({ project: p, onClose }: { project: Project; onClose: () => void }) {
  const cs = p.caseStudy;
  const list = (items: string[]) => (
    <ul className="case-list">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
  const ask = `mailto:${profile.email}?subject=${encodeURIComponent(`About: ${p.title}`)}`;
  const blocks: [string, ReactNode][] = [];
  if (cs.problem) blocks.push(['Problem', <p key="p">{cs.problem}</p>]);
  blocks.push(['Architecture', <Diagram key="d" project={p} />]);
  blocks.push(['What I did', list(cs.did)]);
  if (cs.decisions?.length) blocks.push(['Key decisions', list(cs.decisions)]);
  if (cs.results?.length) blocks.push(['Results', list(cs.results)]);
  if (cs.improve?.length) blocks.push(['What I’d improve', list(cs.improve)]);
  blocks.push([
    'Links',
    <div key="l" className="case-links">
      {p.links.code && (
        <a className="btn btn-secondary btn-sm" href={p.links.code} target="_blank" rel="noopener noreferrer">
          <CodeIcon /> Source code <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
      {p.links.demo && (
        <a className="btn btn-secondary btn-sm" href={p.links.demo} target="_blank" rel="noopener noreferrer">
          <ExternalIcon /> Live demo <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
      <a className="btn btn-secondary btn-sm" href={ask}>
        <MailIcon /> Ask me about it
      </a>
      <a className="btn btn-ghost btn-sm" href={profile.whatsapp} target="_blank" rel="noopener noreferrer">
        <WhatsappIcon /> WhatsApp <span className="sr-only">(opens in a new tab)</span>
      </a>
    </div>,
  ]);

  return (
    <>
      <div className="modal-head">
        <WindowDots />
        <p className="term-title">~/work/{p.slug}.md</p>
        <button type="button" className="btn btn-ghost btn-icon ml-auto" aria-label="Close case study" onClick={onClose} autoFocus>
          <CloseIcon />
        </button>
      </div>
      <div className="modal-body">
        <p className="project-cat">{p.categories.join(' · ')}</p>
        <h2 id="case-title" className="case-title">
          {p.title}
        </h2>
        <p className="lead">{p.summary}</p>
        <ul className="project-stack case-stack" aria-label="Tech stack">
          {p.stack.map((t) => (
            <li key={t} className="chip">
              {t}
            </li>
          ))}
        </ul>
        {blocks.map(([title, body], i) => (
          <section key={title} className="case-section" aria-label={title}>
            <h3>
              <span className="num">{String(i + 1).padStart(2, '0')}</span> {title}
            </h3>
            {body}
          </section>
        ))}
      </div>
    </>
  );
}
