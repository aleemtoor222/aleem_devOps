import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CSSProperties } from 'react';
import { hero, profile } from '@/content/profile';
import { stats } from '@/content/derive';
import { asset } from '@/lib/site';
import SocialLinks from '../SocialLinks';
import { ArrowDownIcon, DownloadIcon, MailIcon } from '../icons';
import HeroTerminal from './HeroTerminal';
import LocalTime from './LocalTime';

// Checked at build time: the CV button only links to a file that exists in public/
const hasCv = existsSync(join(process.cwd(), 'public', profile.cv.file));

export default function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-title" data-spot>
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-grid-bg" />
        <div className="hero-glow" />
        <div className="hero-spot" />
      </div>

      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="hero-chips">
            {profile.availableForWork && (
              <p className="pill">
                <span className="dot" aria-hidden="true" />
                Available for work
              </p>
            )}
            <LocalTime />
          </div>

          <p className="hero-role">
            {profile.name} <span aria-hidden="true">·</span> {profile.role}
          </p>
          {/* Not animated in: it is the largest element on first paint */}
          <h1 id="hero-title" className="hero-title">
            {hero.title[0]} <span className="shimmer">{hero.title[1]}</span>
          </h1>
          <p className="hero-intro">{hero.intro}</p>

          <div className="hero-ctas">
            {hasCv ? (
              <a href={asset(profile.cv.file)} download={profile.cv.downloadAs} className="btn btn-primary magnetic">
                <DownloadIcon /> Download CV
              </a>
            ) : (
              <a href={`mailto:${profile.email}?subject=${encodeURIComponent('CV request')}`} className="btn btn-primary magnetic">
                <MailIcon /> Request CV
              </a>
            )}
            <a href="#work" className="btn btn-secondary">
              View work <ArrowDownIcon />
            </a>
            <SocialLinks className="hero-social" />
          </div>

          <dl className="stats">
            {stats.map((s) => (
              <div key={s.label} className="stat">
                <dt>{s.label}</dt>
                <dd>
                  <span className="count" data-suffix={s.suffix} style={{ '--to': s.value, '--digits': String(s.value).length + s.suffix.length } as CSSProperties} aria-hidden="true" />
                  <span className="sr-only">
                    {s.value}
                    {s.suffix}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <HeroTerminal />
      </div>
    </section>
  );
}
