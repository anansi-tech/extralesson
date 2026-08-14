import { MagicToken } from '@/lib/db/magic-token';

export interface ClaimedToken {
  email: string;
  profile?: {
    name: string;
    island?: string;
    exam_sitting: 'jan-2027' | 'may-june-2027';
    target_modules: number[];
  };
}

// Atomically claim a magic-link jti. Returns the token doc on first claim,
// null on any subsequent claim — this is what makes links single-use.
export async function claimMagicToken(jti: string): Promise<ClaimedToken | null> {
  return MagicToken.findOneAndUpdate(
    { jti, used_at: null },
    { $set: { used_at: new Date() } },
  ).lean<ClaimedToken | null>();
}
