// R1.7 Part D — the errors examiners actually report, region-wide.
//
// Every family below is drawn from the May/June 2025 subject report's account
// of what candidates did, rewritten in our own words: the report is calibration
// material, so the error patterns are facts about the exam and may be encoded,
// while none of its question text, values or contexts enters this repo.
//
// These are fed to generation as the families to draw a question's
// misconceptions from, which matters because a misconception invented by a
// model is a plausible guess, while these are documented behaviour — the
// difference between remediation that lands and remediation that reads well.

export interface MisconceptionFamily {
  /** Objective-id prefixes this family applies to, e.g. 'M1.2.' */
  objectivePrefixes: string[];
  /** The error, named as an examiner would name it. */
  name: string;
  /** What the student does, in one line. */
  error: string;
  /** What fixes it, in one line. */
  fix: string;
}

export const MISCONCEPTION_FAMILIES: MisconceptionFamily[] = [
  // ---- Consumer Arithmetic ----
  {
    objectivePrefixes: ['M1.2.'],
    name: 'Amount given instead of interest',
    error: 'Computes the accumulated amount correctly, then reports it when the question asked for the interest earned.',
    fix: 'Interest is the amount minus the principal — read which of the two the question wants before writing the answer.',
  },
  {
    objectivePrefixes: ['M1.2.'],
    name: 'Simple interest used for compound interest',
    error: 'Applies the simple-interest formula to a question that compounds.',
    fix: 'Compounding earns interest on interest: use the compound formula from the sheet whenever the rate applies again each period.',
  },
  {
    objectivePrefixes: ['M1.2.'],
    name: 'Amount given instead of percentage',
    error: 'Works out the money involved when the question asked for the percentage.',
    fix: 'A percentage answer is a comparison: divide by the original quantity and multiply by 100.',
  },
  {
    objectivePrefixes: ['M1.1.', 'M1.2.'],
    name: 'Operations taken out of sequence',
    error: 'Handles the bracket correctly, then applies the remaining operations in the order they are written.',
    fix: 'After the brackets, do all multiplication and division before any addition and subtraction.',
  },

  // ---- Algebra and functions ----
  {
    objectivePrefixes: ['M1.5.', 'M2.2.'],
    name: 'Right factors, wrong sign',
    error: 'Finds a correct factor pair but puts the wrong sign inside a bracket.',
    fix: 'Expand the brackets back: the middle term must reappear with its own sign.',
  },
  {
    objectivePrefixes: ['M2.3.', 'M3.2.'],
    name: 'Inverse found by swapping without isolating',
    error: 'Interchanges the variables when finding an inverse but mishandles the rearrangement that follows.',
    fix: 'Swap, then solve for the new subject one operation at a time, undoing the last operation first.',
  },
  {
    objectivePrefixes: ['M2.3.', 'M3.2.'],
    name: 'One root reported where the equation has two',
    error: 'Forms the composite correctly, solves, and gives a single root when the quadratic has two.',
    fix: 'A quadratic has two roots unless they coincide — state both, then check each against the question.',
  },

  // ---- Relations, functions and graphs ----
  {
    objectivePrefixes: ['M2.3.', 'M3.2.'],
    name: 'Axis of symmetry given as a number',
    error: 'States the axis of symmetry as a bare value instead of the equation of a vertical line.',
    fix: 'The axis of symmetry is a line: write it as $x = $ the value.',
  },
  {
    objectivePrefixes: ['M2.3.', 'M3.2.', 'M1.6.'],
    name: 'Feature read correctly, written as the wrong kind of object',
    error: 'Reads a root, intercept or minimum off the curve, then writes a value where a coordinate was wanted, or a coordinate where an equation was wanted.',
    fix: 'Match the answer to what was asked: a root is a value, a turning point is a coordinate pair, an axis of symmetry is an equation.',
  },

  // ---- Statistics ----
  {
    objectivePrefixes: ['M2.1.', 'M3.1.'],
    name: 'Range given as an interval',
    error: 'Reports the range as the two extreme values rather than the single number between them.',
    fix: 'The range is one number: the largest value minus the smallest.',
  },
  {
    objectivePrefixes: ['M2.1.', 'M3.1.'],
    name: 'Modal frequency given instead of the modal value',
    error: 'Identifies the tallest bar or largest frequency and reports that frequency as the mode, or confuses the mode with the median.',
    fix: 'The mode is the value that occurs most often, not how often it occurs.',
  },
  {
    objectivePrefixes: ['M3.1.'],
    name: 'Cumulative column right, frequency column wrong',
    error: 'Completes the cumulative-frequency column correctly while the plain frequency column beside it is wrong.',
    fix: 'Each cumulative entry minus the one before it returns that class frequency — use it to check the column you filled first.',
  },

  // ---- Geometry and transformations ----
  {
    objectivePrefixes: ['M2.4.', 'M3.3.'],
    name: 'Enlargement described without its centre',
    error: 'Names the transformation and its scale factor but omits the centre of enlargement.',
    fix: 'An enlargement is only fully described by scale factor AND centre: join corresponding points and extend to find where they meet.',
  },
  {
    objectivePrefixes: ['M2.4.', 'M3.3.'],
    name: 'Transformation right on the diagram, wrong on the page',
    error: 'Carries out the transformation correctly on the figure but records it inaccurately in the written answer.',
    fix: 'Read the written description back against the drawing before moving on.',
  },

  // ---- Patterns ----
  {
    objectivePrefixes: ['M1.1.', 'M1.5.'],
    name: 'Right count, wrong orientation',
    error: 'Continues a sequence with the correct number of elements but the wrong arrangement or orientation.',
    fix: 'Check how the previous figures turn as well as how they grow — the rule governs both.',
  },
];

/** The families that apply to the objectives a recipe is generating against. */
export function familiesFor(objectiveIds: string[]): MisconceptionFamily[] {
  const prefixes = objectiveIds.map((id) => id.slice(0, id.lastIndexOf('.') + 1));
  return MISCONCEPTION_FAMILIES.filter((f) =>
    f.objectivePrefixes.some((p) => prefixes.some((q) => q.startsWith(p))),
  );
}

/** Prompt block naming the documented errors for this question's objectives. */
export function misconceptionGuidance(objectiveIds: string[]): string {
  const families = familiesFor(objectiveIds);
  if (families.length === 0) return '';
  return `DOCUMENTED ERRORS on these objectives — examiners report these region-wide, so prefer them over an invented mistake when one fits the question you have written:
${families.map((f) => `- ${f.name}: ${f.error} Fix: ${f.fix}`).join('\n')}`;
}
