import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const apiKey =
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

const client = apiKey
  ? new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })
  : null;

// When using the Replit AI proxy, prefer a current model; otherwise a standard
// OpenAI model that works with a user-supplied key.
const MODEL = baseURL ? "gpt-5.4" : "gpt-4o-mini";

type Action = "explain" | "translate" | "quiz" | "activity" | "game";

const SYSTEM: Record<Action, (lang: string) => string> = {
  explain: (lang) =>
    `You are a friendly English teacher for the Britishce44 digital school. Explain the given content clearly and simply for English learners. ${lang === "ar" ? "Reply in Arabic." : "Reply in clear, simple English."} Keep it concise (max ~150 words).`,
  translate: (lang) =>
    lang === "ar"
      ? `You are a translator. Translate the given text from English to Arabic. Output only the translation.`
      : `You are a translator. Translate the given text from Arabic to English. If it is already English, rephrase it more simply. Output only the translation.`,
  quiz: (lang) =>
    `You are an English teacher. Create a short 5-question quiz (multiple choice with answers at the end) based on the given content. ${lang === "ar" ? "Write questions in English but instructions in Arabic." : "Write in clear English."}`,
  activity: (lang) =>
    `You are an English teacher. Suggest one engaging classroom activity (with clear steps) based on the given content for English learners. ${lang === "ar" ? "Explain in Arabic." : "Explain in English."} Keep it under ~150 words.`,
  game: (lang) =>
    `You are an English teacher. Invent one fun, simple classroom game based on the given content to practise English. Give it a name and short rules. ${lang === "ar" ? "Explain in Arabic." : "Explain in English."} Keep it under ~150 words.`,
};

const TITLE: Record<Action, string> = {
  explain: "Explanation",
  translate: "Translation",
  quiz: "Quiz",
  activity: "Activity",
  game: "Game",
};

router.post("/v1/ai/whiteboard", async (req, res) => {
  if (!client) {
    return res.status(503).json({
      error: "ai_not_configured",
      message:
        "The AI assistant isn't connected yet. Add an OpenAI API key (OPENAI_API_KEY) to enable Explain, Translate, Quiz, Activity and Game.",
    });
  }

  const { action, text, lang } = req.body as {
    action?: Action;
    text?: string;
    lang?: string;
  };

  if (!action || !SYSTEM[action]) {
    return res.status(400).json({ error: "bad_request", message: "Unknown AI action." });
  }

  const language = lang === "ar" ? "ar" : "en";
  const content =
    (text && text.trim()) ||
    "a general beginner English lesson (greetings, common vocabulary, simple sentences)";

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_completion_tokens: 1200,
      messages: [
        { role: "system", content: SYSTEM[action](language) },
        { role: "user", content: `Content:\n${content}` },
      ],
    });
    const result = completion.choices[0]?.message?.content?.trim() || "No response.";
    return res.json({ title: TITLE[action], result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: "ai_request_failed", message });
  }
});

export default router;
