// schema.org Person for search engines, rendered as a JSON-LD <script> in <head> (see app/layout.tsx).
// "<" is escaped as < so the payload can never close the script tag (Next.js JSON-LD guide).
import { profile, site } from '@/content/profile';

export function personJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.role,
    email: profile.email,
    telephone: profile.phone.e164,
    address: {
      '@type': 'PostalAddress',
      addressLocality: profile.location.city,
      addressCountry: 'PK',
    },
    ...(site.url ? { url: `${site.url}/` } : {}),
    sameAs: [profile.github, profile.linkedin],
    knowsAbout: profile.focus,
  };
}

export default function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()).replace(/</g, '\\u003c') }}
    />
  );
}
