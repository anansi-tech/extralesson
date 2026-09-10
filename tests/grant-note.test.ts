import { describe, expect, it } from 'vitest';
import { grantNote, noteWithPrior, readNote } from '@/lib/grant-note';

// Display only: readNote decides nothing about access. It lifts a reason out of
// the two shapes the form writes and shows every older note as it stands,
// because those were typed by hand and some carry history inside history.
describe('reading a note for the screen', () => {
  it('lifts the reason out of a comp the form wrote', () => {
    expect(readNote('comp · teacher at st-marys · 2026-09-10')).toEqual({
      kind: 'comp',
      reason: 'teacher at st-marys',
      verbatim: false,
      prior: null,
    });
  });

  it('lifts the event id out of a sale', () => {
    expect(readNote('stripe evt_9ABC')).toEqual({ kind: 'sale', reason: 'evt_9ABC', verbatim: false, prior: null });
  });

  it('reads the one prior grant a note carries', () => {
    const note = noteWithPrior(grantNote('comp', 'teacher at st-marys', new Date('2026-09-10T00:00:00Z')), {
      sitting: 'jan-2027',
      source: 'stripe',
      note: 'stripe evt_1UDcTOR',
    } as never);

    expect(readNote(note)).toEqual({
      kind: 'comp',
      reason: 'teacher at st-marys',
      verbatim: false,
      prior: { sitting: 'jan-2027', source: 'stripe', note: 'stripe evt_1UDcTOR' },
    });
  });

  it('shows an older note as it stands rather than guessing at it', () => {
    expect(readNote('friend')).toEqual({ kind: null, reason: 'friend', verbatim: true, prior: null });
    expect(readNote('')).toEqual({ kind: null, reason: '', verbatim: true, prior: null });
    expect(readNote(undefined)).toEqual({ kind: null, reason: '', verbatim: true, prior: null });
    // A comp that never followed the convention is still named a comp, since
    // its first token says so — that is the same token isComp reads.
    expect(readNote('comp')).toMatchObject({ kind: 'comp', verbatim: true, reason: 'comp' });
  });

  it('hands back a prior that carries its own nested history, whole', () => {
    const nested = 'comp · x · 2026-09-10 · was may-june-2027 stripe: stripe evt_first';
    const read = readNote(`stripe evt_new · was jan-2027 manual: ${nested}`);

    expect(read.prior).toEqual({ sitting: 'jan-2027', source: 'manual', note: nested });
    // Not unpicked further: what is stored is what is shown.
    expect(read.prior!.note).toContain('was may-june-2027');
  });

  it('reads a prior with no note of its own', () => {
    expect(readNote('stripe evt_new · was jan-2027 manual')?.prior).toEqual({ sitting: 'jan-2027', source: 'manual', note: '' });
  });
});
