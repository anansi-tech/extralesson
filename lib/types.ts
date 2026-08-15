// Shared domain types (ROUND_1 §0, §3).

export type ModuleNumber = 1 | 2 | 3;

export type Profile = 'CK' | 'AK' | 'R';

export type SyllabusMode = 'legacy-jan' | 'modular-2027';

export type ExamSitting = 'jan-2027' | 'may-june-2027';

export type QuestionKind = 'mcq' | 'structured';

export type QuestionStatus = 'draft' | 'approved' | 'retired';

export interface Objective {
  id: string; // syllabus numbering, e.g. 'M1.5.10' (module.topic.objective)
  text: string;
  notes?: string;
  // R1.6 §3: objectives ExtraLesson cannot assess — construction and drawing
  // work that needs pencil, ruler and compasses. Absent means assessable.
  // We state this coverage plainly rather than quietly scoring around it.
  assessable?: false;
  unassessable_reason?: string;
}

export interface RubricItem {
  code: string; // 'CK1' | 'AK1' | 'AK2' | 'R1' ...
  profile: Profile;
  criterion: string;
  mark_value: number;
  part_label: string; // which part this criterion belongs to ('a'..'f')
}

// R1.5 §2 — question structure
export type Archetype =
  | 'multi-step-application'
  | 'direct-procedure'
  | 'interpretation'
  | 'justification'
  | 'reverse-reasoning'
  | 'comparison'
  | 'complete-the-table';

export type Representation = 'prose' | 'diagram' | 'graph' | 'table' | 'chart' | 'venn';

// 15 SVG templates + dataTable (semantic HTML). Model emits {template, params},
// never raw SVG (R1.5 §3).
export type TemplateName =
  | 'triangleLabeled'
  | 'circleCenter'
  | 'parallelTransversal'
  | 'polygonMarkedAngle'
  | 'coordinateGrid'
  | 'travelGraph'
  | 'barChart'
  | 'pieChart'
  | 'histogram'
  | 'cumulativeFrequency'
  | 'venn2'
  | 'compositeShape'
  | 'patternFigure'
  | 'numberLine'
  | 'bearingDiagram'
  | 'vectorFigure'
  | 'dataTable';

// How a part is answered, which decides whether we can auto-mark it (R1.6 §1).
// Real papers repeatedly state the answer and ask for the derivation
// ("show that x = 5"); comparing a final answer the question already gave away
// is not assessment, so only 'answer' parts are auto-graded.
export type ResponseMode = 'answer' | 'show_that' | 'explain' | 'construct';

// The form an answer must take when the form is the thing being tested
// (R1.6 §2). 'sf:N' / 'dp:N' carry their precision, e.g. 'sf:3', 'dp:1'.
export type AnswerFormat =
  | 'exact'
  | 'standard_form'
  | 'lowest_terms'
  | 'integer'
  | `sf:${number}`
  | `dp:${number}`
  | 'surd'
  | 'equation_form';

export interface QuestionPart {
  label: string; // flat 'a'..'j' — no (i)/(ii) nesting
  prompt: string;
  marks: number;
  answer: string; // values-only convention
  accept?: string[]; // mark-scheme alternatives ("edge — accept: line segment")
  response_mode: ResponseMode;
  answer_format?: AnswerFormat;
}

export interface Misconception {
  trigger: string;
  name: string;
  remediation: string;
}

export interface ProfileMarks {
  CK: number;
  AK: number;
  R: number;
}
