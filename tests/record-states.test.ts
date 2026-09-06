import { describe, expect, it } from 'vitest';
import { HISTORY, PROGRESS, renderHistory, renderProgress, visibleText } from './helpers/record-states';

// ROUND_8 Task 4: history and progress say what the design says, from the
// fold's rows and the existing loaders' shapes.
describe('history', () => {
  it('newest first, date, stem, score with unassessed where true, revisit at the foot', () => {
    expect(visibleText(renderHistory())).toBe(
      'Every question you have answered . Newest first. Each opens at your marking, as it was; nothing here is re-marked. ' +
        '5 Sept Triangle ABC, right-angled at B, AB = 8 cm and angle ACB = 34°. Calculate the length of BC. 5/7 ' +
        '5 Sept Solve 3x² − 5x − 2 = 0 2/3 ' +
        '4 Sept A shopkeeper buys 40 kg of rice at $3.75 per kg and sells it at a profit of 20%. 9/9 ' +
        '4 Sept The table shows the masses of 60 mangoes picked from one tree. 6/10 · 2 unassessed ' +
        '2 Sept Make t the subject of v = u + at 3/3 ' +
        '1 Sept Bearing of P from Q is 145°. Find the bearing of Q from P. 4/8 ' +
        'Revisit the 14 marks you lost NEW QUESTIONS ON THE SAME OBJECTIVES',
    );
    const html = renderHistory();
    expect(html.match(/href="\/study\/session\/s\d\?q=0#marking"/g)).toHaveLength(6);
    expect(html).toMatch(/<input type="hidden" name="mode" value="revisit"\/>/);
  });
  it('with nothing answered: no list, no foot', () => {
    expect(visibleText(renderHistory({ rows: [], lostMarks: 0 }))).toBe(
      'Every question you have answered . Newest first. Each opens at your marking, as it was; nothing here is re-marked. Nothing yet. Your first question is on your notebook.',
    );
    expect(renderHistory({ rows: HISTORY.rows, lostMarks: 0 })).not.toContain('Revisit the');
  });
});

describe('progress', () => {
  it('per-module estimate and topic rows, the weakest topic at the foot', () => {
    expect(visibleText(renderProgress())).toBe(
      'Where you stand, topic by topic . Every figure is an estimate from the questions you have answered. It moves with every session. ' +
        'Module 1 II est. 68% topic strength Number theory Strong Consumer arithmetic Building Algebraic manipulation Weak ' +
        'Module 2 III est. 41% topic strength Geometry & trigonometry Building Vectors & matrices Weak ' +
        'Practise algebraic manipulation WEAKEST TOPIC · WORTH +8 MARKS',
    );
    const html = renderProgress();
    expect(html).toMatch(/<input type="hidden" name="mode" value="topic"\/><input type="hidden" name="topic" value="M1-ALG1"\/>/);
    expect(html.match(/style="width:(86|54|30|50|20)%"/g)).toHaveLength(5);
  });
  it('cold: no letters, the other lede, no foot', () => {
    expect(visibleText(renderProgress({ ...PROGRESS, estimable: false, weakest: null, modules: PROGRESS.modules.map((m) => ({ ...m, letter: null })) }))).toBe(
      'Where you stand, topic by topic . Finish one session and your estimates appear here. Until then the bars show only what you have tried. ' +
        'Module 1 68% topic strength Number theory Strong Consumer arithmetic Building Algebraic manipulation Weak ' +
        'Module 2 41% topic strength Geometry & trigonometry Building Vectors & matrices Weak',
    );
  });
});
