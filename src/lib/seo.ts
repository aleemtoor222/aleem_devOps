// Site-wide metadata (title, description, canonical, Open Graph, Twitter card). Used by app/layout.tsx.
// Absolute URLs (canonical, og:url, og:image) are only emitted when site.url is known: the GitHub Pages
// workflow sets it at build time, and a local or self-hosted build simply leaves them out.
import type { Metadata } from 'next';
import { profile, site } from '@/content/profile';

const title = `${profile.name} | ${profile.role} · ${profile.focus.slice(0, 3).join(' · ')}`;
const shortTitle = `${profile.name} · ${profile.role}`;
const ogImageAlt = `${profile.name}, ${profile.role}: ${profile.focus.join(', ')}`;

// Every keyword is a fact from src/content/profile.ts (name, role, focus areas, tools, location)
const keywords = [
  profile.name,
  profile.role,
  ...profile.focus,
  'DevSecOps',
  'Docker',
  'Helm',
  'Prometheus',
  'Grafana',
  'Jenkins',
  'GitHub Actions',
  'Linux',
  profile.location.city,
  profile.location.country,
];

const pageUrl = site.url ? `${site.url}/` : undefined;
const ogImage = site.url
  ? [{ url: `${site.url}/assets/og-image.png`, width: 1200, height: 630, alt: ogImageAlt, type: 'image/png' }]
  : undefined;

export const siteMetadata: Metadata = {
  ...(site.url ? { metadataBase: new URL(`${site.url}/`) } : {}),
  title: { default: title, template: `%s | ${profile.name}` },
  description: profile.description,
  applicationName: shortTitle,
  authors: [{ name: profile.name, url: profile.github }],
  creator: profile.name,
  keywords,
  ...(pageUrl ? { alternates: { canonical: pageUrl } } : {}),
  openGraph: {
    type: 'profile',
    title,
    description: profile.description,
    siteName: shortTitle,
    locale: 'en_US',
    ...(pageUrl ? { url: pageUrl } : {}),
    ...(ogImage ? { images: ogImage } : {}),
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: profile.description,
    ...(ogImage ? { images: ogImage.map(({ url, alt }) => ({ url, alt })) } : {}),
  },
};
