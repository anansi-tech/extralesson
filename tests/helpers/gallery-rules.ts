import type { Page } from 'playwright-core';

/**
 * THE SEVEN RULES, IN ONE PLACE. Every screen the product has — student and
 * operator — is held to them, so they are defined once: two copies would drift
 * and the drift would be invisible, since both would still be green.
 *
 * One rule is parameterised, and only one. A student screen has exactly one
 * primary action; an admin screen has AT MOST one, because admin primaries are
 * ink-filled and the red is reserved for the single irreversible act on the
 * page — which on Access sits behind a disclosure and is not on screen until
 * it is asked for (ROUND_13, "Red").
 */
export interface Report {
  /** The viewport it was measured at, so rule 5 compares like with like. */
  viewport: number;
  width: number;
  /** A process is running on the page (a progress bar): nothing is primary while it does. */
  process: boolean;
  primaries: string[];
  labels: string[];
  refusals: { id: string; offered: string[]; mode: string | null }[];
  text: string;
}

const inspect = (): Omit<Report, 'viewport'> => {
  const visible = (el: Element) => el.getClientRects().length > 0;
  const label = (el: Element) => {
    const clone = el.cloneNode(true) as Element;
    clone.querySelectorAll('small').forEach((s) => s.remove());
    return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
  };
  const actions = [...document.querySelectorAll('a[href], button')].filter(visible);
  const primaries = actions.filter((el) => /\bbg-red-pen\b/.test(el.className));
  const enabled = actions.filter((el) => !(el as HTMLButtonElement).disabled);
  return {
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    process: !!document.querySelector('[role="progressbar"]'),
    primaries: primaries.map(label),
    labels: actions.map(label).filter(Boolean),
    refusals: [...document.querySelectorAll('[data-refusal]')].filter(visible).map((panel) => ({
      id: panel.getAttribute('data-refusal')!,
      offered: enabled.filter((a) => !panel.contains(a)).map(label),
      mode: panel.querySelector<HTMLInputElement>('input[name="mode"]')?.value ?? null,
    })),
    text: document.body.innerText.replace(/\s+/g, ' '),
  };
};


export interface Rules {
  refuses: Record<string, RegExp>;
  blocks: Record<string, RegExp>;
  /** Student screens: exactly one. Admin screens: at most one. */
  primaries: 'exactly-one' | 'at-most-one';
}

export async function reportOn(page: Page, viewport: number): Promise<Report> {
  return { ...(await page.evaluate(inspect)), viewport };
}

export function checkRules(r: Report, name: string, rules: Rules, expect: typeof import('vitest').expect): void {
  // 1. One primary action — none while a process runs on the page.
  if (rules.primaries === 'exactly-one') {
    expect(r.primaries, `${name}: primary actions`).toHaveLength(r.process ? 0 : 1);
  } else {
    expect(r.primaries.length, `${name}: primary actions`).toBeLessThanOrEqual(r.process ? 0 : 1);
  }
  // 2. No refusal on a page whose lead or secondary cards offer the refused thing.
  for (const ref of r.refusals) {
    expect(rules.refuses[ref.id], `${name}: refusal ${ref.id} is not in the table`).toBeDefined();
    expect(ref.offered.filter((l) => rules.refuses[ref.id].test(l)), `${name}: ${ref.id} on a page offering it`).toEqual([]);
    // 7. The refusal's action leads somewhere the refusal does not block.
    if (ref.mode) expect(ref.mode, `${name}: ${ref.id} offers what it refuses`).not.toMatch(rules.blocks[ref.id]);
  }
  // 3. No two panels of the same pattern.
  expect(r.refusals.length, `${name}: refusal panels`).toBeLessThanOrEqual(1);
  // 4. No duplicated button label.
  const dupes = r.labels.filter((l, i) => r.labels.indexOf(l) !== i);
  expect(dupes, `${name}: duplicated labels`).toEqual([]);
  // 5. The document is as wide as the viewport.
  expect(r.width, `${name}: width`).toBe(r.viewport);
  // 6. No slot ids, model prose, or "query" in visible text.
  expect(r.text, `${name}: slot id`).not.toMatch(/\b[a-d]\.(i|ii|iii)\b/);
  expect(r.text, `${name}: reader prose`).not.toMatch(/blurred|pencil/);
  expect(r.text, `${name}: query`).not.toMatch(/\bquer(y|ied|ies)\b/i);
}
