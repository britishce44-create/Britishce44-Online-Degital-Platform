import OpenAI from "openai";

const apiKey =
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

export const aiClient = apiKey
  ? new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })
  : null;

// On the Replit AI proxy, prefer a current model; otherwise a standard model
// that works with a user-supplied key.
export const AI_MODEL = baseURL ? "gpt-5.4" : "gpt-4o-mini";

export const aiConfigured = Boolean(aiClient);
