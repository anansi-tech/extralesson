import { describe, expect, it } from 'vitest';
import { linesForSlot, TranscriptionLineZ, TranscriptionZ } from '@/lib/grade/transcribe';
import { CapturedImage, Transcription } from '@/lib/db';

const t = (lines: unknown[]) =>
  TranscriptionZ.parse({ lines, legible: true });

describe('the transcription contract', () => {
  it('accepts a read with no marking judgment in it', () => {
    const parsed = TranscriptionZ.safeParse({
      lines: [{ part_label: 'a', slot_label: null, text: '3x = 12', confidence: 0.9 }],
      legible: true,
    });
    expect(parsed.success).toBe(true);
  });

  it('allows a line that could not be attributed', () => {
    expect(
      TranscriptionZ.safeParse({
        lines: [{ part_label: null, slot_label: null, text: '= 4', confidence: 0.4 }],
        legible: true,
      }).success,
    ).toBe(true);
  });

  it('rejects a confidence outside 0..1', () => {
    expect(
      TranscriptionZ.safeParse({
        lines: [{ part_label: 'a', slot_label: null, text: 'x', confidence: 2 }],
        legible: true,
      }).success,
    ).toBe(false);
  });
});

// Real papers require the question number beside the answer and students write
// it — once. The lines under it are the same part's working, and marking has to
// see them as such or a student is credited for their first line only.
describe('linesForSlot — a label carries down the page', () => {
  const page = t([
    { part_label: 'a', slot_label: null, text: 'area = 24 * 16', confidence: 0.9 },
    { part_label: null, slot_label: null, text: '= 384', confidence: 0.9 },
    { part_label: 'b', slot_label: null, text: '384 - 48', confidence: 0.8 },
    { part_label: null, slot_label: null, text: '= 336', confidence: 0.8 },
  ]);

  it('gives a part the lines written under it', () => {
    expect(linesForSlot(page, 'a')).toEqual(['area = 24 * 16', '= 384']);
    expect(linesForSlot(page, 'b')).toEqual(['384 - 48', '= 336']);
  });

  it('gives nothing for a part the student did not write', () => {
    expect(linesForSlot(page, 'c')).toEqual([]);
  });

  // Silence earns nothing (R2 §4.3), so an unattributable line must not drift
  // into a part and become evidence for it.
  it('never lets an unattributed line join a part', () => {
    const stray = t([
      { part_label: null, slot_label: null, text: '= 4', confidence: 0.3 },
      { part_label: 'a', slot_label: null, text: 'x = 2', confidence: 0.9 },
    ]);
    expect(linesForSlot(stray, 'a')).toEqual(['x = 2']);
  });

  it('narrows to a slot when the student named one', () => {
    const named = t([
      { part_label: 'd', slot_label: 'i', text: '341.4', confidence: 0.9 },
      { part_label: null, slot_label: 'iii', text: 'does not', confidence: 0.9 },
    ]);
    expect(linesForSlot(named, 'd', 'i')).toEqual(['341.4']);
    expect(linesForSlot(named, 'd', 'iii')).toEqual(['does not']);
  });
});

// The same drift the question schema is guarded against, one layer down: what
// the reader is asked for, what the validator accepts, and what the database
// keeps have to be the same shape. A field the model returns and the store
// drops would fail silently — the transcription would look right on screen and
// be missing when marking replayed against it later.
describe('transcription contract — model, validator and store agree', () => {
  it('keeps every validated field on the stored document', () => {
    const lineSchema = (Transcription.schema.path('lines') as unknown as { schema: { paths: object } })
      .schema;
    const stored = Object.keys(lineSchema.paths);
    for (const field of Object.keys(TranscriptionLineZ.shape)) {
      expect(stored, `a line's ${field} is validated but not stored`).toContain(field);
    }
    for (const field of ['legible', 'notes', 'take', 'reader_model', 'answers']) {
      expect(Object.keys(Transcription.schema.paths)).toContain(field);
    }
  });

  // ROUND_4 Task 1: the reader's final answer per slot is what prefills the
  // boxes, so it is validated as a slot ref and text and stored as the same.
  it('reads a final answer per slot, and stores it under the same two names', () => {
    const parsed = TranscriptionZ.parse({
      lines: [],
      legible: true,
      answers: [{ slot_ref: 'a.i', text: '3/4' }],
    });
    expect(parsed.answers).toEqual([{ slot_ref: 'a.i', text: '3/4' }]);
    expect(TranscriptionZ.parse({ lines: [], legible: true }).answers).toEqual([]);
    const stored = (Transcription.schema.path('answers') as unknown as { schema: { paths: object } }).schema;
    expect(Object.keys(stored.paths)).toEqual(expect.arrayContaining(['slot_ref', 'text']));
  });

  // R2 §1.2 — the transcription is a claim about the image, never a mark. If a
  // marking field ever appears here, something is deciding in the wrong place.
  it('carries no marking of any kind', () => {
    const fields = Object.keys(Transcription.schema.paths);
    for (const marked of ['rubric_awarded', 'profile_marks', 'correct', 'awarded']) {
      expect(fields).not.toContain(marked);
    }
  });

  // R2 §2 — the image is a means, not a record.
  it('expires the photograph and keeps the reading', () => {
    const imageIndexes = CapturedImage.schema.indexes() as [
      Record<string, unknown>,
      { expireAfterSeconds?: number } | undefined,
    ][];
    expect(imageIndexes.some(([, o]) => typeof o?.expireAfterSeconds === 'number')).toBe(true);
    // The one TTL a reading carries is on expires_at, which markWorking unsets
    // the moment the read is linked to an attempt: only scratch expires.
    const readIndexes = Transcription.schema.indexes() as [
      Record<string, unknown>,
      { expireAfterSeconds?: number } | undefined,
    ][];
    const ttl = readIndexes.filter(([, o]) => typeof o?.expireAfterSeconds === 'number');
    expect(ttl.map(([k]) => Object.keys(k))).toEqual([['expires_at']]);
  });
});

// THE EVAL AND PRODUCTION MUST GROUP THE SAME WAY.
//
// They did not. capture.ts grouped by line.part_label and dropped every
// unlabelled line; eval-marker.ts used linesForSlot, which carries a label down
// the page. The gate's 92/93/95% was therefore earned on a rule production did
// not ship, and production's rule was the lossy one. Found while testing end to
// end. These cases are the difference between them.
describe('a continuation line belongs to the part above it', () => {
  const page = t([
    { part_label: 'c', slot_label: null, text: 'det M = 4', confidence: 0.9 },
    { part_label: null, slot_label: null, text: 'M^-1 = 1/4 (0 -2)', confidence: 0.9 },
    { part_label: null, slot_label: null, text: '(2 0)', confidence: 0.9 },
  ]);

  it('keeps every line a student wrote under one label', () => {
    expect(linesForSlot(page, 'c')).toHaveLength(3);
  });

  it('is what the old grouping threw away', () => {
    // The rule capture.ts used to apply, written out: label present or dropped.
    const droppedUnlabelled = page.lines.filter((l) => l.part_label).map((l) => l.text);
    expect(droppedUnlabelled).toHaveLength(1);
    expect(linesForSlot(page, 'c').length).toBeGreaterThan(droppedUnlabelled.length);
  });
});
