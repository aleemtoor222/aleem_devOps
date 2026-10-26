'use client';

import { useEffect, useState } from 'react';
import { profile } from '@/content/profile';

const format = () =>
  new Intl.DateTimeFormat('en-GB', { timeZone: profile.location.timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());

// Live local time ("Lahore · 14:05 PKT"); the server renders a placeholder, the client fills it in
export default function LocalTime() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setTime(format());
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="pill">
      <span>{profile.location.city}</span>
      <span aria-hidden="true">·</span>
      <span className="tnum">
        <time suppressHydrationWarning>{time ?? '--:--'}</time> {profile.location.zone}
      </span>
    </p>
  );
}
