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

// Atomically claim a reset jti. Returns the token doc on first claim, null on
// any subsequent claim — this is what makes a reset link single-use, and why a
// link that is opened twice cannot set two passwords.
export async function claimMagicToken(jti: string): Promise<ClaimedToken | null> {
  return MagicToken.findOneAndUpdate(
    { jti, used_at: null },
    { $set: { used_at: new Date() } },
  ).lean<ClaimedToken | null>();
}
