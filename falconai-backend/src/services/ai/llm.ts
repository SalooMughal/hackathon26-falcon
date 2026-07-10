import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPlatformSetting } from "@app/modules/platform-settings/platform-settings.service";
import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";

export type RagContext = {
  documentId: string;
  title: string;
  filename: string;
  chunkIndex: number;
  content: string;
};

export type GroundedAnswer = {
  answer: string;
  citations: Array<{
    documentId: string;
    title: string;
    filename: string;
    chunkIndex?: number;
    content?: string;
  }>;
  grounded: boolean;
  provider: string;
};

export type AiProvider = "openai" | "gemini" | "claude";

const SYSTEM_PROMPT = `You are FalconAI's new-joiner assistant. Answer ONLY using the provided context documents.
Rules:
1. If the context does not contain enough information to answer, say you don't know based on the available docs. Do not guess or invent facts.
2. Every factual claim must be supported by the context.
3. Respond in JSON only, with this exact shape:
{"answer":"string","grounded":true|false,"citationFilenames":["filename.md"]}
4. citationFilenames must list ONLY the source filenames whose content you actually used in the answer. Never list unused retrieved docs. If grounded is false, use an empty array.
5. Keep answers concise and helpful for a new team member.`;

const STREAM_SYSTEM_PROMPT = `You are FalconAI's new-joiner assistant. Answer ONLY using the provided context documents.
Rules:
1. If the context does not contain enough information to answer, reply with exactly: "I don't know based on the available docs." Do not guess or invent facts.
2. Every factual claim must be supported by the context.
3. Respond in plain text only — no JSON, no markdown code fences around the whole answer.
4. Keep answers concise and helpful for a new team member.
5. Do not mention document filenames unless they are needed to answer the question.`;

function buildUserPrompt(question: string, contexts: RagContext[]) {
  const contextBlock = contexts
    .map(
      (ctx, i) =>
        `[Doc ${i + 1}] title="${ctx.title}" filename="${ctx.filename}" documentId="${ctx.documentId}" chunk=${ctx.chunkIndex}\n${ctx.content}`,
    )
    .join("\n\n---\n\n");

  return `Context documents:\n\n${contextBlock}\n\nQuestion: ${question}\n\nReturn JSON only.`;
}

function buildStreamUserPrompt(question: string, contexts: RagContext[]) {
  const contextBlock = contexts
    .map(
      (ctx, i) =>
        `[Doc ${i + 1}] title="${ctx.title}" filename="${ctx.filename}" documentId="${ctx.documentId}" chunk=${ctx.chunkIndex}\n${ctx.content}`,
    )
    .join("\n\n---\n\n");

  return `Context documents:\n\n${contextBlock}\n\nQuestion: ${question}\n\nAnswer in plain text using only the context above.`;
}

type Citation = GroundedAnswer["citations"][number];

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "it",
  "this",
  "that",
  "with",
  "as",
  "by",
  "from",
  "at",
  "your",
  "you",
  "we",
  "our",
  "their",
  "they",
  "them",
  "its",
  "into",
  "about",
  "than",
  "then",
  "also",
  "only",
  "just",
  "can",
  "may",
  "will",
  "not",
  "but",
  "if",
  "so",
  "do",
  "does",
  "did",
  "have",
  "has",
  "had",
  "using",
  "used",
  "use",
  "consists",
  "include",
  "includes",
  "including",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+.\s-]/g, " ")
      .split(/\s+/)
      .map((t) => t.replace(/^\.+|\.+$/g, ""))
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const t of a) if (b.has(t)) hit += 1;
  return hit / Math.sqrt(a.size * b.size);
}

function toCitation(ctx: RagContext): Citation {
  return {
    documentId: ctx.documentId,
    title: ctx.title,
    filename: ctx.filename,
    chunkIndex: ctx.chunkIndex,
    content: ctx.content,
  };
}

/**
 * Keep only chunks that actually support the answer (not every retrieved neighbor).
 * Scores answer↔chunk overlap primarily, with a little question signal for ties.
 */
