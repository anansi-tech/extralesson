import { afterEach, describe, expect, it } from 'vitest';
import { baseUrl, externalBaseUrl } from '@/lib/base-url';

const KEYS = ['NEXT_PUBLIC_BASE_URL', 'VERCEL_PROJECT_PRODUCTION_URL', 'VERCEL_URL', 'NODE_ENV'] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('where this deployment lives', () => {
  it('prefers explicit configuration, without a trailing slash', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://extralesson.com/';
    expect(baseUrl()).toBe('https://extralesson.com');
  });

  it('falls back to the platform, which is not request input', () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'extralesson.vercel.app';
    expect(baseUrl()).toBe('https://extralesson.vercel.app');
  });

  it('is localhost only when nothing says otherwise', () => {
    for (const k of ['NEXT_PUBLIC_BASE_URL', 'VERCEL_PROJECT_PRODUCTION_URL', 'VERCEL_URL']) delete process.env[k];
    expect(baseUrl()).toBe('http://localhost:3000');
  });

  it('refuses to put localhost in an email from production', () => {
    // A sitemap saying localhost is embarrassing. A reset link saying localhost
    // is an account nobody can get back into, so this throws rather than sends.
    for (const k of ['NEXT_PUBLIC_BASE_URL', 'VERCEL_PROJECT_PRODUCTION_URL', 'VERCEL_URL']) delete process.env[k];
    process.env.NODE_ENV = 'production';
    expect(() => externalBaseUrl()).toThrow(/NEXT_PUBLIC_BASE_URL/);
  });

  it('allows localhost in development, where it is correct', () => {
    for (const k of ['NEXT_PUBLIC_BASE_URL', 'VERCEL_PROJECT_PRODUCTION_URL', 'VERCEL_URL']) delete process.env[k];
    process.env.NODE_ENV = 'development';
    expect(externalBaseUrl()).toBe('http://localhost:3000');
  });
});
