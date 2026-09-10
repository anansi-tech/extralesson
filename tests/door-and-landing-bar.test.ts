import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium, type Browser } from 'playwright-core';
import { bodyPage } from './helpers/chrome-page';

const state = vi.hoisted(() => ({
  session: null as { student_id: string; email: string; role: string } | null,
  student: null as { exam_sitting: string; access?: unknown } | null,
}));
vi.mock('@/lib/auth/session', () => ({
  getSession: async () => state.session,
  requireSession: async () => state.session,
}));
vi.mock('next/navigation', () => ({ usePathname: () => '/study/login' }));
vi.mock('@/lib/db', () => ({
  dbConnect: async () => {},
  Student: { findById: () => ({ select: () => ({ lean: async () => state.student }) }) },
  Payment: { findOne: () => ({ select: () => ({ lean: async () => null }) }) },
}));

const LoginPage = (await import('@/app/(door)/study/login/page')).default;
const LandingPage = (await import('@/app/page')).default;

const APP = join(process.cwd(), 'app');
const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const LANDING_CSS = at('app', 'landing.css').replace(/@import[^;]+;/g, '');

const SIGNED_IN = { student_id: '000000000000000000000001', email: 'kiara@example.com', role: 'student' };
const NO_ACCESS = { exam_sitting: 'jan-2027', access: null };
const PAID = { exam_sitting: 'jan-2027', access: { sitting: 'jan-2027', granted_at: new Date(), source: 'stripe' } };

/** Every page.tsx under app/, as a route path with the group segments dropped. */
function routes(): { file: string; route: string }[] {
  const found: { file: string; route: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === 'page.tsx') {
        const segments = relative(APP, dirname(full)).split(sep).filter((s) => s && !s.startsWith('('));
        found.push({ file: full, route: `/${segments.join('/')}` });
      }
    }
  };
  walk(APP);
  return found;
}

/**
 * The layouts Next would wrap a page in, outermost first. The root layout is
 * left out: it is the document itself, not a bar drawn over the page.
 */
function layoutsOver(file: string): string[] {
  const chain: string[] = [];
  for (let dir = dirname(file); dir.startsWith(APP); dir = dirname(dir)) {
    const layout = join(dir, 'layout.tsx');
    if (existsSync(layout) && layout !== join(APP, 'layout.tsx')) chain.unshift(layout);
  }
  return chain;
}

/** The route as Next composes it, so a chrome that applies is a chrome that shows. */
async function composeRoute(file: string, page: ReactElement): Promise<ReactElement> {
  let node = page;
  for (const layout of layoutsOver(file).reverse()) {
    const Layout = (await import(pathToFileURL(layout).href)).default;
    node = await Layout({ children: node });
  }
  return node;
}

const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

async function open(markup: string, width: number) {
  const p = await browser.newPage({ viewport: { width, height: 900 } });
  await p.setContent(bodyPage(markup, LANDING_CSS), { waitUntil: 'networkidle' });
  return p;
}

