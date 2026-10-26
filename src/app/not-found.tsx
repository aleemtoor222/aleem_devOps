// Terminal-style 404. Exported as 404.html in the static build; GitHub Pages serves it for any unknown path.
import type { Metadata } from 'next';
import Link from 'next/link';
import { TermBar } from '@/components/ui';
import { TerminalIcon } from '@/components/icons';
import { basePath } from '@/lib/site';

// Next.js adds <meta name="robots" content="noindex"> to this page by itself
export const metadata: Metadata = {
  title: '404: route not found',
};

// Shows the path the visitor actually asked for (without the base path), set before first paint
const pathScript = `(function(){var b=${JSON.stringify(basePath)},p=location.pathname;try{p=decodeURIComponent(p)}catch(e){}if(b&&p.indexOf(b)===0)p=p.slice(b.length)||'/';var el=document.getElementById('nf-path');if(el)el.textContent=p})()`;

export default function NotFound() {
  return (
    <section className="section nf" aria-labelledby="nf-title">
      <div className="container">
        <div className="nf-wrap">
          <p className="eyebrow">
            <span className="idx">{'// '}</span>error 404
          </p>
          <h1 id="nf-title" className="nf-title">
            Page not found
          </h1>

          <div className="term nf-term">
            <TermBar>~/aleem.dev $ bash</TermBar>
            <div className="term-body nf-body">
              <p>
                <span className="prompt">~ $</span> cd{' '}
                <span id="nf-path" className="nf-path" suppressHydrationWarning>
                  /requested/path
                </span>
              </p>
              <script dangerouslySetInnerHTML={{ __html: pathScript }} />
              <p className="nf-error">404: route not found</p>
              <p className="nf-hint">The link may be old or mistyped. Everything lives on the home page.</p>
              <p aria-hidden="true">
                <span className="prompt">~ $</span> <span className="nf-cursor" />
              </p>
            </div>
          </div>

          <Link href="/" className="btn btn-primary nf-home">
            <TerminalIcon />
            cd ~
            <span className="sr-only"> (go to the home page)</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
