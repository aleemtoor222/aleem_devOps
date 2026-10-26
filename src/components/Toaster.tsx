'use client';

import { useEffect, useState } from 'react';
import { on, type ToastKind } from '@/lib/client';
import { AlertIcon, CheckIcon, InfoIcon } from './icons';

type Toast = { id: number; message: string; kind: ToastKind; leaving?: boolean };
let seq = 0;

// Renders toasts from toast(); the region is always mounted so screen readers announce new ones
export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(
    () =>
      on('toast', ({ message, kind }) => {
        const id = ++seq;
        setToasts((t) => [...t.slice(-2), { id, message, kind }]);
        setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x))), 3400);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3700);
      }),
    [],
  );

  return (
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className="toast" data-kind={t.kind} data-leaving={t.leaving || undefined}>
          {t.kind === 'success' ? <CheckIcon /> : t.kind === 'error' ? <AlertIcon /> : <InfoIcon />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
