import { buildGoldenBundle } from './bundle';
import { GOLDEN_DIR, hasGoldenCase, importGoldenBundle } from './import';

/**
 * THE DISPUTE→GOLDEN LOOP, CLOSED (ROUND_5 Task 3 met its own end). The export
 * and the importer both already existed; what did not was one click between
 * them, so a case the product got wrong in the field reached the eval only if
 * somebody remembered to run a script against an id they had to go and find.
 *
 * Nothing here is ground truth. The entry is written PROPOSED — every row
 * proposed, the disputed row flagged — which is the state the loader skips, so
 * the eval does not read it until a person has approved it by hand.
 *
 * No image: a field page is a minor's handwriting and stays on the machine that
 * imported it. Only the set.json and review.json entries are written, which is
 * also what keeps this free of a model call.
 */
export type AddOutcome =
  | { added: true; id: string }
  | { added: false; reason: 'already-added' | 'not-found'; id?: string };

export async function addGoldenCase(disputeId: string, dir: string = GOLDEN_DIR): Promise<AddOutcome> {
  const bundle = await buildGoldenBundle(disputeId);
  if (!bundle) return { added: false, reason: 'not-found' };
  // ADDING TWICE WRITES ONCE. importGoldenBundle refuses a duplicate id by
  // throwing; asking first makes a second click a quiet no rather than an
  // error page, and the id comes from the read, so it is the same both times.
  if (hasGoldenCase(bundle.id, dir)) return { added: false, reason: 'already-added', id: bundle.id };
  await importGoldenBundle(bundle, dir);
  return { added: true, id: bundle.id };
}
