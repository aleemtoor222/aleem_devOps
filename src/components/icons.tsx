// Inline SVG icons (no icon font). Brand marks are hand-drawn paths; UI icons follow lucide's 24px grid.
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({ viewBox: '0 0 24 24', 'aria-hidden': true as const, focusable: 'false' as const, className: 'icon', ...p });
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const GithubIcon = (p: P) => (
  <svg {...base(p)} fill="currentColor">
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

export const LinkedinIcon = (p: P) => (
  <svg {...base(p)} fill="currentColor">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
);

export const WhatsappIcon = (p: P) => (
  <svg {...base(p)} fill="currentColor">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35ZM12.04 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.44-5.03c0-5.21 4.24-9.45 9.47-9.45a9.4 9.4 0 0 1 6.69 2.78 9.39 9.39 0 0 1 2.77 6.69c0 5.21-4.25 9.44-9.46 9.44Zm8.05-17.5A11.33 11.33 0 0 0 12.04.66C5.77.66.66 5.76.66 12.04c0 2 .53 3.96 1.52 5.69L.57 23.6l6.02-1.58a11.36 11.36 0 0 0 5.44 1.39h.01c6.27 0 11.38-5.11 11.38-11.38 0-3.04-1.18-5.9-3.33-8.04Z" />
  </svg>
);

export const MailIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
export const PhoneIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);
export const DownloadIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);
export const ArrowDownIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </svg>
);
export const ArrowUpIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);
export const ArrowRightIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
export const ExternalIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);
export const CopyIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
export const AlertIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);
export const InfoIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
export const MenuIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const SearchIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
export const SunIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
export const MoonIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);
export const StarIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
  </svg>
);
export const UserPlusIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </svg>
);
export const SendIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);
export const TerminalIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="m4 17 6-6-6-6M12 19h8" />
  </svg>
);
export const LayersIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="m12 2 10 5-10 5L2 7l10-5Z" />
    <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
  </svg>
);
export const CodeIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
  </svg>
);
export const GitBranchIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M6 9v6M18 9a9 9 0 0 1-9 9" />
  </svg>
);
export const CloudIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
);
export const ActivityIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
export const WorkflowIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <rect x="3" y="3" width="8" height="8" rx="2" />
    <path d="M7 11v4a2 2 0 0 0 2 2h4" />
    <rect x="13" y="13" width="8" height="8" rx="2" />
  </svg>
);
export const BoxesIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M7.5 4.27 12 2l4.5 2.27v5.46L12 12 7.5 9.73Z" />
    <path d="M3 14.27 7.5 12 12 14.27v5.46L7.5 22 3 19.73ZM12 14.27 16.5 12l4.5 2.27v5.46L16.5 22 12 19.73Z" />
  </svg>
);
export const LockIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
export const GlobeIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
  </svg>
);
export const ServerIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <rect x="2" y="2" width="20" height="8" rx="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" />
    <path d="M6 6h.01M6 18h.01" />
  </svg>
);
export const AwardIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11" />
  </svg>
);
export const GraduationIcon = (p: P) => (
  <svg {...base(p)} {...stroke}>
    <path d="M22 10 12 5 2 10l10 5 10-5Z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
