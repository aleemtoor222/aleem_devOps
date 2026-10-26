'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { experience, profile, projects, skills, terminalIntro } from '@/content/profile';
import { skillCount } from '@/content/derive';
import { emit, getTheme, reducedMotion, scrollToId, toggleTheme } from '@/lib/client';
import { asset } from '@/lib/site';
import { TermBar } from '../ui';

type Line = { text: string; tone?: 'muted' | 'ok' | 'err' | 'accent'; href?: string; action?: () => void };
type Entry = { id: number; cmd: string; lines: Line[] };

const COMMANDS = ['help', 'whoami', 'skills', 'projects', 'experience', 'contact', 'cv', 'whatsapp', 'github', 'linkedin', 'theme', 'clear', 'sudo hire-me'];
const CHIPS = ['help', 'whoami', 'skills', 'projects', 'contact', 'sudo hire-me'];
const HELP: [string, string][] = [
  ['whoami', 'who I am'],
  ['skills', 'the stack, by area'],
  ['projects', 'things I have built'],
  ['experience', 'where I have worked'],
  ['contact', 'how to reach me'],
  ['cv', 'download my CV'],
  ['whatsapp | github | linkedin', 'open a profile'],
  ['theme', 'toggle light / dark'],
  ['clear', 'clear the screen'],
];

const openTab = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

function execute(raw: string): Line[] | 'clear' {
  const cmd = raw.trim().replace(/\s+/g, ' ').toLowerCase();
  switch (cmd) {
    case '':
      return [];
    case 'help':
      return [{ text: 'available commands:', tone: 'muted' }, ...HELP.map(([c, d]) => ({ text: `  ${c.padEnd(30)}${d}` })), { text: 'tip: ↑ ↓ history · Tab completes', tone: 'muted' }];
    case 'whoami':
      return [
        { text: `${profile.name} · ${profile.role}`, tone: 'accent' },
        { text: `${profile.location.city}, ${profile.location.country} · ${profile.focus.join(' · ')}` },
        { text: '3+ years automating deployments and running cloud infrastructure as code.', tone: 'muted' },
      ];
    case 'skills':
      return skills.map((g) => ({ text: `${g.title.padEnd(32)}${skillCount(g)} skills` }));
    case 'projects':
      return [...projects.map((p) => ({ text: `▸ ${p.title}`, action: () => emit('open-project', { slug: p.slug }) })), { text: 'select a project to open its case study', tone: 'muted' }];
    case 'experience':
      return experience.length
        ? experience.map((r) => ({ text: `${`${r.start} – ${r.end}`.padEnd(22)}${r.role} @ ${r.company}` }))
        : [{ text: 'details are in my CV: type cv', tone: 'muted' }];
    case 'contact':
      return [
        { text: `email     ${profile.email}`, href: `mailto:${profile.email}` },
        { text: `phone     ${profile.phone.display}`, href: profile.phone.href },
        { text: 'whatsapp  chat on WhatsApp', href: profile.whatsapp },
        { text: `github    ${profile.github.replace('https://', '')}`, href: profile.github },
        { text: `linkedin  ${profile.linkedin.replace('https://www.', '')}`, href: profile.linkedin },
      ];
    case 'cv': {
      const a = document.createElement('a');
      a.href = asset(profile.cv.file);
      a.download = profile.cv.downloadAs;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return [{ text: `downloading ${profile.cv.downloadAs} …`, tone: 'ok' }];
    }
    case 'whatsapp':
      openTab(profile.whatsapp);
      return [{ text: 'opening WhatsApp in a new tab …', tone: 'ok' }];
    case 'github':
      openTab(profile.github);
      return [{ text: 'opening GitHub in a new tab …', tone: 'ok' }];
    case 'linkedin':
      openTab(profile.linkedin);
      return [{ text: 'opening LinkedIn in a new tab …', tone: 'ok' }];
    case 'theme': {
      const next = getTheme() === 'dark' ? 'light' : 'dark';
      toggleTheme();
      return [{ text: `theme → ${next}`, tone: 'ok' }];
    }
    case 'clear':
      return 'clear';
    case 'sudo hire-me':
      setTimeout(() => {
        scrollToId('contact');
        setTimeout(() => document.querySelector<HTMLInputElement>('#contact form input[name="name"]')?.focus({ preventScroll: true }), 800);
      }, 900);
      return [
        { text: '[sudo] password for recruiter: ********', tone: 'muted' },
        { text: '✓ access granted. opening a secure channel to Aleem …', tone: 'ok' },
      ];
    default:
      if (cmd.startsWith('sudo')) return [{ text: 'sudo: permission denied. try: sudo hire-me', tone: 'err' }];
      return [{ text: `command not found: ${cmd} — try help`, tone: 'err' }];
  }
}

