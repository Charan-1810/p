import OpenAI from 'openai';
import { getQdrant, QDRANT_COLLECTION } from '../config/typesense';
import { getTypesense, COLLECTIONS } from '../config/typesense';
import { logger } from '@ace/shared';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const EMBEDDING_MODEL = 'text-embedding-3-small';

export interface SearchResult {
  id: string;
  type: 'file' | 'function' | 'class';
  repositoryId: string;
  filePath: string;
  name?: string;
  snippet?: string;
  language?: string;
  score: number;
}

export interface SearchOptions {
  type?: 'semantic' | 'fulltext' | 'hybrid';
  limit?: number;
  language?: string;
  filePattern?: string;
}

export class SearchService {
  async search(repositoryId: string, query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { type = 'hybrid', limit = 20 } = options;

    if (type === 'semantic') {
      return this.semanticSearch(repositoryId, query, limit, options);
    }
    if (type === 'fulltext') {
      return this.fulltextSearch(repositoryId, query, limit, options);
    }
    return this.hybridSearch(repositoryId, query, limit, options);
  }

  private async semanticSearch(
    repositoryId: string,
    query: string,
    limit: number,
    options: SearchOptions,
  ): Promise<SearchResult[]> {
    const qdrant = getQdrant();
    const embedding = await this.embed(query);

    const filter: Record<string, unknown> = {
      must: [{ key: 'repositoryId', match: { value: repositoryId } }],
    };
    if (options.language) {
      (filter.must as Array<Record<string, unknown>>).push({ key: 'language', match: { value: options.language } });
    }

    const results = await qdrant.search(QDRANT_COLLECTION, {
      vector: embedding,
      limit,
      filter,
      with_payload: true,
    });

    return results.map((r) => ({
      id: String(r.id),
      type: 'file' as const,
      repositoryId,
      filePath: String(r.payload?.filePath ?? ''),
      snippet: String(r.payload?.content ?? '').slice(0, 300),
      language: String(r.payload?.language ?? ''),
      score: r.score,
    }));
  }

