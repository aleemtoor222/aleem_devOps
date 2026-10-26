'use client';

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { sections } from '@/content/derive';
import { profile } from '@/content/profile';
import { closeOnBackdrop, emit, scrollToId } from '@/lib/client';
import { asset, homeHash } from '@/lib/site';
import ThemeToggle from './ThemeToggle';
import SocialLinks from './SocialLinks';
import { CloseIcon, DownloadIcon, MenuIcon, SearchIcon } from './icons';

function Logo() {
  return (
    <>
      <span className="accent">~/</span>
      {profile.handle}
      <span className="muted">.dev</span>
    </>
  );
}

// Sticky glass header: border on scroll, scroll-spy, progress bar, ⌘K button, theme toggle, mobile menu
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [modKey, setModKey] = useState('⌘');
  const menuRef = useRef<HTMLDialogElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!/Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)) setModKey('Ctrl ');
    // The progress bar is a CSS scroll-driven animation; browsers without it get this fallback
    const noTimeline = !CSS.supports('animation-timeline: scroll()');
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 8);
      if (noTimeline && barRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Scroll-spy: the section crossing a band ~40% down the viewport is the active one
  useEffect(() => {
    const ids = new Set(sections.map((s) => s.id));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(ids.has(e.target.id) ? e.target.id : '');
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    document.querySelectorAll('main section[id]').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const openMenu = () => {
    menuRef.current?.showModal();
    setMenuOpen(true);
  };
  const closeMenu = () => menuRef.current?.close();
  const go = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    closeMenu();
    scrollToId(id, true);
  };

  return (
    <>
      <header data-site-header className="site-header" data-scrolled={scrolled || undefined}>
        <div className="container header-row">
          <a href={homeHash('top')} className="logo" aria-label={`${profile.name}, back to top`}>
            <Logo />
          </a>

          <nav aria-label="Main" className="nav-desktop">
            <ul>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={homeHash(s.id)} className="nav-link" aria-current={active === s.id ? 'true' : undefined}>
                    <span className="nav-idx">{s.index}.</span> {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="btn btn-ghost palette-btn"
              onClick={() => emit('open-palette', {})}
              aria-label="Open command palette"
              aria-keyshortcuts="Control+K Meta+K"
              data-tip="Search & commands"
              data-tip-pos="bottom"
            >
              <SearchIcon />
              <span className="kbd" aria-hidden="true">
                {modKey}K
              </span>
            </button>
            <ThemeToggle />
            <a href={homeHash('contact')} className="btn btn-primary btn-sm hire-btn">
              Hire me
            </a>
            <button
              type="button"
              className="btn btn-ghost btn-icon menu-btn"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={openMenu}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
        <div className="scroll-progress" aria-hidden="true">
          <span ref={barRef} />
        </div>
      </header>

      <dialog id="mobile-menu" ref={menuRef} className="menu" aria-label="Menu" onClose={() => setMenuOpen(false)} onClick={closeOnBackdrop}>
        <div className="menu-panel">
          <div className="menu-top">
            <span className="logo" aria-hidden="true">
              <Logo />
            </span>
            <button type="button" className="btn btn-ghost btn-icon" aria-label="Close menu" onClick={closeMenu}>
              <CloseIcon />
            </button>
          </div>
          <nav aria-label="Mobile">
            <ol className="menu-links">
              {sections.map((s, i) => (
                <li key={s.id} style={{ '--i': i } as CSSProperties}>
                  <a href={homeHash(s.id)} onClick={(e) => go(e, s.id)}>
                    <span className="nav-idx">{s.index}.</span> {s.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="menu-foot">
            <a className="btn btn-primary" href={asset(profile.cv.file)} download={profile.cv.downloadAs}>
              <DownloadIcon /> Download CV
            </a>
            <SocialLinks />
          </div>
        </div>
      </dialog>
    </>
  );
}
