// Browser-only helpers shared by client components. Components talk through window events,
// so no React context is needed and server components stay server components.
import { homeHash, THEME_COLORS, type Theme } from './site';

type AppEvents = {
  toast: { message: string; kind: ToastKind };
  'open-project': { slug: string; origin?: HTMLElement | null };
  'filter-skill': { name: string; slugs: string[] };
  'open-palette': Record<string, never>;
};
export type ToastKind = 'success' | 'error' | 'info';

export function emit<K extends keyof AppEvents>(name: K, detail: AppEvents[K]) {
  window.dispatchEvent(new CustomEvent(`app:${name}`, { detail }));
}

export function on<K extends keyof AppEvents>(name: K, handler: (detail: AppEvents[K]) => void) {
  const fn = (e: Event) => handler((e as CustomEvent<AppEvents[K]>).detail);
  window.addEventListener(`app:${name}`, fn);
  return () => window.removeEventListener(`app:${name}`, fn);
}

/** Show a toast (rendered by <Toaster/>, announced politely to screen readers). */
export const toast = (message: string, kind: ToastKind = 'info') => emit('toast', { message, kind });

export async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Older browsers / insecure contexts: fall back to a hidden textarea
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    if (!ok) return toast(`Couldn’t copy. ${label}: ${text}`, 'error');
  }
  toast(`${label} copied`, 'success');
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Smooth-scroll to a section (the sticky-header offset comes from scroll-margin-top in CSS). */
export function scrollToId(id: string, focus = false) {
  const el = document.getElementById(id);
  // Not on this page (e.g. the 404 page): go to the home page section instead
  if (!el) return void (window.location.href = homeHash(id));
  el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', `#${id}`);
  if (focus) {
    const target = el.querySelector<HTMLElement>('h2, h1') ?? el;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
}

// ----- Theme ---------------------------------------------------------------------------------
export const getTheme = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', THEME_COLORS[theme]));
  try {
    localStorage.setItem('theme', theme);
  } catch {}
  window.dispatchEvent(new CustomEvent('app:theme', { detail: theme }));
}

/** Switch theme with a circular reveal from `origin` (View Transitions API), or instantly. */
export function setTheme(theme: Theme, origin?: { x: number; y: number }) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || reducedMotion()) return applyTheme(theme);
  const x = origin?.x ?? window.innerWidth - 40;
  const y = origin?.y ?? 32;
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const root = document.documentElement;
  root.style.setProperty('--vt-x', `${x}px`);
  root.style.setProperty('--vt-y', `${y}px`);
  root.style.setProperty('--vt-r', `${r}px`);
  root.classList.add('theme-vt');
  const vt = doc.startViewTransition(() => applyTheme(theme)) as { finished: Promise<void> };
  vt.finished.finally(() => root.classList.remove('theme-vt'));
}

export const toggleTheme = (origin?: { x: number; y: number }) => setTheme(getTheme() === 'dark' ? 'light' : 'dark', origin);

/** Native <dialog> helpers: close on backdrop click (clicks that land on the dialog box itself). */
export function closeOnBackdrop(e: React.MouseEvent<HTMLDialogElement>) {
  if (e.target === e.currentTarget) e.currentTarget.close();
}
