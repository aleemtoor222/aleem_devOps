'use client';

import { useEffect, useState } from 'react';
import { profile } from '@/content/profile';
import { homeHash } from '@/lib/site';
import { ArrowUpIcon, WhatsappIcon } from './icons';

// Bottom-right WhatsApp + back-to-top. Both hide while the contact section or footer is on screen
// (so they never cover the form or footer text); CSS hides them while any dialog is open.
export default function FloatingActions() {
  const [pastHero, setPastHero] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 1.1);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const inView = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? inView.add(e.target) : inView.delete(e.target);
      setBlocked(inView.size > 0);
    });
    document.querySelectorAll('#contact, body > footer').forEach((el) => io.observe(el));
    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  const showTop = pastHero && !blocked;
  return (
    <div className="fab-stack no-print">
      <a href={homeHash('top')} className="fab fab-top" aria-label="Back to top" data-tip="Back to top" inert={!showTop}>
        <ArrowUpIcon />
      </a>
      <a
        href={profile.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="fab fab-wa"
        aria-label="Chat on WhatsApp (opens in a new tab)"
        data-tip="WhatsApp me"
        inert={blocked}
      >
        <WhatsappIcon />
      </a>
    </div>
  );
}
