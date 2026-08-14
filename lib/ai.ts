import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// Single model instance for the generation pipeline (ROUND_1 §4).
// The apiKey is passed explicitly because our env var is AI_API_KEY,
// not the OPENAI_API_KEY the SDK would read by default.
// All provider imports live here — nowhere else.
export const MODEL_ID = 'gpt-5.5';
export const REVIEW_MODEL_ID = 'gpt-5.6-luna';
export const ESCALATION_MODEL_ID = 'gpt-5.6-terra';

const { AI_API_KEY } = z.object({ AI_API_KEY: z.string().min(1) }).parse(process.env);
const openai = createOpenAI({ apiKey: AI_API_KEY });

export const model = openai(MODEL_ID);
export const reviewModel = openai(REVIEW_MODEL_ID);
export const escalationModel = openai(ESCALATION_MODEL_ID);
