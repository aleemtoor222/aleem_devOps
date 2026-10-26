'use client';

import { toast } from '@/lib/client';
import { UserPlusIcon } from '@/components/icons';

/** Downloads the vCard (built on the server from profile.ts) as a .vcf file, created in the browser. */
export default function SaveContact({ vcard, filename }: { vcard: string; filename: string }) {
  function download() {
    const url = URL.createObjectURL(new Blob([vcard], { type: 'text/vcard;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Contact card downloaded', 'success');
  }

  return (
    <button type="button" className="btn btn-secondary contact-save" onClick={download}>
      <UserPlusIcon />
      Save contact
      <span className="contact-save-ext">.vcf</span>
    </button>
  );
}
