import type { MetadataRoute } from 'next';
import { site } from '@/content/profile';
import { readBuildInfo } from '@/components/contact/build-info';

// Rendered once at build time (required for the static GitHub Pages export)
export const dynamic = 'force-static';

// One page site. Without a public URL (local or self-hosted builds) the sitemap is empty.
export default function sitemap(): MetadataRoute.Sitemap {
  if (!site.url) return [];
  const build = readBuildInfo();
  return [{ url: `${site.url}/`, lastModified: build?.date ?? new Date(), changeFrequency: 'monthly', priority: 1 }];
}
