// Privacy-friendly page counts with GoatCounter (no cookies). Off until site.goatcounterCode is set.
import Script from 'next/script';
import { site } from '@/content/profile';

export default function Analytics() {
  // TODO: create a free GoatCounter site and put its code in site.goatcounterCode (src/content/profile.ts).
  // On the self-hosted server, also allow gc.zgo.at and <code>.goatcounter.com in the CSP (next.config.ts).
  if (!site.goatcounterCode) return null;
  return (
    <Script
      src="https://gc.zgo.at/count.js"
      data-goatcounter={`https://${site.goatcounterCode}.goatcounter.com/count`}
      strategy="afterInteractive"
    />
  );
}
