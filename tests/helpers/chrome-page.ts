import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The chrome as study-chrome.tsx renders it, as static markup, so a page's
// markup can be measured in Chrome with the site's own stylesheet.
const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')
  .replace(/@import[^;]+;/g, '')
  .replace(/@theme inline \{[\s\S]*?\n\}/, '');

const TAILWIND_CONFIG = `tailwind.config={theme:{extend:{colors:{ink:'#1e2430',paper:'#fbf7ee','paper-deep':'#f1eada',margin:'#e4b8b4',rule:'#c9d6e8',dim:'#5b6373',amber:'#d9a62e','red-pen':'#c1121f','green-pen':'#2e7d5b'},fontFamily:{mono:['IBM Plex Mono','monospace'],hand:['Caveat','cursive']}}}}`;

export function chromeBar(sitting: string, open = false): string {
  const account = `<details${open ? ' open' : ''}><summary class="inline-flex min-h-11 cursor-pointer list-none items-center text-right underline underline-offset-[3px] [&::-webkit-details-marker]:hidden">${sitting}</summary><div class="absolute right-0 z-10 mt-1 w-[min(20rem,calc(100vw-2.5rem))] border-[1.5px] border-ink bg-white p-4 text-left shadow-[var(--shadow-panel)]"><div class="break-all font-mono text-[11px] normal-case tracking-normal text-ink">kiara.a.longer.address@example.com</div><form class="mt-3"><label class="block"><span class="block">Which sitting are you entered for</span><select name="to" class="mt-1 block w-full border-[1.5px] border-ink bg-paper p-2 font-sans text-sm normal-case tracking-normal text-ink"><option value="may-june-2027">May/June 2027</option><option value="jan-2027" selected>January 2027 re-sit</option></select></label><button class="mt-3 block min-h-11 w-full border-[1.5px] border-ink p-3 text-left font-sans text-sm normal-case tracking-normal text-ink">Change sitting</button></form></div></details>`;
  const right = (extra: string) =>
    `<div class="relative ${extra} items-center font-mono text-[10px] uppercase tracking-[0.1em] text-dim">${account}<a class="whitespace-nowrap underline underline-offset-[3px]">Help</a><form><button class="min-h-11 whitespace-nowrap underline underline-offset-[3px]">Sign out</button></form></div>`;
  return `
<header class="border-b-[1.5px] border-ink bg-white px-5 lg:px-6">
  <div class="mx-auto flex max-w-[var(--bar-width)] flex-wrap items-center gap-x-6 gap-y-0">
    <div class="flex min-w-0 flex-1 items-center justify-between gap-3 py-2 lg:flex-none lg:py-0">
      <svg width="130" height="22" style="flex:none"><text x="0" y="17" font-family="Fraunces,serif" font-weight="900" font-size="18" fill="#1e2430">ExtraLesson</text></svg>
      ${right('flex gap-2 lg:hidden')}
    </div>
    <div class="flex w-full min-w-0 items-center lg:w-auto lg:flex-1">
      <nav class="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em]"><a class="inline-flex min-h-11 items-center border-b-2 px-3 border-red-pen font-bold text-ink">Notebook</a><a class="inline-flex min-h-11 items-center border-b-2 px-3 border-transparent text-dim underline underline-offset-[3px]">History</a><a class="inline-flex min-h-11 items-center border-b-2 px-3 border-transparent text-dim underline underline-offset-[3px]">Progress</a></nav>
    </div>
    ${right('hidden gap-4 lg:flex')}
  </div>
</header>`;
}

/** A whole page that draws its own chrome, such as a door. */
export function bodyPage(inner: string): string {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500;700&family=Caveat&display=swap">
<script src="https://cdn.tailwindcss.com"></script><script>${TAILWIND_CONFIG}</script><style>${css}</style></head>
<body class="bg-paper text-ink">${inner}</body></html>`;
}

/** A whole page: the chrome, then the paper with the given markup in its column. */
export function chromePage(inner: string, sitting = 'May/June 2027', open = false): string {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500;700&family=Caveat&display=swap">
<script src="https://cdn.tailwindcss.com"></script><script>${TAILWIND_CONFIG}</script><style>${css}</style></head>
<body class="bg-paper text-ink">${chromeBar(sitting, open)}
<main class="ruled relative px-5 pb-8 pt-7 lg:px-6" style="min-height:100vh;container-type:inline-size">
  <div class="pointer-events-none absolute inset-y-0 left-[var(--rule-offset-sm)] w-[1.5px] bg-margin lg:left-[calc(50%-var(--bar-width)/2+var(--rule-offset-lg))]"></div>
  <div class="relative mx-auto max-w-[var(--bar-width)]">${inner}</div>
</main></body></html>`;
}
