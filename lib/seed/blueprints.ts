// Official paper allocations, transcribed VERBATIM from design/syllabus-2027.pdf
// (CXC 05/G/SYLL 16, Amended Oct 2025): Paper 01 item table, PDF page 10, each
// item 1 mark; Paper 02 mark table, PDF pages 10-11; profile splits from
// Assessment Grid B, PDF page 12 — Paper 01 per module CK 6 / AK 8 / R 6 of 20
// items, Paper 02 per module CK 9 / AK 12 / R 9 of 30 raw marks.

interface SeedBlueprint {
  paper: 'P1' | 'P2';
  module: 1 | 2 | 3;
  allocations: { topic_codes: string[]; items?: number; marks?: number }[];
  profile_split: { CK: number; AK: number; R: number };
}

export const seedBlueprints: SeedBlueprint[] = [
  // ---- Paper 01 (PDF page 10) ----
  {
    paper: 'P1',
    module: 1,
    allocations: [
      { topic_codes: ['M1-NTC'], items: 4 }, // Number Theory and Computation 4
      { topic_codes: ['M1-CONS'], items: 4 }, // Consumer Arithmetic 4
      { topic_codes: ['M1-SETS'], items: 3 }, // Sets 3
      { topic_codes: ['M1-MEAS'], items: 4 }, // Measurement 4
      { topic_codes: ['M1-GRAPHS'], items: 2 }, // Introduction to Graphs 2
      { topic_codes: ['M1-ALG1'], items: 3 }, // Algebra 1 3
    ],
    profile_split: { CK: 6, AK: 8, R: 6 },
  },
  {
    paper: 'P1',
    module: 2,
    allocations: [
      { topic_codes: ['M2-RFG1'], items: 4 }, // Relations, Functions and Graphs 1 4
      { topic_codes: ['M2-GEO1'], items: 4 }, // Geometry and Trigonometry 1 4
      { topic_codes: ['M2-STAT1'], items: 4 }, // Statistics 1 4
      { topic_codes: ['M2-ALG2'], items: 4 }, // Algebra 2 4
      { topic_codes: ['M2-VM1'], items: 4 }, // Vectors and Matrices 1 4
    ],
    profile_split: { CK: 6, AK: 8, R: 6 },
  },
  {
    paper: 'P1',
    module: 3,
    allocations: [
      { topic_codes: ['M3-RFG2'], items: 6 }, // Relations, Functions and Graphs 2 6
      { topic_codes: ['M3-GEO2'], items: 6 }, // Geometry and Trigonometry 2 6
      { topic_codes: ['M3-STAT2'], items: 4 }, // Statistics 2 4
      { topic_codes: ['M3-VM2'], items: 4 }, // Vectors and Matrices 2 4
    ],
    profile_split: { CK: 6, AK: 8, R: 6 },
  },

  // ---- Paper 02 (PDF pages 10-11) ----
  {
    paper: 'P2',
    module: 1,
    allocations: [
      // "Consumer Arithmetic, Number Theory and Computation — 9"
      { topic_codes: ['M1-CONS', 'M1-NTC'], marks: 9 },
      // "Graphs, Sets, Measurement and Algebra 1 — 12"
      { topic_codes: ['M1-GRAPHS', 'M1-SETS', 'M1-MEAS', 'M1-ALG1'], marks: 12 },
      // "*Investigative question — 9": any combination of Module 1 objectives
      // (PDF page 11 footnote). Kept only for blueprint-faithful weighting.
      {
        topic_codes: ['M1-NTC', 'M1-CONS', 'M1-SETS', 'M1-MEAS', 'M1-ALG1', 'M1-GRAPHS'],
        marks: 9,
      },
    ],
    profile_split: { CK: 9, AK: 12, R: 9 },
  },
  {
    paper: 'P2',
    module: 2,
    allocations: [
      // "Algebra 2, and Relations, Functions and Graphs 1 — 12"
      { topic_codes: ['M2-ALG2', 'M2-RFG1'], marks: 12 },
      { topic_codes: ['M2-GEO1'], marks: 9 }, // Geometry and Trigonometry 1 9
      { topic_codes: ['M2-STAT1'], marks: 6 }, // Statistics 1 6
      { topic_codes: ['M2-VM1'], marks: 3 }, // Vectors and Matrices 1 3
    ],
    profile_split: { CK: 9, AK: 12, R: 9 },
  },
  {
    paper: 'P2',
    module: 3,
    allocations: [
      { topic_codes: ['M3-VM2'], marks: 9 }, // Vectors and Matrices 2 9
      { topic_codes: ['M3-RFG2'], marks: 6 }, // Relations, Functions and Graphs 2 6
      { topic_codes: ['M3-GEO2'], marks: 9 }, // Geometry and Trigonometry 2 9
      { topic_codes: ['M3-STAT2'], marks: 6 }, // Statistics 2 6
    ],
    profile_split: { CK: 9, AK: 12, R: 9 },
  },
];
