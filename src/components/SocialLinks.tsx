import { profile } from '@/content/profile';
import { GithubIcon, LinkedinIcon, MailIcon, WhatsappIcon } from './icons';

export const socials = [
  { id: 'github', label: 'GitHub', href: profile.github, Icon: GithubIcon, external: true },
  { id: 'linkedin', label: 'LinkedIn', href: profile.linkedin, Icon: LinkedinIcon, external: true },
  { id: 'whatsapp', label: 'WhatsApp', href: profile.whatsapp, Icon: WhatsappIcon, external: true },
  { id: 'email', label: 'Email', href: `mailto:${profile.email}`, Icon: MailIcon, external: false },
];

// Icon buttons with tooltips: GitHub / LinkedIn / WhatsApp / Email
export default function SocialLinks({ className = '', tipPos }: { className?: string; tipPos?: 'bottom' }) {
  return (
    <ul className={`social-row ${className}`} aria-label="Profiles and contact">
      {socials.map(({ id, label, href, Icon, external }) => (
        <li key={id}>
          <a
            href={href}
            className="btn btn-ghost btn-icon"
            aria-label={external ? `${label} (opens in a new tab)` : `Email ${profile.email}`}
            data-tip={label}
            data-tip-pos={tipPos}
            {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
          >
            <Icon />
          </a>
        </li>
      ))}
    </ul>
  );
}
