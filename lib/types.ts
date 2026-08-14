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
  | 'dataTable';

export interface QuestionPart {
  label: string; // flat 'a'..'f' — no (i)/(ii) nesting
  prompt: string;
  marks: number;
  answer: string; // values-only convention
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
