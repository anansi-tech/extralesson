import { createOpenAI } from '@ai-sdk/openai';

// Single model instance for the generation pipeline (ROUND_1 §4).
// The apiKey is passed explicitly because our env var is AI_API_KEY,
// not the OPENAI_API_KEY the SDK would read by default.
// All provider imports live here — nowhere else.
export const MODEL_ID = 'gpt-5.6-terra';

const openai = createOpenAI({ apiKey: process.env.AI_API_KEY });

export const model = openai(MODEL_ID);
