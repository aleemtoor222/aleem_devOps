// 04 Contact: direct channels (with copy buttons and a vCard) and the Web3Forms message form.
// Server component; only the interactive pieces (form, copy, save) ship JavaScript.
import type { ComponentType, CSSProperties, SVGProps } from 'react';
import { sections } from '@/content/derive';
import { profile, WEB3FORMS_ACCESS_KEY } from '@/content/profile';
import { SectionHeading, TermBar } from '@/components/ui';
import { GithubIcon, LinkedinIcon, MailIcon, PhoneIcon, WhatsappIcon } from '@/components/icons';
import ContactForm from './ContactForm';
import CopyButton from './CopyButton';
import SaveContact from './SaveContact';
import { buildVCard, VCARD_FILENAME } from './vcard';

type Channel = {
  id: string;
  label: string;
  value: string;
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  external?: boolean;
  copy?: { value: string; toastLabel: string; what: string };
};

const bare = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
// Non-breaking spaces keep the number on one line (and satisfy html-validate's tel-non-breaking rule)
const phoneText = profile.phone.display.replace(/ /g, ' ');

const channels: Channel[] = [
  {
    id: 'email',
    label: 'Email',
    value: profile.email,
    href: `mailto:${profile.email}`,
    Icon: MailIcon,
    copy: { value: profile.email, toastLabel: 'Email', what: 'email address' },
  },
  {
    id: 'phone',
    label: 'Phone',
    value: phoneText,
    href: profile.phone.href,
    Icon: PhoneIcon,
    copy: { value: profile.phone.display, toastLabel: 'Phone number', what: 'phone number' },
  },
  { id: 'whatsapp', label: 'WhatsApp', value: phoneText, href: profile.whatsapp, Icon: WhatsappIcon, external: true },
  { id: 'github', label: 'GitHub', value: bare(profile.github), href: profile.github, Icon: GithubIcon, external: true },
  { id: 'linkedin', label: 'LinkedIn', value: bare(profile.linkedin), href: profile.linkedin, Icon: LinkedinIcon, external: true },
];

const index = sections.find((s) => s.id === 'contact')?.index;

export default function Contact() {
  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="container">
        <SectionHeading
          index={index}
          label="contact"
          id="contact-title"
          title="Let’s build something reliable"
          lead="Hiring for a DevOps, cloud or platform role, or need a hand with infrastructure? Send a message here, or reach me directly on any channel below."
        />

        <div className="contact-grid">
          <div className="contact-direct">
            <div className="contact-meta">
              {profile.availableForWork && (
                <span className="pill">
                  <span className="dot" aria-hidden="true" />
                  Open to new roles
                </span>
              )}
              <span className="contact-where">
                {profile.location.city}, {profile.location.country} · {profile.location.zone} (UTC+5)
              </span>
            </div>

            <ul className="contact-channels" data-reveal-stagger>
              {channels.map(({ id, label, value, href, Icon, external, copy }, i) => (
                <li key={id} className="contact-channel" data-channel={id} style={{ '--i': i } as CSSProperties}>
                  <span className="contact-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <a className="contact-link" href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    <span className="contact-label">{label}</span>
                    <span className="contact-value">{value}</span>
                    {external && <span className="sr-only"> (opens in a new tab)</span>}
                  </a>
                  {copy && <CopyButton value={copy.value} toastLabel={copy.toastLabel} what={copy.what} />}
                </li>
              ))}
            </ul>

            <div className="contact-save-row">
              <SaveContact vcard={buildVCard()} filename={VCARD_FILENAME} />
              <p className="contact-save-hint">Adds my email, phone and profiles to your address book.</p>
            </div>
          </div>

          <div className="term contact-form-term" data-reveal>
            <TermBar>~/contact $ ./send-message.sh</TermBar>
            <div className="term-body contact-form-body">
              <ContactForm to={profile.email} whatsapp={profile.whatsapp} accessKey={WEB3FORMS_ACCESS_KEY} />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
