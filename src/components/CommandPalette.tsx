'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { hasExperience } from '@/content/derive';
import { profile, projects } from '@/content/profile';
import { closeOnBackdrop, copyText, emit, on, scrollToId, toggleTheme } from '@/lib/client';
import { asset } from '@/lib/site';
import { ArrowRightIcon, CopyIcon, DownloadIcon, GithubIcon, LayersIcon, LinkedinIcon, MoonIcon, PhoneIcon, SearchIcon, WhatsappIcon } from './icons';

type Item = { id: string; group: 'Go to' | 'Case studies' | 'Actions'; label: string; hint?: string; keywords?: string; icon: ReactNode; run: () => void };

const openUrl = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

function downloadCv() {
  const a = document.createElement('a');
  a.href = asset(profile.cv.file);
  a.download = profile.cv.downloadAs;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function buildItems(): Item[] {
  const go = (id: string, label: string, keywords = ''): Item => ({ id: `go-${id}`, group: 'Go to', label, keywords, icon: <ArrowRightIcon />, run: () => scrollToId(id, true) });
  return [
    go('top', 'Home', 'hero top start'),
    go('ship', 'How I ship', 'pipeline ci cd'),
    go('work', 'Work', 'projects portfolio'),
    go('stack', 'Stack', 'skills tools'),
    ...(hasExperience ? [go('experience', 'Experience', 'jobs career about cv')] : []),
    go('contact', 'Contact', 'hire email form message'),
    ...projects.map<Item>((p) => ({
      id: `case-${p.slug}`,
      group: 'Case studies',
      label: p.title,
      hint: p.categories[0],
      keywords: p.stack.join(' '),
      icon: <LayersIcon />,
      run: () => emit('open-project', { slug: p.slug }),
    })),
    { id: 'copy-email', group: 'Actions', label: 'Copy email address', hint: profile.email, keywords: 'mail', icon: <CopyIcon />, run: () => copyText(profile.email, 'Email') },
    { id: 'copy-phone', group: 'Actions', label: 'Copy phone number', hint: profile.phone.display, keywords: 'call mobile', icon: <PhoneIcon />, run: () => copyText(profile.phone.display, 'Phone number') },
    { id: 'whatsapp', group: 'Actions', label: 'Open WhatsApp chat', keywords: 'message chat', icon: <WhatsappIcon />, run: () => openUrl(profile.whatsapp) },
    { id: 'cv', group: 'Actions', label: 'Download CV', hint: 'PDF', keywords: 'resume', icon: <DownloadIcon />, run: downloadCv },
    { id: 'theme', group: 'Actions', label: 'Toggle light / dark theme', keywords: 'mode color appearance', icon: <MoonIcon />, run: () => toggleTheme() },
    { id: 'github', group: 'Actions', label: 'Open GitHub profile', keywords: 'code repos', icon: <GithubIcon />, run: () => openUrl(profile.github) },
    { id: 'linkedin', group: 'Actions', label: 'Open LinkedIn profile', keywords: 'social', icon: <LinkedinIcon />, run: () => openUrl(profile.linkedin) },
  ];
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const startsWord = (word: string, text: string) => new RegExp(`(^|[^a-z0-9])${escapeRe(word)}`).test(text);

// Ranking tiers: exact and word matches always beat loose subsequence matches
function rank(query: string, it: Item) {
  const q = query.trim().toLowerCase();
  const label = it.label.toLowerCase();
  const hay = `${label} ${it.keywords ?? ''} ${it.hint ?? ''}`.toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  if (label.startsWith(q)) return 1000;
  if (words.every((w) => startsWord(w, label))) return 800;
  if (label.includes(q)) return 600;
  if (words.every((w) => startsWord(w, hay))) return 400;
  if (hay.includes(q)) return 300;
  return Math.min(200, Math.max(score(q, label) * 1.5, score(q, hay)));
}

// Fuzzy score: every query character must appear in order; consecutive runs and word starts score higher
function score(query: string, text: string) {
  const q = query.toLowerCase().replace(/\s+/g, '');
  const t = text.toLowerCase();
  if (!q) return 1;
  let ti = 0;
  let s = 0;
  let run = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found < 0) return 0;
    run = found === ti ? run + 1 : 0;
    s += 1 + run * 2 + (found === 0 || /[\s\-/(]/.test(t[found - 1]) ? 3 : 0);
    ti = found + 1;
  }
  return s - t.length * 0.01;
}

export default function CommandPalette() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const items = useMemo(buildItems, []);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    if (!query.trim()) return items;
    return items
      .map((it, i) => ({ it, i, s: rank(query, it) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map((r) => r.it);
  }, [items, query]);

  const open = () => {
    const d = dialogRef.current;
    if (!d || d.open) return;
    setQuery('');
    setActive(0);
    document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((other) => other.close());
    d.showModal();
    inputRef.current?.focus();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (dialogRef.current?.open) dialogRef.current.close();
        else open();
      }
    };
    window.addEventListener('keydown', onKey);
    const off = on('open-palette', open);
    return () => {
      window.removeEventListener('keydown', onKey);
      off();
    };
  }, []);

  // Keep the highlighted option in view
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, results]);

  const run = (item: Item | undefined) => {
    if (!item) return;
    dialogRef.current?.close();
    // Let the dialog close (and the page scroll lock lift) before acting
    requestAnimationFrame(() => item.run());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey && results.length)) {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(results.length, 1));
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey && results.length)) {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === 'Home') {
      setActive(0);
    } else if (e.key === 'End') {
      setActive(Math.max(results.length - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(results[active]);
    }
  };

  let lastGroup = '';
  return (
    <dialog ref={dialogRef} className="palette" aria-label="Command palette" onClick={closeOnBackdrop}>
      <div className="palette-box">
        <div className="palette-search">
          <SearchIcon />
          <input
            ref={inputRef}
            className="palette-input"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-autocomplete="list"
            aria-activedescendant={results[active] ? `pal-${results[active].id}` : undefined}
            aria-label="Search sections, case studies and actions"
            placeholder="Type a command or search…"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
          />
          <button type="button" className="kbd palette-esc" onClick={() => dialogRef.current?.close()} aria-label="Close command palette">
            Esc
          </button>
        </div>
        <ul id="palette-list" ref={listRef} className="palette-list" role="listbox" aria-label="Results">
          {results.map((it, i) => {
            const header = !query.trim() && it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            return (
              <li key={it.id} role="presentation">
                {header && (
                  <p className="palette-group" aria-hidden="true">
                    {header}
                  </p>
                )}
                <div
                  id={`pal-${it.id}`}
                  role="option"
                  aria-selected={i === active}
                  className="palette-item"
                  onMouseMove={() => setActive(i)}
                  onClick={() => run(it)}
                >
                  <span className="palette-icon">{it.icon}</span>
                  <span className="palette-label">{it.label}</span>
                  {it.hint && <span className="palette-hint">{it.hint}</span>}
                </div>
              </li>
            );
          })}
          {results.length === 0 && (
            <li role="presentation" className="palette-empty">
              No matches for “{query}”. Try “contact”, “cv” or a tool name like “helm”.
            </li>
          )}
        </ul>
        <p className="palette-foot" aria-hidden="true">
          <span>
            <span className="kbd">↑</span> <span className="kbd">↓</span> navigate
          </span>
          <span>
            <span className="kbd">↵</span> select
          </span>
          <span>
            <span className="kbd">Esc</span> close
          </span>
        </p>
      </div>
    </dialog>
  );
}
