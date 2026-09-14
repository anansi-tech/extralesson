import { GoldenCase, isDuplicateKey } from '@/lib/db';
import { buildGoldenBundle } from './bundle';
import { GOLDEN_DIR, hasGoldenCase } from './import';

/**
 * THE DISPUTE→GOLDEN LOOP, CLOSED (ROUND_5 Task 3 met its own end). The export
 * and the importer both already existed; what did not was one click between
 * them, so a case the product got wrong in the field reached the eval only if
 * somebody remembered to run a script against an id they had to go and find.
 *
 * THE CLICK DOES NOT WRITE THE REPO. design/golden is committed, and a
 * deployed function cannot write to it — Vercel's filesystem is read-only
 * outside /tmp, and what is written there is gone by the next request. So the
 * bundle is recorded in the database, and `pnpm golden:pull` carries it into
 * the files on a machine that has the repo, where it can be committed.
 *
 * Nothing here is ground truth either way: the entry the pull writes is
 * PROPOSED — every row proposed, the disputed row flagged — which is the state
 * the loader skips, so the eval does not read it until a person approves it.
 *
 * No image: a field page is a minor's handwriting and stays on the machine
 * that imported it, which also keeps this free of a model call.
 */
export type AddOutcome =
  | { added: true; id: string }
  | { added: false; reason: 'already-added' | 'not-found'; id?: string };

/** Whether this case is already kept — recorded here, or already in the files. */
export async function alreadyKept(caseId: string, dir: string = GOLDEN_DIR): Promise<boolean> {
  if (hasGoldenCase(caseId, dir)) return true;
  return (await GoldenCase.exists({ case_id: caseId })) !== null;
}

export async function addGoldenCase(disputeId: string, dir: string = GOLDEN_DIR): Promise<AddOutcome> {
  const bundle = await buildGoldenBundle(disputeId);
  if (!bundle) return { added: false, reason: 'not-found' };
  // ADDING TWICE WRITES ONCE. Asked first so a second click is a quiet no
  // rather than an error page; the unique index is what actually decides it,
  // because two clicks can arrive at once and a check cannot stop that.
  if (await alreadyKept(bundle.id, dir)) return { added: false, reason: 'already-added', id: bundle.id };
  try {
    await GoldenCase.create({
      case_id: bundle.id,
      dispute_id: bundle.source.dispute_id,
      transcription_id: bundle.source.transcription_id,
      bundle,
    });
  } catch (e) {
    if (isDuplicateKey(e)) return { added: false, reason: 'already-added', id: bundle.id };
    throw e;
  }
  return { added: true, id: bundle.id };
}
