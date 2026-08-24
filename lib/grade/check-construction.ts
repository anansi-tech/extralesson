import { generateObject } from 'ai';
import { z } from 'zod';
import { reader, READER_MODEL_ID } from '@/lib/ai';
import type { ConstructionCheck } from './construction';

/**
 * CHECKING A PHOTOGRAPHED CONSTRUCTION AGAINST WHAT THE PARAMS SAY.
 *
 * R2 §8, and the same two-leg shape as marking written work: the model READS
 * the drawing — is this point on the curve, does it open upwards — and the
 * comparison against ground truth is done here, in code, from the figure's own
 * declared params. The model is never asked whether the construction is
 * correct; it is asked what it can see.
 *
 * Same asymmetric rule as everything else in this round: this can only ADD
 * marks. A photograph that cannot be read, or a check the reader is unsure of,
 * leaves the slot exactly where it was — with the self-check list the student
 * already has (R2 §1.3). Nothing here removes anything.
 */
const ObservationZ = z.object({
  index: z.number(),
  visible: z.boolean(),
  note: z.string(),
});

const ReadingZ = z.object({
  legible: z.boolean(),
  axesDrawn: z.boolean(),
  observations: z.array(ObservationZ),
});

export interface ConstructionVerdict {
  /** Every check the drawing satisfies. */
  satisfied: ConstructionCheck[];
  /** Checks the drawing does not satisfy, each with what the reader saw. */
  missing: { check: ConstructionCheck; note: string }[];
  legible: boolean;
  /** True only when the drawing satisfies every check the params could state. */
  complete: boolean;
}

export async function checkConstruction(args: {
  image: Uint8Array;
  contentType: string;
  checks: ConstructionCheck[];
  questionStem: string;
}): Promise<ConstructionVerdict> {
  const { image, contentType, checks, questionStem } = args;
  if (checks.length === 0) {
    return { satisfied: [], missing: [], legible: false, complete: false };
  }

  const list = checks.map((c, i) => `${i}. ${c.describes}`).join('\n');

  const result = await generateObject({
    model: reader,
    schema: ReadingZ,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              `This is a photograph of a graph a student drew on graph paper for this question:\n` +
              `${questionStem}\n\n` +
              `For each statement below, say whether the DRAWING shows it. You are reading the ` +
              `page, not marking it: do not say whether the student is right overall, and do not ` +
              `calculate anything. If you cannot tell — the axes are unlabelled, the line is off ` +
              `the edge, the photograph is unclear — answer visible: false and say why in note.\n\n` +
              `Read points against the axes as the student drew and labelled them.\n\n${list}\n\n` +
              `Return one observation per statement, using its number as index. Set axesDrawn to ` +
              `false if there are no usable axes, and legible to false if the photograph cannot be ` +
              `read at all.`,
          },
          { type: 'image', image, mediaType: contentType },
        ],
      },
    ],
  });

  const seen = new Map(result.object.observations.map((o) => [o.index, o]));
  const satisfied: ConstructionCheck[] = [];
  const missing: { check: ConstructionCheck; note: string }[] = [];
  for (const [i, check] of checks.entries()) {
    const o = seen.get(i);
    // Absent or unsure counts as not satisfied, never as satisfied: silence
    // earns nothing here for the same reason it earns nothing in written work.
    if (o?.visible) satisfied.push(check);
    else missing.push({ check, note: o?.note ?? 'we could not see this on your graph' });
  }

  return {
    satisfied,
    missing,
    legible: result.object.legible && result.object.axesDrawn,
    complete: result.object.legible && result.object.axesDrawn && missing.length === 0,
  };
}

export const CONSTRUCTION_READER = READER_MODEL_ID;