// Types the intro once, then becomes a real prompt (history, Tab completion, clickable chips)
export default function HeroTerminal() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [chars, setChars] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [value, setValue] = useState('');
  const history = useRef<string[]>([]);
  const hIdx = useRef(-1);
  const seq = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const introDone = step >= terminalIntro.length;

  useEffect(() => {
    if (reducedMotion()) return setStep(terminalIntro.length);
    // Wait for an idle moment after load so the typing never competes with hydration
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const begin = () => setTimeout(() => setStarted(true), 400);
    if (w.requestIdleCallback) w.requestIdleCallback(begin, { timeout: 2000 });
    else setTimeout(begin, 800);
  }, []);

  useEffect(() => {
    if (introDone || !started) return;
    const line = terminalIntro[step];
    if (line.kind === 'cmd' && chars < line.text.length) {
      const t = setTimeout(() => setChars((c) => c + 1), 32);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setStep((s) => s + 1);
      setChars(0);
    }, line.kind === 'cmd' ? 240 : 380);
    return () => clearTimeout(t);
  }, [introDone, started, step, chars]);

  useEffect(() => {
    const b = bodyRef.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [entries, step, chars]);

  const skipIntro = () => {
    if (!introDone) {
      setStep(terminalIntro.length);
      setChars(0);
    }
  };

  const print = (cmd: string, lines: Line[]) => setEntries((e) => [...e.slice(-40), { id: ++seq.current, cmd, lines }]);

  const submit = (raw: string) => {
    skipIntro();
    const cmd = raw.trim();
    if (cmd) history.current.push(cmd);
    hIdx.current = -1;
    const out = execute(cmd);
    if (out === 'clear') {
      setEntries([]);
      setCleared(true);
    } else print(cmd, out);
    setValue('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const h = history.current;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!h.length) return;
      hIdx.current = hIdx.current < 0 ? h.length - 1 : Math.max(0, hIdx.current - 1);
      setValue(h[hIdx.current]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIdx.current < 0) return;
      hIdx.current += 1;
      if (hIdx.current >= h.length) {
        hIdx.current = -1;
        setValue('');
      } else setValue(h[hIdx.current]);
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // Only complete when there is something to complete; otherwise Tab moves focus as usual
      const v = value.trim().toLowerCase();
      const matches = v ? COMMANDS.filter((c) => c.startsWith(v)) : [];
      if (!matches.length) return;
      e.preventDefault();
      if (matches.length === 1) setValue(matches[0]);
      else print(value, [{ text: matches.join('   '), tone: 'muted' }]);
    }
  };

  const shown = cleared ? [] : terminalIntro.slice(0, step);
  const typing = !cleared && !introDone && terminalIntro[step].kind === 'cmd' ? terminalIntro[step].text.slice(0, chars) : null;

  return (
    <div className="hero-term-wrap" data-hero-term>
      <div
        className="term hero-term"
        onClick={(e) => {
          if (!(e.target as Element).closest('a, button')) inputRef.current?.focus({ preventScroll: true });
        }}
      >
        <TermBar>aleem@prod-01: ~</TermBar>
        <div className="term-body hero-term-body" ref={bodyRef}>
          <p className="sr-only">
            Terminal intro: {terminalIntro.map((l) => (l.kind === 'cmd' ? `$ ${l.text}` : l.text)).join('. ')}.
          </p>
          <div aria-hidden="true">
            {shown.map((l, i) =>
              l.kind === 'cmd' ? (
                <p key={i} className="t-cmd">
                  <span className="prompt">$</span> {l.text}
                </p>
              ) : (
                <p key={i} className={l.kind === 'ok' ? 't-ok t-indent' : 't-muted t-indent'}>
                  {l.kind === 'ok' && '✓ '}
                  {l.text}
                </p>
              ),
            )}
            {typing !== null && (
              <p className="t-cmd">
                <span className="prompt">$</span> {typing}
                <span className="cursor" />
              </p>
            )}
            {introDone && !cleared && entries.length === 0 && <p className="t-muted">type help, or tap a command below</p>}
          </div>
          <div role="log" aria-live="polite" aria-label="Terminal output" className="term-log">
            {entries.map((en) => (
              <div key={en.id}>
                <p className="t-cmd">
                  <span className="prompt">$</span> {en.cmd}
                </p>
                {en.lines.map((l, i) => (
                  <p key={i} className={`t-${l.tone ?? 'out'}`}>
                    {l.href ? (
                      <a className="term-link" href={l.href} {...(l.href.startsWith('http') && { target: '_blank', rel: 'noopener noreferrer' })}>
                        {l.text}
                      </a>
                    ) : l.action ? (
                      <button type="button" className="term-link" onClick={l.action}>
                        {l.text}
                      </button>
                    ) : (
                      l.text
                    )}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <form
            className="term-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              submit(value);
            }}
          >
            <label htmlFor="term-input" className="prompt">
              $<span className="sr-only">Terminal command (type help and press Enter)</span>
            </label>
            <input
              id="term-input"
              ref={inputRef}
              type="text"
              className="term-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={skipIntro}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
            />
            <button type="submit" className="sr-only">
              Run command
            </button>
          </form>
        </div>
      </div>
      <div className="term-chips" role="group" aria-label="Quick terminal commands">
        {CHIPS.map((c) => (
          <button key={c} type="button" className="chip" onClick={() => submit(c)}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
