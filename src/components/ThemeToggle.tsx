'use client';

import { toggleTheme } from '@/lib/client';
import { MoonIcon, SunIcon } from './icons';

// The icon shown is picked by CSS from [data-theme], so server and client render the same markup
export default function ThemeToggle() {
  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon theme-toggle"
      aria-label="Toggle light and dark theme"
      data-tip="Theme"
      data-tip-pos="bottom"
      onClick={(e) => toggleTheme(e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : undefined)}
    >
      <SunIcon className="icon theme-icon-sun" />
      <MoonIcon className="icon theme-icon-moon" />
    </button>
  );
}
