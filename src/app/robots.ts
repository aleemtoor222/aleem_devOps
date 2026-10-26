import type { MetadataRoute } from 'next';
import { site } from '@/content/profile';

// Rendered once at build time (required for the static GitHub Pages export)
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    ...(site.url ? { sitemap: `${site.url}/sitemap.xml` } : {}),
  };
}