function selectRelevantCitations(answer: string, question: string, contexts: RagContext[]): Citation[] {
  if (!contexts.length) return [];

  const answerTokens = tokenize(answer);
  const questionTokens = tokenize(question);

  const scored = contexts
    .map((ctx) => {
      const chunkTokens = tokenize(`${ctx.title} ${ctx.filename} ${ctx.content}`);
      const answerScore = overlapScore(answerTokens, chunkTokens);
      const questionScore = overlapScore(questionTokens, chunkTokens);
      return {
        ctx,
        answerScore,
        score: answerScore * 0.8 + questionScore * 0.2,
      };
    })
    .sort((a, b) => b.score - a.score || b.answerScore - a.answerScore);

  const best = scored[0];
  if (!best) return [];

  // Require some answer support; otherwise cite only the single best chunk.
  const minAnswer = 0.08;
  if (best.answerScore < minAnswer) {
    return [toCitation(best.ctx)];
  }

  const threshold = Math.max(0.14, best.score * 0.6);
  const picked: Citation[] = [];
  const seen = new Set<string>();

  for (const row of scored) {
    if (row.answerScore < minAnswer || row.score < threshold) continue;
    const key = `${row.ctx.documentId}:${row.ctx.chunkIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(toCitation(row.ctx));
    if (picked.length >= 3) break;
  }

  return picked.length ? picked : [toCitation(best.ctx)];
}

/** Detect model refusals so we never attach citations to "I don't know" answers. */
function looksUngrounded(answer: string): boolean {
  const t = answer.toLowerCase();
  return (
    /\bi don't know\b/.test(t) ||
    /\bi do not know\b/.test(t) ||
    /\bdon't have enough information\b/.test(t) ||
    /\bdo not have enough information\b/.test(t) ||
    /\bnot enough information\b/.test(t) ||
    /\bcouldn't produce a grounded answer\b/.test(t) ||
    /\bcould not produce a grounded answer\b/.test(t) ||
    /\bno (relevant )?information (in|from) (the )?(available )?docs\b/.test(t) ||
    /\bnot (covered|found|mentioned) (by|in) (the )?(available )?(docs|knowledge|context)\b/.test(t)
  );
}

function parseModelJson(raw: string): { answer: string; grounded: boolean; citationFilenames: string[] } | null {
  try {
    const trimmed = raw.trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as {
      answer?: string;
      grounded?: boolean;
      citationFilenames?: string[];
    };
    if (typeof parsed.answer !== "string") return null;
    return {
      answer: parsed.answer,
      grounded: Boolean(parsed.grounded),
      citationFilenames: Array.isArray(parsed.citationFilenames)
        ? parsed.citationFilenames.filter((f) => typeof f === "string")
        : [],
    };
  } catch {
    return null;
  }
}

function mapCitations(
  contexts: RagContext[],
  filenames: string[],
  answer: string,
  question: string,
): Citation[] {
  const wanted = new Set(filenames.map((f) => f.toLowerCase()));
  const filtered =
    wanted.size > 0 ? contexts.filter((ctx) => wanted.has(ctx.filename.toLowerCase())) : contexts;

  // Prefer answer-relevant chunks within the model-named files (or all contexts if none named).
  return selectRelevantCitations(answer, question, filtered.length ? filtered : contexts);
}

async function resolveProvider(): Promise<{ provider: AiProvider; error?: never } | { error: typeof statusCodes.AiNotConfigured; provider?: never }> {
  const raw = ((await getPlatformSetting("ai.active_provider")) || "openai").toLowerCase();
  if (raw === "openai" || raw === "gemini" || raw === "claude") {
    return { provider: raw };
  }
  return { error: statusCodes.AiNotConfigured };
}

async function callOpenAI(question: string, contexts: RagContext[]) {
  const key = (await getPlatformSetting("ai.openai_api_key")) || process.env.OPENAI_API_KEY;
  if (!key) return { error: statusCodes.AiNotConfigured };
  const model = (await getPlatformSetting("ai.openai_model")) || "gpt-4o-mini";
  const client = new OpenAI({ apiKey: key });

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(question, contexts) },
    ],
  });

  return { text: completion.choices[0]?.message?.content || "" };
}

async function callClaude(question: string, contexts: RagContext[]) {
  const key = (await getPlatformSetting("ai.anthropic_api_key")) || process.env.ANTHROPIC_API_KEY;
  if (!key) return { error: statusCodes.AiNotConfigured };
  const model = (await getPlatformSetting("ai.anthropic_model")) || "claude-sonnet-4-20250514";
  const client = new Anthropic({ apiKey: key });

  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    temperature: 0.1,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(question, contexts) }],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n");

  return { text };
}

async function callGemini(question: string, contexts: RagContext[]) {
  const key = (await getPlatformSetting("ai.gemini_api_key")) || process.env.GEMINI_API_KEY;
  if (!key) return { error: statusCodes.AiNotConfigured };
  const modelName = (await getPlatformSetting("ai.gemini_model")) || "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent(buildUserPrompt(question, contexts));
  return { text: result.response.text() };
}

const generateGroundedAnswer = async (question: string, contexts: RagContext[]): Promise<{ result?: GroundedAnswer; error?: (typeof statusCodes)[keyof typeof statusCodes] }> => {
  try {
    const providerResult = await resolveProvider();
    if (providerResult.error) return { error: providerResult.error };
    const provider = providerResult.provider!;

    let rawText = "";
    if (provider === "openai") {
      const res = await callOpenAI(question, contexts);
      if (res.error) return { error: res.error };
      rawText = res.text || "";
    } else if (provider === "claude") {
      const res = await callClaude(question, contexts);
      if (res.error) return { error: res.error };
      rawText = res.text || "";
    } else {
      const res = await callGemini(question, contexts);
      if (res.error) return { error: res.error };
      rawText = res.text || "";
    }

    const parsed = parseModelJson(rawText);
    if (!parsed) {
      return {
        result: {
          answer:
            "I couldn't produce a grounded answer from the knowledge base. Please try rephrasing your question.",
          citations: [],
          grounded: false,
          provider,
        },
      };
    }

    if (!parsed.grounded || looksUngrounded(parsed.answer)) {
      return {
        result: {
          answer: parsed.answer,
          citations: [],
          grounded: false,
          provider,
        },
      };
    }

    return {
      result: {
        answer: parsed.answer,
        citations: mapCitations(contexts, parsed.citationFilenames, parsed.answer, question),
        grounded: true,
        provider,
      },
    };
  } catch (error) {
    logger.error(`Error in generateGroundedAnswer: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

async function streamOpenAI(question: string, contexts: RagContext[], onToken: (token: string) => void) {
  const key = (await getPlatformSetting("ai.openai_api_key")) || process.env.OPENAI_API_KEY;
  if (!key) return { error: statusCodes.AiNotConfigured };
  const model = (await getPlatformSetting("ai.openai_model")) || "gpt-4o-mini";
  const client = new OpenAI({ apiKey: key });

  const stream = await client.chat.completions.create({
    model,
    temperature: 0.1,
    stream: true,
    messages: [
      { role: "system", content: STREAM_SYSTEM_PROMPT },
      { role: "user", content: buildStreamUserPrompt(question, contexts) },
    ],
  });

  let full = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || "";
    if (delta) {
      full += delta;
      onToken(delta);
    }
  }
  return { text: full };
}

async function streamClaude(question: string, contexts: RagContext[], onToken: (token: string) => void) {
  const key = (await getPlatformSetting("ai.anthropic_api_key")) || process.env.ANTHROPIC_API_KEY;
  if (!key) return { error: statusCodes.AiNotConfigured };
  const model = (await getPlatformSetting("ai.anthropic_model")) || "claude-sonnet-4-20250514";
  const client = new Anthropic({ apiKey: key });

  const stream = client.messages.stream({
    model,
    max_tokens: 1024,
    temperature: 0.1,
    system: STREAM_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildStreamUserPrompt(question, contexts) }],
  });

  let full = "";
  stream.on("text", (text) => {
    full += text;
    onToken(text);
  });

  await stream.finalMessage();
  return { text: full };
}