// A DOOR IS ITS OWN SHELL. It used to sit under app/study/, whose layout draws
// the notebook chrome for anyone signed in, so a signed-in visitor met two bars.
describe('the door never renders inside the study chrome', () => {
  it('no door is under a layout that draws the chrome', () => {
    const doors = routes().filter(({ file }) => readFileSync(file, 'utf8').includes('<Door'));
    expect(doors.map((d) => d.route).sort()).toEqual(['/study/login', '/study/reset']);
    for (const door of doors) {
      const chrome = layoutsOver(door.file).filter((l) => readFileSync(l, 'utf8').includes('StudyChrome'));
      expect(chrome, door.route).toEqual([]);
    }
  });

  // The control on the two measurements below: a route that IS under the chrome
  // composes with it, so counting one bar on the door is a fact about the door.
  it('the same harness draws the chrome over a notebook route', async () => {
    state.session = SIGNED_IN;
    state.student = PAID;
    const history = routes().find((r) => r.route === '/study/history')!;
    const html = renderToStaticMarkup(await composeRoute(history.file, createElement('p', null, 'the page')));
    expect(html).toContain('the page');
    expect((html.match(/<header/g) ?? []).length).toBe(1);
    expect(html).toContain('Sign out');
    expect(html).toContain('History');
  });

  for (const width of [390, 1280]) {
    it(`shows one bar and the way out to a signed-in visitor at ${width}px`, async () => {
      if (!hasChrome) return;
      state.session = SIGNED_IN;
      state.student = PAID;
      const route = routes().find((r) => r.route === '/study/login')!;
      const composed = await composeRoute(route.file, await LoginPage({ searchParams: Promise.resolve({}) }));
      const p = await open(renderToStaticMarkup(composed), width);
      const seen = await p.evaluate(() => ({
        bars: document.querySelectorAll('header').length,
        tabs: [...document.querySelectorAll('a')].map((a) => a.textContent?.trim()).filter((t) => t === 'History' || t === 'Progress').length,
        account: document.body.innerText.includes('Account'),
        wayOut: [...document.querySelectorAll('button')].some((b) => b.textContent?.trim() === 'Sign out'),
        width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      }));
      await p.close();
      expect(seen.bars, 'one bar').toBe(1);
      expect(seen.tabs, 'no notebook tabs').toBe(0);
      expect(seen.account, 'no account disclosure').toBe(false);
      expect(seen.wayOut, 'the door carries the way out').toBe(true);
      expect(seen.width).toBe(width);
    }, 60000);
  }
});

// THE LANDING SPEAKS TO WHOEVER IS READING IT. A student who is signed in has
// an account already: the create door is not their way to the free question,
// and the bar is not a place to sign in again.
describe('the landing bar and the free question', () => {
  const landing = async (session: typeof SIGNED_IN | null, student: typeof NO_ACCESS | typeof PAID | null) => {
    state.session = session;
    state.student = student;
    return renderToStaticMarkup(await LandingPage());
  };
  const links = (p: Awaited<ReturnType<typeof open>>) =>
    p.evaluate(() =>
      [...document.querySelectorAll('a')].map((a) => ({
        text: (a.textContent ?? '').replace(/\s+/g, ' ').trim(),
        href: a.getAttribute('href') ?? '',
        wide: a.getBoundingClientRect().right,
      })),
    );

  for (const width of [390, 1280]) {
    it(`sends a signed-in student to their notebook, never to the create door, at ${width}px`, async () => {
      if (!hasChrome) return;
      const p = await open(await landing(SIGNED_IN, NO_ACCESS), width);
      const all = await links(p);
      const bar = await p.evaluate(() => {
        const a = document.querySelector('.bar a.authlink');
        return a ? { text: a.textContent?.trim(), href: a.getAttribute('href'), visible: a.getBoundingClientRect().width > 0 } : null;
      });
      await p.close();
      expect(bar).toEqual({ text: 'Your notebook', href: '/study', visible: true });
      expect(all.filter((a) => a.href.includes('new=1'))).toEqual([]);
      const free = all.filter((a) => a.text.startsWith('Mark one question free'));
      expect(free.length).toBeGreaterThan(0);
      for (const a of free) expect(a.href).toBe('/study');
      for (const a of all) expect(a.wide, a.text).toBeLessThanOrEqual(width);
    }, 60000);

    it(`keeps Sign in and the create door for a signed-out visitor at ${width}px`, async () => {
      if (!hasChrome) return;
      const p = await open(await landing(null, null), width);
      const all = await links(p);
      const bar = await p.evaluate(() => {
        const a = document.querySelector('.bar a.authlink');
        return a ? { text: a.textContent?.trim(), href: a.getAttribute('href'), visible: a.getBoundingClientRect().width > 0 } : null;
      });
      await p.close();
      expect(bar).toEqual({ text: 'Sign in', href: '/study/login', visible: true });
      const free = all.filter((a) => a.text.startsWith('Mark one question free'));
      expect(free.length).toBeGreaterThan(0);
      for (const a of free) expect(a.href).toBe('/study/login?new=1');
    }, 60000);
  }

  it('a paid student is still led to the notebook, and is not sold to again', async () => {
    const html = await landing(SIGNED_IN, PAID);
    expect(html).not.toContain('new=1');
    expect(html).toContain('Continue studying');
  });
});
