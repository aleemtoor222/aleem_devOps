// Site footer. The navigation, icons and build line are screen-only (no-print); the name, year and a compact
// contact line stay on paper.
import { sections } from '@/content/derive';
import { profile } from '@/content/profile';
import { homeHash } from '@/lib/site';
import { ArrowUpIcon, GithubIcon, LinkedinIcon, MailIcon, WhatsappIcon } from '@/components/icons';
import { readBuildInfo } from '@/components/contact/build-info';

const social = [
  { label: 'Email', href: `mailto:${profile.email}`, Icon: MailIcon, external: false },
  { label: 'WhatsApp', href: profile.whatsapp, Icon: WhatsappIcon, external: true },
  { label: 'GitHub', href: profile.github, Icon: GithubIcon, external: true },
  { label: 'LinkedIn', href: profile.linkedin, Icon: LinkedinIcon, external: true },
];

// The year is rendered at build time; this runs while the HTML is parsed and swaps in the visitor's current year
// before first paint (see node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md).
const yearScript = `(function(){var e=document.getElementById('footer-year');if(e)e.textContent=String(new Date().getFullYear())})()`;

export default function Footer() {
  const build = readBuildInfo();
  const buildYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <p className="footer-logo" translate="no">
              <span className="accent">~/</span>
              {profile.handle}
              <span className="footer-logo-tld">.dev</span>
            </p>
            <p className="footer-copy">
              © <span id="footer-year" suppressHydrationWarning>{buildYear}</span> {profile.name}
            </p>
            <script dangerouslySetInnerHTML={{ __html: yearScript }} />
            <p className="footer-print print-only">
              {profile.role} · {profile.email} · {profile.phone.display} · {profile.location.city}, {profile.location.country}
            </p>
          </div>

          {/* Section links point at the home page (homeHash), so they also work from the 404 page */}
          <nav className="footer-nav no-print" aria-label="Footer">
            <ul>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={homeHash(s.id)}>
                    <span className="footer-nav-idx" aria-hidden="true">
                      {s.index}
                    </span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer-actions no-print">
            <ul className="footer-social">
              {social.map(({ label, href, Icon, external }) => (
                <li key={label}>
                  <a
                    className="btn btn-ghost btn-icon"
                    href={href}
                    aria-label={external ? `${label} (opens in a new tab)` : label}
                    data-tip={label}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <Icon />
                  </a>
                </li>
              ))}
            </ul>
            <a className="btn btn-secondary footer-top" href={homeHash('top')}>
              <ArrowUpIcon />
              Back to top
            </a>
          </div>
        </div>

        {build && (
          <p className="footer-build no-print">
            deployed via GitHub Actions · build <code>{build.sha}</code> · updated <time dateTime={build.date}>{build.date}</time>
          </p>
        )}
      </div>
    </footer>
  );
}
