import OpenAI from "openai";
import { getPlatformSetting } from "@app/modules/platform-settings/platform-settings.service";
import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";

async function getOpenAiClient() {
  const keyFromSettings = await getPlatformSetting("ai.openai_api_key");
  const apiKey = keyFromSettings || process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: statusCodes.AiNotConfigured };
  return { client: new OpenAI({ apiKey }) };
}

async function getEmbeddingModel() {
  return (await getPlatformSetting("ai.embedding_model")) || "text-embedding-3-small";
}

async function getEmbeddingDimensions() {
  const raw = await getPlatformSetting("ai.embedding_dimensions");
  const dims = Number(raw);
  // Default 512 to match common Pinecone starter indexes; text-embedding-3-small supports Matryoshka dims
  return Number.isFinite(dims) && dims > 0 ? dims : 512;
}

const embedTexts = async (texts: string[]) => {
  try {
    if (texts.length === 0) return { embeddings: [] as number[][] };

    const { client, error } = await getOpenAiClient();
    if (error || !client) return { error: error || statusCodes.AiNotConfigured };

    const model = await getEmbeddingModel();
    const dimensions = await getEmbeddingDimensions();

    const response = await client.embeddings.create({
      model,
      input: texts,
      dimensions,
    });

    const embeddings = response.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);

    return { embeddings };
  } catch (error) {
    logger.error(`Error in embedTexts: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.AiNotConfigured };
  }
};

const embedText = async (text: string) => {
  const result = await embedTexts([text]);
  if (result.error) return { error: result.error };
  return { embedding: result.embeddings![0] };
};

export const embeddingsService = {
  embedTexts,
  embedText,
};
