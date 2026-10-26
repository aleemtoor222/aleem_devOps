'use client';

import { useEffect, useLayoutEffect } from 'react';
import { THEME_COLORS } from '@/lib/site';
import { finePointer, reducedMotion } from '@/lib/client';

// One place for page-wide effects, so sections can stay server components:
// theme re-apply (dev remounts), scroll-reveal fallback, pointer spotlight and magnetic buttons.
export default function Effects() {
  // The inline <head> script already did this before paint. In development React's Strict Mode
  // remount resets <html> attributes, so apply the same values again (a no-op in production).
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add('js');
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('theme');
    } catch {}
    const theme = saved === 'light' || saved === 'dark' ? saved : matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    // A saved choice overrides the media-query theme-color tags
    if (saved) document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', THEME_COLORS[theme]));
  }, []);

  // Scroll reveal: CSS scroll-driven animations do it natively; otherwise IntersectionObserver
  useEffect(() => {
    if (CSS.supports('animation-timeline: view()') || reducedMotion()) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    const observe = () => document.querySelectorAll('[data-reveal]:not(.is-in), [data-reveal-stagger]:not(.is-in)').forEach((el) => io.observe(el));
    observe();
    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  // Spotlight that follows the pointer on cards and the hero, plus magnetic primary buttons.
  // Fine pointers only, never with reduced motion. Positions go into CSS variables (no re-render).
  useEffect(() => {
    if (!finePointer() || reducedMotion()) return;
    let raf = 0;
    let last: PointerEvent | null = null;
    let magnet: HTMLElement | null = null;

    const frame = () => {
      raf = 0;
      const e = last;
      if (!e) return;
      const target = e.target instanceof Element ? e.target : null;
      const spot = target?.closest<HTMLElement>('.card-inner, [data-spot]');
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty('--mx', `${e.clientX - r.left}px`);
        spot.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
      const m = target?.closest<HTMLElement>('.magnetic') ?? null;
      if (magnet && magnet !== m) magnet.style.translate = '';
      magnet = m;
      if (m) {
        const r = m.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        m.style.translate = `${(dx * 6).toFixed(1)}px ${(dy * 4).toFixed(1)}px`;
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      last = e;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onLeave = () => {
      if (magnet) magnet.style.translate = '';
      magnet = null;
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
