'use client';

import './globals.css';
import { Broken } from './error';
import { Door } from './door';

/** The root layout itself failed: the same panel, on its own document. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <Door signedIn={false}>
          <Broken reset={reset} />
        </Door>
      </body>
    </html>
  );
}