  private async fulltextSearch(
    repositoryId: string,
    query: string,
    limit: number,
    options: SearchOptions,
  ): Promise<SearchResult[]> {
    const client = getTypesense();
    const results: SearchResult[] = [];

    const filterBy = [`repositoryId:=${repositoryId}`, options.language ? `language:=${options.language}` : null]
      .filter(Boolean)
      .join(' && ');

    try {
      const [filesRes, functionsRes, classesRes] = await Promise.allSettled([
        client.collections(COLLECTIONS.CODE_FILES).documents().search({
          q: query,
          query_by: 'filePath,content',
          filter_by: filterBy,
          per_page: Math.ceil(limit / 3),
        }),
        client.collections(COLLECTIONS.FUNCTIONS).documents().search({
          q: query,
          query_by: 'name,signature',
          filter_by: filterBy,
          per_page: Math.ceil(limit / 3),
        }),
        client.collections(COLLECTIONS.CLASSES).documents().search({
          q: query,
          query_by: 'name',
          filter_by: filterBy,
          per_page: Math.ceil(limit / 3),
        }),
      ]);

      if (filesRes.status === 'fulfilled' && filesRes.value.hits) {
        for (const hit of filesRes.value.hits) {
          const doc = hit.document as Record<string, unknown>;
          results.push({
            id: String(doc.id),
            type: 'file',
            repositoryId,
            filePath: String(doc.filePath),
            snippet: String(doc.content ?? '').slice(0, 300),
            language: String(doc.language ?? ''),
            score: hit.text_match ?? 0,
          });
        }
      }

      if (functionsRes.status === 'fulfilled' && functionsRes.value.hits) {
        for (const hit of functionsRes.value.hits) {
          const doc = hit.document as Record<string, unknown>;
          results.push({
            id: String(doc.id),
            type: 'function',
            repositoryId,
            filePath: String(doc.filePath),
            name: String(doc.name),
            snippet: String(doc.signature ?? ''),
            language: String(doc.language ?? ''),
            score: hit.text_match ?? 0,
          });
        }
      }

      if (classesRes.status === 'fulfilled' && classesRes.value.hits) {
        for (const hit of classesRes.value.hits) {
          const doc = hit.document as Record<string, unknown>;
          results.push({
            id: String(doc.id),
            type: 'class',
            repositoryId,
            filePath: String(doc.filePath),
            name: String(doc.name),
            language: String(doc.language ?? ''),
            score: hit.text_match ?? 0,
          });
        }
      }
    } catch (err) {
      logger.error({ err }, 'Typesense search error');
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private async hybridSearch(
    repositoryId: string,
    query: string,
    limit: number,
    options: SearchOptions,
  ): Promise<SearchResult[]> {
    const [semantic, fulltext] = await Promise.allSettled([
      this.semanticSearch(repositoryId, query, limit, options),
      this.fulltextSearch(repositoryId, query, limit, options),
    ]);

    const semanticResults = semantic.status === 'fulfilled' ? semantic.value : [];
    const fulltextResults = fulltext.status === 'fulfilled' ? fulltext.value : [];

    // Reciprocal Rank Fusion
    const scores = new Map<string, { result: SearchResult; score: number }>();
    const k = 60;

    semanticResults.forEach((r, rank) => {
      const key = `${r.type}:${r.id}`;
      const rrf = 1 / (k + rank + 1);
      const existing = scores.get(key);
      if (existing) existing.score += rrf;
      else scores.set(key, { result: r, score: rrf });
    });

    fulltextResults.forEach((r, rank) => {
      const key = `${r.type}:${r.id}`;
      const rrf = 1 / (k + rank + 1);
      const existing = scores.get(key);
      if (existing) existing.score += rrf;
      else scores.set(key, { result: r, score: rrf });
    });

    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ result, score }) => ({ ...result, score }));
  }

  async indexFile(data: {
    id: string;
    repositoryId: string;
    filePath: string;
    language: string;
    content: string;
    linesOfCode: number;
    createdAt: number;
  }): Promise<void> {
    const client = getTypesense();
    await client.collections(COLLECTIONS.CODE_FILES).documents().upsert(data);
  }

  async indexFunction(data: {
    id: string;
    repositoryId: string;
    fileId: string;
    filePath: string;
    name: string;
    language: string;
    signature: string;
    complexity: number;
    isExported: boolean;
    isAsync: boolean;
  }): Promise<void> {
    const client = getTypesense();
    await client.collections(COLLECTIONS.FUNCTIONS).documents().upsert(data);
  }

  async indexClass(data: {
    id: string;
    repositoryId: string;
    fileId: string;
    filePath: string;
    name: string;
    language: string;
    methodCount: number;
    isExported: boolean;
  }): Promise<void> {
    const client = getTypesense();
    await client.collections(COLLECTIONS.CLASSES).documents().upsert(data);
  }

  async deleteRepositoryIndex(repositoryId: string): Promise<void> {
    const client = getTypesense();
    for (const col of Object.values(COLLECTIONS)) {
      try {
        await client.collections(col).documents().delete({ filter_by: `repositoryId:=${repositoryId}` });
      } catch (err) {
        logger.warn({ err, col, repositoryId }, 'Error deleting Typesense docs');
      }
    }
  }

  async getSuggestions(repositoryId: string, prefix: string): Promise<string[]> {
    const client = getTypesense();
    try {
      const res = await client.collections(COLLECTIONS.FUNCTIONS).documents().search({
        q: prefix,
        query_by: 'name',
        filter_by: `repositoryId:=${repositoryId}`,
        per_page: 5,
        prefix: true,
      });
      return (res.hits ?? []).map((h: any) => String((h.document as Record<string, unknown>).name ?? ''));
    } catch {
      return [];
    }
  }

  private async embed(text: string): Promise<number[]> {
    const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: text });
    return res.data[0].embedding;
  }
}