async function streamGemini(question: string, contexts: RagContext[], onToken: (token: string) => void) {
  const key = (await getPlatformSetting("ai.gemini_api_key")) || process.env.GEMINI_API_KEY;
  if (!key) return { error: statusCodes.AiNotConfigured };
  const modelName = (await getPlatformSetting("ai.gemini_model")) || "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: STREAM_SYSTEM_PROMPT,
  });

  const result = await model.generateContentStream(buildStreamUserPrompt(question, contexts));
  let full = "";
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      full += text;
      onToken(text);
    }
  }
  return { text: full };
}

const streamGroundedAnswer = async (
  question: string,
  contexts: RagContext[],
  onToken: (token: string) => void,
): Promise<{ result?: GroundedAnswer; error?: (typeof statusCodes)[keyof typeof statusCodes] }> => {
  try {
    const providerResult = await resolveProvider();
    if (providerResult.error) return { error: providerResult.error };
    const provider = providerResult.provider!;

    let rawText = "";
    if (provider === "openai") {
      const res = await streamOpenAI(question, contexts, onToken);
      if (res.error) return { error: res.error };
      rawText = res.text || "";
    } else if (provider === "claude") {
      const res = await streamClaude(question, contexts, onToken);
      if (res.error) return { error: res.error };
      rawText = res.text || "";
    } else {
      const res = await streamGemini(question, contexts, onToken);
      if (res.error) return { error: res.error };
      rawText = res.text || "";
    }

    const answer = rawText.trim();
    if (!answer) {
      return {
        result: {
          answer: "I couldn't produce a grounded answer from the knowledge base. Please try rephrasing your question.",
          citations: [],
          grounded: false,
          provider,
        },
      };
    }

    if (looksUngrounded(answer)) {
      return {
        result: {
          answer,
          citations: [],
          grounded: false,
          provider,
        },
      };
    }

    return {
      result: {
        answer,
        citations: selectRelevantCitations(answer, question, contexts),
        grounded: true,
        provider,
      },
    };
  } catch (error) {
    logger.error(`Error in streamGroundedAnswer: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

export const llmService = {
  generateGroundedAnswer,
  streamGroundedAnswer,
  resolveProvider,
};
