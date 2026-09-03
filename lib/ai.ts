import { createOpenAI } from '@ai-sdk/openai';

// apiKey is explicit because our env var is AI_API_KEY, not the OPENAI_API_KEY
// the SDK would read by default. All provider imports live here — nowhere else.
export const MODEL_ID = 'gpt-5.6-terra';

/**
 * Reading handwriting is mechanical; marking against a criterion is judgment.
 * Two legs, two tiers, so the expensive model is only paid for where it decides
 * something — see ROUND_2 §3.
 */
export const READER_MODEL_ID = 'gpt-5.6-luna';

const openai = createOpenAI({ apiKey: process.env.AI_API_KEY });

export const model = openai(MODEL_ID);
export const reader = openai(READER_MODEL_ID);
