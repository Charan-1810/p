import OpenAI from 'openai';
import { QdrantClient } from '@qdrant/js-client-rest';
import {
  QDRANT_COLLECTION,
  EMBEDDING_DIMENSION,
  MAX_CONTEXT_CHUNKS,
  MAX_CHUNK_SIZE,
  CHUNK_OVERLAP,
  logger,
} from '@ace/shared';

export class EmbeddingService {
  private readonly openai: OpenAI;
  private readonly qdrant: QdrantClient;
  private readonly embeddingModel: string;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.qdrant = new QdrantClient({
      host: process.env.QDRANT_HOST ?? 'localhost',
      port: parseInt(process.env.QDRANT_PORT ?? '6333', 10),
    });
    this.embeddingModel = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';
  }

  async ensureCollection(): Promise<void> {
    try {
      await this.qdrant.getCollection(QDRANT_COLLECTION);
    } catch {
      await this.qdrant.createCollection(QDRANT_COLLECTION, {
        vectors: {
          size: EMBEDDING_DIMENSION,
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
      });
      logger.info({ collection: QDRANT_COLLECTION }, 'Qdrant collection created');
    }
  }

  async embedText(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.embeddingModel,
      input: text.slice(0, 8192), // API limit
    });
    return response.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    // Batch in groups of 100 to respect rate limits
    const batches: string[][] = [];
    for (let i = 0; i < texts.length; i += 100) {
      batches.push(texts.slice(i, i + 100));
    }

    const results: number[][] = [];
    for (const batch of batches) {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: batch.map((t) => t.slice(0, 8192)),
      });
      results.push(...response.data.map((d) => d.embedding));
    }
    return results;
  }

  async indexFileChunks(
    repositoryId: string,
    fileId: string,
    filePath: string,
    content: string,
    language?: string
  ): Promise<void> {
    const chunks = chunkCode(content, MAX_CHUNK_SIZE, CHUNK_OVERLAP);
    if (chunks.length === 0) return;

    const embeddings = await this.embedBatch(chunks);

    const points = chunks.map((chunk, i) => ({
      id: `${fileId}-${i}`,
      vector: embeddings[i],
      payload: {
        repositoryId,
        fileId,
        filePath,
        language: language ?? 'unknown',
        chunkIndex: i,
        content: chunk,
        totalChunks: chunks.length,
      },
    }));

    await this.qdrant.upsert(QDRANT_COLLECTION, { points });
  }

  async search(
    repositoryId: string,
    query: string,
    limit = 10,
    scoreThreshold = 0.7
  ): Promise<Array<{
    fileId: string;
    filePath: string;
    content: string;
    score: number;
    language: string;
  }>> {
    const queryEmbedding = await this.embedText(query);

    const results = await this.qdrant.search(QDRANT_COLLECTION, {
      vector: queryEmbedding,
      limit,
      score_threshold: scoreThreshold,
      filter: {
        must: [
          {
            key: 'repositoryId',
            match: { value: repositoryId },
          },
        ],
      },
    });

    return results.map((r) => ({
      fileId: r.payload?.['fileId'] as string,
      filePath: r.payload?.['filePath'] as string,
      content: r.payload?.['content'] as string,
      score: r.score,
      language: r.payload?.['language'] as string ?? 'unknown',
    }));
  }

  async deleteRepositoryEmbeddings(repositoryId: string): Promise<void> {
    await this.qdrant.delete(QDRANT_COLLECTION, {
      filter: {
        must: [{ key: 'repositoryId', match: { value: repositoryId } }],
      },
    });
  }
}

function chunkCode(content: string, chunkSize: number, overlap: number): string[] {
  const lines = content.split('\n');
  const chunks: string[] = [];

  let start = 0;
  while (start < lines.length) {
    const end = Math.min(start + chunkSize, lines.length);
    const chunk = lines.slice(start, end).join('\n').trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }
    start += chunkSize - overlap;
  }

  return chunks;
}
