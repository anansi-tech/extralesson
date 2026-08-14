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
