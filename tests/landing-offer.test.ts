import { describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { sittingNoteAt } from '@/lib/landing-content';
import { renderMarked, MARKED, visibleText } from './helpers/marked-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study/session/s1' }));

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const strip = (src: string) => src.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '').replace(/^\s*\/\/.*$/gm, '');
// The landing as the reader sees it, from the page's own source.
const markup = () =>
  at('app', 'page.tsx')
    .replace(/className=/g, 'class=')
    .replace(/&rsquo;/g, '’')
    .replace(/&mdash;/g, '—')
    .replace(/\{' '\}/g, ' ')
    .replace(/\{LANDING\.price\}/g, '$49')
    .replace(/\{REFUND_DAYS\}/g, '14')
    .replace(/\{sittingNoteAt\(new Date\(\)\)\}/g, 'For January 2027 and May/June 2027 candidates.')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

// Landing: the next two sittings, one price, a re-mark.
describe('the sitting note', () => {
  it('names the next two open sittings and never the whole list', () => {
    expect(sittingNoteAt(new Date('2026-09-07T00:00:00Z'))).toBe('For January 2027 and May/June 2027 candidates.');
    expect(sittingNoteAt(new Date('2027-08-01T00:00:00Z'))).toBe('For January 2028 and May/June 2028 candidates.');
    expect(sittingNoteAt(new Date('2031-02-15T00:00:00Z'))).toBe('For May/June 2031 candidates.');
    expect(sittingNoteAt(new Date('2031-08-01T00:00:00Z'))).toBe('');
    expect(at('app', 'page.tsx')).toContain('{sittingNoteAt(new Date())}');
  });
});

describe('the offer card', () => {
  const html = markup();
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  it('says $49 once as the figure, one mono line, three checks, the button and its caption', () => {
    const offer = html.slice(html.indexOf('class="offer"'), html.indexOf('class="offernote"'));
    expect((offer.match(/\$49/g) ?? []).length).toBe(1);
    expect(offer).toContain('<div class="per">ONE PAYMENT · ACCESS THROUGH THE SITTING YOU CHOOSE</div>');
    expect([...offer.matchAll(/<li>([^<]+)<\/li>/g)].map((m) => m[1])).toEqual([
      'The whole programme: diagnostic, daily sessions, marked working',
      'One student, with access running to the sitting they are entered for',
      'Every re-mark request is reviewed by a person',
    ]);
    expect(offer).toMatch(/Get access\s*<small>SECURE CHECKOUT · CARD OR APPLE PAY<\/small>/);
  });
  it('splits the note into the payer-email sentences and the refund sentence, and moves reports to the FAQ', () => {
    const note = /<div class="offernote">([\s\S]*?)<\/div>/.exec(html)![1];
    const paragraphs = [...note.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toMatch(/^Checkout asks for the student’s email address.*reaches their account\.$/);
    expect(paragraphs[1]).toBe('Not satisfied? Email us within 14 days of paying and we will refund you.');
    expect(note).not.toContain('reports');
    expect(text).toMatch(/How will I know it’s working\? We do not send reports: they can open their own marked working whenever they want to, and you will hear how it is going from them, not from us\./);
  });
});

describe('the re-mark', () => {
  it('is what the student is offered, and what they are told after asking', () => {
    const marked = visibleText(renderMarked(MARKED.marked));
    expect(marked).toContain('Ask for a re-mark');
    expect(marked).toContain('Handed in — answers are closed. If a mark looks wrong, ask for a re-mark.');
    const queried = visibleText(renderMarked(MARKED.queried));
    expect(queried).toContain('1 re-mark requested');
    expect(queried).toContain('Re-mark requested. A person will look before anything changes.');
  });
  it('leaves no “query” on a student surface, while the admin keeps its disputes', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(p) ? [p] : [];
      });
    const files = [...walk(join(process.cwd(), 'app', 'study')), join(process.cwd(), 'app', 'refusal.tsx'), join(process.cwd(), 'lib', 'email.ts')];
    for (const f of files) {
      const src = strip(readFileSync(f, 'utf8'));
      // Words a reader sees: string literals and JSX text, not identifiers.
      for (const m of src.matchAll(/(['"`])((?:(?!\1)[^\\]|\\.)*)\1|(?<=<\/?[a-zA-Z][^<>]*>)([^<{]+)(?=<)/g)) {
        const shown = m[2] ?? m[3] ?? '';
        expect(shown, `${f.replace(process.cwd(), '')}: ${shown.slice(0, 60)}`).not.toMatch(/\bquer(y|ied|ies)\b/i);
      }
    }
    for (const q of Object.values(MARKED)) expect(visibleText(renderMarked(q))).not.toMatch(/\bquer/i);
    expect(at('app', 'admin', 'admin-nav.tsx')).toContain("label: 'Disputes'");
    expect(at('app', 'admin', 'disputes', '[id]', 'page.tsx')).toContain('Your re-mark request on');
  });
});
