export type TextChunk = {
  content: string;
  chunkIndex: number;
  tokenEstimate: number;
};

const DEFAULT_CHUNK_SIZE = 700;
const DEFAULT_OVERLAP = 120;

/**
 * Split markdown into overlapping character chunks, preferring paragraph boundaries.
 */
export function chunkMarkdown(
  markdown: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_OVERLAP,
): TextChunk[] {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: TextChunk[] = [];
  let buffer = "";
  let currentHeading = "";

  const flush = () => {
    const content = buffer.trim();
    if (!content) return;
    chunks.push({
      content,
      chunkIndex: chunks.length,
      tokenEstimate: Math.ceil(content.length / 4),
    });
  };

  for (const paragraph of paragraphs) {
    const headingMatch = paragraph.match(/^#{1,6}\s+(.+)$/m);
    if (headingMatch) {
      currentHeading = headingMatch[1].trim();
    }

    const prefixed =
      currentHeading && !paragraph.startsWith("#")
        ? `[Section: ${currentHeading}]\n${paragraph}`
        : paragraph;

    if (!buffer) {
      buffer = prefixed;
      continue;
    }

    if (buffer.length + 2 + prefixed.length <= chunkSize) {
      buffer = `${buffer}\n\n${prefixed}`;
      continue;
    }

    flush();

    // Carry overlap from previous chunk
    if (overlap > 0 && chunks.length > 0) {
      const prev = chunks[chunks.length - 1].content;
      const overlapText = prev.slice(Math.max(0, prev.length - overlap));
      buffer = `${overlapText}\n\n${prefixed}`;
    } else {
      buffer = prefixed;
    }

    // If a single paragraph is huge, hard-split it
    while (buffer.length > chunkSize * 1.5) {
      const slice = buffer.slice(0, chunkSize);
      chunks.push({
        content: slice.trim(),
        chunkIndex: chunks.length,
        tokenEstimate: Math.ceil(slice.length / 4),
      });
      buffer = buffer.slice(chunkSize - overlap);
    }
  }

  flush();
  return chunks;
}
