// Where this deployment lives, for the links we put in other people's hands.
//
// It was `process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'`, written
// out three times, and the variable was not in .env.example — so nothing told
// anyone to set it, and the default is a URL that means "this machine". In a
// password-reset email that is not a broken link, it is a link that silently
// points at the reader's own computer.
//
// The order matters, and the omission matters more: the request's Host header
// is NOT consulted. Deriving a reset link's origin from a header the caller
// controls is how a reset token gets mailed to an attacker's domain — they
// request a reset for your address with a forged Host, and the link in YOUR
// inbox points at their server. Everything below comes from configuration or
// from the platform, never from the request.

function trim(url: string): string {
  return url.replace(/\/+$/, '');
}

export function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return trim(process.env.NEXT_PUBLIC_BASE_URL);

  // Vercel sets these itself. They are platform facts, not request input.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${trim(vercel)}`;

  return 'http://localhost:3000';
}

/**
 * The same, for a link that is about to leave the building.
 *
 * A sitemap that says localhost is embarrassing; a reset link that says
 * localhost is an account nobody can get back into. In production this refuses
 * rather than mails a link that cannot work.
 */
export function externalBaseUrl(): string {
  const url = baseUrl();
  if (process.env.NODE_ENV === 'production' && url.startsWith('http://localhost')) {
    throw new Error(
      'NEXT_PUBLIC_BASE_URL is not set, so an outbound link would point at localhost. Set it to the deployed origin.',
    );
  }
  return url;
}
