// Safe to import from server and client components.

/** Set at build time from PAGES_BASE_PATH (e.g. "/portfolio" on GitHub Pages project sites). */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** URL of a file in public/, prefixed with the base path so it works on GitHub Pages sub-paths. */
export const asset = (path: string) => `${basePath}/${path.replace(/^\/+/, '')}`;

/** Link to a section of the home page that also works from other pages (e.g. the 404 page). */
export const homeHash = (id: string) => `${basePath}/#${id}`;

export const THEME_COLORS = { dark: '#05070a', light: '#f6f3ec' } as const;
export type Theme = keyof typeof THEME_COLORS;
