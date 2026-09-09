/** Mongo's duplicate-key code. The ONLY error read as "someone else wrote it". */
export const isDuplicateKey = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { code?: number }).code === 11000;
