// Shared domain types (ROUND_1 §0, §3).

export type ModuleNumber = 1 | 2 | 3;

export type Profile = 'CK' | 'AK' | 'R';

export type SyllabusMode = 'legacy-jan' | 'modular-2027';

// Where a question is set, so the bank can be kept varied. 'none' is a
// first-class choice — most Paper 1 items are bare symbolic work.
export type ContextCategory =
  | 'none'
  | 'retail'
  | 'wages'
  | 'banking'
  | 'transport'
  | 'agriculture'
  | 'fishing'
  | 'construction'
  | 'household'
  | 'school'
  | 'sport'
  | 'events'
  | 'tourism'
  | 'health'
  | 'environment'
  | 'manufacturing';

export type ExamSitting = 'jan-2027' | 'may-june-2027';

export type QuestionKind = 'mcq' | 'structured';

export type QuestionStatus = 'draft' | 'approved' | 'retired';

export interface Objective {
  id: string; // syllabus numbering, e.g. 'M1.5.10' (module.topic.objective)
  text: string;
  notes?: string;
  // Objectives we cannot assess — pencil-and-compasses work. Absent means
  // assessable, and the coverage is stated plainly — ROUND_1_6 §3.
  assessable?: false;
  unassessable_reason?: string;
  /**
   * We assess half of this objective — reading a graph or solid, not producing
   * one. Counted as covered but disclosed as partial, so a rising coverage
   * number cannot quietly erase the caveat that earned it.
   */
  partial_reason?: string;
  /**
   * Unassessable from typed input alone, but a PHOTOGRAPHED construction can be
   * checked against declared params — only on plotted families the templates
   * ground-truth, never instrument constructions. Declared, not inferred. ROUND_2 §8.
   */
  photo_assessable?: true;
}

export interface RubricItem {
  code: string; // 'CK1' | 'AK1' | 'AK2' | 'R1' ...
  profile: Profile;
  criterion: string;
  mark_value: number;
  /** 'part.slot' — the slot this row is earned by (R1.8 Part 1). */
  slot_ref: string;
  /** Derived from slot_ref; kept because every existing reader uses it. */
  part_label: string;
  /**
   * The mark for expressing the answer in the required form. The scheme awards
   * it separately from the value, so a student with the right number in the
   * wrong form keeps the value marks and loses only this one.
   */
  for_format?: boolean;
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

// Model emits {template, params}, never raw SVG — ROUND_1_5 §3.
export type TemplateName =
  | 'triangleLabeled'
  | 'circleCenter'
  | 'parallelTransversal'
  | 'polygonMarkedAngle'
  | 'quadrilateralLabeled'
  | 'compoundTriangle'
  | 'coordinateGrid'
  | 'travelGraph'
  | 'barChart'
  | 'pieChart'
  | 'histogram'
  | 'cumulativeFrequency'
  | 'vennDiagram'
  | 'compositeShape'
  | 'patternFigure'
  | 'numberLine'
  | 'bearingDiagram'
  | 'vectorFigure'
  | 'dataTable';

// Only 'answer' parts are auto-graded: comparing a final answer the question
// already gave away is not assessment — ROUND_1_6 §1.
export type ResponseMode = 'answer' | 'show_that' | 'explain' | 'construct';

// The form an answer must take when the form is what is tested — ROUND_1_6 §2.
// 'sf:N' / 'dp:N' carry their precision, e.g. 'sf:3', 'dp:1'.
export type AnswerFormat =
  | 'exact'
  | 'standard_form'
  | 'lowest_terms'
  | 'integer'
  | `sf:${number}`
  | `dp:${number}`
  | 'surd'
  | 'equation_form';

/**
 * An answerable slot inside a lettered part — ROUND_1_8 Part 1. The papers put
 * several answers under one instruction; a part holding a single answer can
 * only render those as unrelated parts, losing the instruction governing them.
 */
export interface Slot {
  /** 'i' | 'ii' | a cell key like 'r5.S' | a descriptor key like 'centre'. */
  label: string;
  /** Omitted when the part's instruction says it all (table cells, EACH-of). */
  prompt?: string;
  answer: string;
  accept?: string[];
  answer_format?: AnswerFormat;
  response_mode: ResponseMode;
  rubric_codes: string[];
}

export interface QuestionPart {
  label: string; // the lettered part, 'a'..'j', as printed
  prompt: string;
  /** Sums over the rubric rows its slots earn. */
  marks: number;
  slots: Slot[];
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
