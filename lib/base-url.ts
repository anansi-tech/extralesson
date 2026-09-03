// Where this deployment lives, for the links we put in other people's hands.
// The request's Host header is NEVER consulted: deriving a reset link's origin
// from a header the caller controls is how a token gets mailed to an attacker's
// domain. Everything below comes from configuration or from the platform.

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
 * For a link that is about to leave the building. A reset link saying localhost
 * is an account nobody can get back into, so in production this refuses rather
 * than mails a link that cannot work.
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
