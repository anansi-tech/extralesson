import type { ModuleNumber, Objective } from '@/lib/types';

// Shape consumed by scripts/seed-topics.ts. Transcribed from
// design/syllabus-2027.pdf (CXC 05/G/SYLL 16, Amended Oct 2025).
export interface SeedTopic {
  module: ModuleNumber;
  code: string; // 'M1-ALG1'
  title: string;
  order: number; // position within module
  objectives: Objective[];
}
