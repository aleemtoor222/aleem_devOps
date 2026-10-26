'use client';

import { emit, scrollToId } from '@/lib/client';

// A skill used by projects becomes a button: it filters Work to those projects and jumps there
export default function SkillChip({ name, note, slugs, sub }: { name: string; note?: string; slugs: string[]; sub?: boolean }) {
  const cls = `chip${sub ? ' chip-sub' : ''}`;
  const label = (
    <>
      {name}
      {note && <span className="note">· {note}</span>}
    </>
  );
  if (!slugs.length) return <span className={cls}>{label}</span>;
  const n = slugs.length;
  return (
    <button
      type="button"
      className={cls}
      aria-label={`${name}: show the ${n} project${n === 1 ? '' : 's'} that use it`}
      onClick={() => {
        emit('filter-skill', { name, slugs });
        scrollToId('work');
      }}
    >
      {label}
      <span className="chip-count" aria-hidden="true">
        {n}
      </span>
    </button>
  );
}
