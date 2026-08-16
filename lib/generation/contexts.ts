import type { ContextCategory } from '@/lib/types';

// R1.8 Part 0 — the context ledger.
//
// A bank of 123 approved questions read as repetitive because the settings
// repeat: market ×10, school ×10, stall ×6, and nine questions opening "The
// coordinate grid shows…". The real papers roam — fortnightly pay, a data
// survey, map scales, phone retail, beads in a ratio, a restaurant bill, hire
// purchase — so a question now declares WHERE it is set, and generation refuses
// the settings a topic has just used.

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
 * Share of Paper 1 items that should be bare symbolic work. The real paper is
 * largely context-free; ours was 35% contextual with a 27-word median stem.
 */
export const CONTEXT_FREE_MCQ_SHARE = 0.5;

/** How many recent questions on a topic a setting must stay clear of. */
export const CONTEXT_MEMORY = 6;

interface Recent {
  context_category?: string;
}

/**
 * The settings a topic has used recently, most recent first. Generation is told
 * to avoid these; it is not a hard gate, because a topic with few natural
 * settings (consumer arithmetic is about money) must not become ungeneratable.
 */
export function recentContexts(recent: Recent[]): ContextCategory[] {
  const seen: ContextCategory[] = [];
  for (const q of recent.slice(0, CONTEXT_MEMORY)) {
    const c = q.context_category as ContextCategory | undefined;
    if (c && c !== 'none' && !seen.includes(c)) seen.push(c);
  }
  return seen;
}

/** Prompt block naming what this topic has just used, and what to avoid. */
export function contextGuidance(recent: Recent[], wantContextFree: boolean): string {
  if (wantContextFree) {
    return `SETTING: none. Write this item as bare mathematics — symbols, no story, no names, no places. The real Paper 1 is largely context-free ("3x^2 x 2x^3 =", "the determinant of the 2x2 identity matrix is"), and a manufactured setting on a one-mark item wastes the student's reading time. Set "context_category" to "none".`;
  }
  const used = recentContexts(recent);
  const avoid = used.length
    ? ` This topic has just used ${used.join(', ')} — choose something else.`
    : '';
  return `SETTING: choose ONE context_category from ${CONTEXT_CATEGORIES.filter((c) => c !== 'none').join(', ')} and set the field to it.${avoid} Caribbean settings, drawn widely: a fortnightly pay packet, a ferry timetable, a fish market scale, a rainfall record, a hardware order, a school sports day. Do not open with "The coordinate grid shows" or "At a school fair".`;
}
