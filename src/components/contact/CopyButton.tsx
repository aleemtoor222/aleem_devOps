'use client';

import { useEffect, useRef, useState } from 'react';
import { copyText } from '@/lib/client';
import { CheckIcon, CopyIcon } from '@/components/icons';

/** Icon button that copies `value` and confirms with a toast ("<toastLabel> copied") and a brief check mark. */
export default function CopyButton({ value, toastLabel, what }: { value: string; toastLabel: string; what: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function onClick() {
    await copyText(value, toastLabel);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon contact-copy"
      aria-label={`Copy ${what}`}
      data-tip={copied ? 'Copied' : `Copy ${what}`}
      data-copied={copied ? 'true' : undefined}
      onClick={onClick}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}
