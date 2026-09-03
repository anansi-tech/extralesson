import type { ContextCategory } from '@/lib/types';

// A question declares WHERE it is set, and generation refuses the settings a
// topic has just used, because a bank whose settings repeat reads as repetitive
// however varied the mathematics is. See ROUND_1_8 PART 0.

export const CONTEXT_CATEGORIES = [
  'none', // context-free symbolic work, which the papers use constantly
  'retail', // shops, stalls, mark-up, discount, sale price
  'wages', // pay, salary, overtime, budgets, deductions
  'banking', // interest, loans, savings, currency exchange, hire purchase
  'transport', // journeys, fares, speed, fuel, timetables
  'agriculture', // farms, crops, livestock, yields, land
  'fishing', // boats, catches, nets, the sea
  'construction', // building, tiling, paving, fencing, materials
  'household', // rooms, tanks, appliances, bills, recipes
  'school', // classes, marks, attendance, timetables
  'sport', // matches, scores, teams, athletics
  'events', // festivals, fairs, concerts, catering
  'tourism', // hotels, visitors, tours, beaches
  'health', // clinics, dosages, growth, nutrition
  'environment', // rainfall, recycling, conservation, energy
  'manufacturing', // production, packaging, quality, machines
] as const;

/**
 * The real Paper 1 is largely context-free; ours was 35% contextual with a
 * 27-word median stem.
 */
export const CONTEXT_FREE_MCQ_SHARE = 0.5;

/** How many recent questions on a topic a setting must stay clear of. */
export const CONTEXT_MEMORY = 6;

interface Recent {
  context_category?: string;
}

/**
 * Most recent first. Advisory, never a gate: a topic with few natural settings
 * (consumer arithmetic is about money) must not become ungeneratable.
 */
export function recentContexts(recent: Recent[]): ContextCategory[] {
  const seen: ContextCategory[] = [];
  for (const q of recent.slice(0, CONTEXT_MEMORY)) {
    const c = q.context_category as ContextCategory | undefined;
    if (c && c !== 'none' && !seen.includes(c)) seen.push(c);
  }
  return seen;
}

export function contextGuidance(
  recent: Recent[],
  wantContextFree: boolean,
  want?: string | null,
): string {
  if (wantContextFree) {
    return `SETTING: none. Write this item as bare mathematics — symbols, no story, no names, no places. The real Paper 1 is largely context-free ("3x^2 x 2x^3 =", "the determinant of the 2x2 identity matrix is"), and a manufactured setting on a one-mark item wastes the student's reading time. Set "context_category" to "none".`;
  }
  const used = recentContexts(recent);
  const avoid = used.length
    ? ` This topic has just used ${used.join(', ')} — choose something else.`
    : '';
  // ONE CATEGORY, NAMED: listing all fifteen and saying "avoid the last few"
  // spreads evenly, and the papers do not. The name is the setting this topic
  // is furthest short of on its own target (lib/generation/context-targets.ts).
  if (want) {
    return `SETTING: use ${want}. Set "context_category" to "${want}". This topic is short of that setting measured against the real papers, so write the mathematics into it naturally — if it genuinely cannot carry ${want}, choose the nearest setting that can and set the field to what you actually used.${avoid} Caribbean settings, drawn widely, and do not open with "The coordinate grid shows" or "At a school fair".`;
  }
  return `SETTING: choose ONE context_category from ${CONTEXT_CATEGORIES.filter((c) => c !== 'none').join(', ')} and set the field to it.${avoid} Caribbean settings, drawn widely: a fortnightly pay packet, a ferry timetable, a fish market scale, a rainfall record, a hardware order, a school sports day. Do not open with "The coordinate grid shows" or "At a school fair".`;
}
