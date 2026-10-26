// vCard 3.0 (RFC 2426) for the "Save contact" button. Built from profile.ts, so it never drifts from the site.
import { profile, site } from '@/content/profile';

export const VCARD_FILENAME = 'muhammad-aleem.vcf';

/** Escape a text value: backslash, newline, comma and semicolon (RFC 2426 §5). */
export const vcardEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

/** Fold lines longer than 75 octets (continuation lines start with a space). */
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = '';
      size = 0;
    }
    current += ch;
    size += n;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

export function buildVCard() {
  const [given, ...rest] = profile.name.split(' ');
  const family = rest.join(' ');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${vcardEscape(family)};${vcardEscape(given)};;;`,
    `FN:${vcardEscape(profile.name)}`,
    `TITLE:${vcardEscape(profile.role)}`,
    `TEL;TYPE=CELL:${profile.phone.e164}`,
    `EMAIL;TYPE=INTERNET:${profile.email}`,
    `ADR;TYPE=WORK:;;;${vcardEscape(profile.location.city)};;;${vcardEscape(profile.location.country)}`,
    `URL:${profile.github}`,
    `URL:${profile.linkedin}`,
    ...(site.url ? [`URL:${site.url}/`] : []),
    'END:VCARD',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}
