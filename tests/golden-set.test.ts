import { describe, expect, it } from 'vitest';
import { goldenSetExists, loadGoldenSet } from '@/scripts/golden-set';

// The golden set is two files because they are complementary — set.json is the
// working, review.json is the verdict on it — and neither stands alone. The
// hazard that comes with two files is that they drift, so the loader refuses
// anything but a 1:1 pairing of approved ground truth, and it is the only thing
// that reads either file.
describe('the golden set is paired, or it is not used', () => {
  it('loads a set where every working has its verdict', () => {
    if (!goldenSetExists()) return; // the set is gitignored; absent in CI
    const g = loadGoldenSet();
    expect(g.inputs.length).toBe(g.verdicts.size);
    for (const input of g.inputs) {
      expect(g.verdicts.has(input.id), `${input.id} has no verdict`).toBe(true);
    }
  });

  it('keeps the verdict out of what the marker is given', () => {
    if (!goldenSetExists()) return;
    const g = loadGoldenSet();
    const asMarkerSeesIt = JSON.stringify(g.inputs);
    expect(asMarkerSeesIt).not.toContain('awarded');
  });

  it('only ever reads ground truth that has been approved', () => {
    if (!goldenSetExists()) return;
    expect(loadGoldenSet().approval.status).toBe('approved');
  });
});
