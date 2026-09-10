import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Lockup } from '@/app/lockup';

// The chrome as study-chrome.tsx renders it, as static markup, so a page's
// markup can be measured in Chrome with the site's own stylesheet.
const css =
  // KaTeX clips its stretchy glyphs with its own stylesheet; without it an
  // arrow is a 400em SVG and the page is thousands of pixels wide.
  readFileSync(join(process.cwd(), 'node_modules', 'katex', 'dist', 'katex.min.css'), 'utf8') +
  readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')
    .replace(/@import[^;]+;/g, '')
    .replace(/@theme inline \{[\s\S]*?\n\}/, '');

const TAILWIND_CONFIG = `tailwind.config={theme:{extend:{colors:{ink:'#1e2430',paper:'#fbf7ee','paper-deep':'#f1eada',margin:'#e4b8b4',rule:'#c9d6e8',dim:'#5b6373',amber:'#d9a62e','red-pen':'#c1121f','green-pen':'#2e7d5b'},fontFamily:{mono:['IBM Plex Mono','monospace'],hand:['Caveat','cursive']}}}}`;

/**
 * The app's own fonts: next/font writes them into the build, so the harness
 * reads the @font-face rules from the last build and inlines the files. With
 * no build on disk the Google stylesheet in the page head stands in.
 */
function fontFaces(): string {
  const dist = ['.next-push', '.next'].map((d) => join(process.cwd(), d, 'static')).find((d) => existsSync(join(d, 'css')));
  if (!dist) return '';
  const faces = readdirSync(join(dist, 'css'))
    .flatMap((f) => readFileSync(join(dist, 'css', f), 'utf8').match(/@font-face\{[^}]*\}/g) ?? [])
    .map((face) =>
      face.replace(/url\(\/_next\/static\/media\/([^)]+)\)/g, (_m, file) => {
        const p = join(dist, 'media', file);
        return existsSync(p) ? `url(data:font/woff2;base64,${readFileSync(p).toString('base64')})` : `url(${file})`;
      }),
    );
  return faces.join('');
}
const FONTS = fontFaces() + `:root{--font-fraunces:'Fraunces';--font-plex-mono:'IBM Plex Mono';--font-caveat:'Caveat'}`;

const TABS = [
  { href: '/study', label: 'Notebook' },
  { href: '/study/history', label: 'History' },
  { href: '/study/progress', label: 'Progress' },
];

/** The tabs as study-tabs.tsx draws them: the active one carries the red-pen underline. */
function tabs(pathname: string): string {
  const active = (href: string) => (href === '/study' ? pathname === '/study' : pathname.startsWith(href));
  return TABS.map(
    (t) =>
      `<a href="${t.href}"${active(t.href) ? ' aria-current="page"' : ''} class="inline-flex min-h-11 items-center border-b-2 px-3 ${active(t.href) ? 'border-red-pen font-bold text-ink' : 'border-transparent text-dim underline underline-offset-[3px]'}">${t.label}</a>`,
  ).join('');
}

export function chromeBar(sitting: string, open = false, pathname = '/study'): string {
  const account = `<details${open ? ' open' : ''}><summary class="inline-flex min-h-11 cursor-pointer list-none items-center text-right underline underline-offset-[3px] [&::-webkit-details-marker]:hidden">${sitting}</summary><div class="absolute right-0 z-10 mt-1 w-[min(20rem,calc(100vw-2.5rem))] border-[1.5px] border-ink bg-white p-4 text-left shadow-[var(--shadow-panel)]"><div class="break-all font-mono text-[11px] normal-case tracking-normal text-ink">kiara.a.longer.address@example.com</div><form class="mt-3"><label class="block"><span class="block">Which sitting are you entered for</span><select name="to" class="mt-1 block w-full border-[1.5px] border-ink bg-paper p-2 font-sans text-sm normal-case tracking-normal text-ink"><option value="may-june-2027">May/June 2027</option><option value="jan-2027" selected>January 2027</option></select></label><button class="mt-3 block min-h-11 w-full border-[1.5px] border-ink p-3 text-left font-sans text-sm normal-case tracking-normal text-ink">Change sitting</button></form></div></details>`;
  const right = (extra: string) =>
    `<div class="relative ${extra} items-center font-mono text-[10px] uppercase tracking-[0.1em] text-dim">${account}<a class="whitespace-nowrap underline underline-offset-[3px]">Help</a><form><button class="min-h-11 whitespace-nowrap underline underline-offset-[3px]">Sign out</button></form></div>`;
  return `
<header class="border-b-[1.5px] border-ink bg-white px-5 lg:px-6">
  <div class="mx-auto flex max-w-[var(--bar-width)] flex-wrap items-center gap-x-6 gap-y-0">
    <div class="flex min-w-0 flex-1 items-center justify-between gap-3 py-2 lg:flex-none lg:py-0">
      ${renderToStaticMarkup(createElement(Lockup, { width: 130, className: 'shrink-0' }))}
      ${right('flex gap-2 lg:hidden')}
    </div>
    <div class="flex w-full min-w-0 items-center lg:w-auto lg:flex-1">
      <nav class="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em]">${tabs(pathname)}</nav>
    </div>
    ${right('hidden gap-4 lg:flex')}
  </div>
</header>`;
}

/** A whole page that draws its own chrome, such as a door or the landing. */
export function bodyPage(inner: string, extraCss = ''): string {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500;700&family=Caveat&display=swap">
<script src="https://cdn.tailwindcss.com"></script><script>${TAILWIND_CONFIG}</script><style>${FONTS}${css}${extraCss}</style></head>
<body class="bg-paper text-ink">${inner}</body></html>`;
}

/** A whole page: the chrome, then the paper with the given markup in its column. */
export function chromePage(inner: string, sitting = 'May/June 2027', open = false, pathname = '/study'): string {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500;700&family=Caveat&display=swap">
<script src="https://cdn.tailwindcss.com"></script><script>${TAILWIND_CONFIG}</script><style>${FONTS}${css}</style></head>
<body class="bg-paper text-ink">${chromeBar(sitting, open, pathname)}
<main class="ruled relative px-5 pb-8 pt-7 lg:px-6" style="min-height:100vh;container-type:inline-size">
  <div class="pointer-events-none absolute inset-y-0 left-[var(--rule-offset-sm)] w-[1.5px] bg-margin lg:left-[calc(50%-var(--bar-width)/2+var(--rule-offset-lg))]"></div>
  <div class="relative mx-auto max-w-[var(--bar-width)]">${inner}</div>
</main></body></html>`;
}
