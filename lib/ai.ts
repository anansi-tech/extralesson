import { createOpenAI } from '@ai-sdk/openai';

// Single model instance for the generation pipeline (ROUND_1 §4).
// The apiKey is passed explicitly because our env var is AI_API_KEY,
// not the OPENAI_API_KEY the SDK would read by default.
// All provider imports live here — nowhere else.
export const MODEL_ID = 'gpt-5.6-terra';

/**
 * Reading handwriting is mechanical, not judgment, so it runs on the cheap tier
 * (R2 §3). Marking the working against a criterion IS judgment and stays on the
 * capable tier — two legs, two models, so the accurate-but-expensive one is
 * only paid for where it decides something.
 */
export const READER_MODEL_ID = 'gpt-5.6-luna';

const openai = createOpenAI({ apiKey: process.env.AI_API_KEY });

export const model = openai(MODEL_ID);
export const reader = openai(READER_MODEL_ID);
