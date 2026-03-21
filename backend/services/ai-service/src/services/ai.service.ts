import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import {
  ChatMessage,
  AiExplanationRequest,
  AiExplanationResponse,
  getCache,
  setCache,
  query,
  queryOne,
  logger,
} from '@ace/shared';
import { EmbeddingService } from './embedding.service';
import { SYSTEM_PROMPTS, buildRAGPrompt } from '../prompts/system.prompts';

export class AiService {
  private readonly openai: OpenAI;
  private readonly embedding: EmbeddingService;
  private readonly model: string;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.embedding = new EmbeddingService();
    this.model = process.env.OPENAI_MODEL ?? 'gpt-4o';
  }

  async explainCode(request: AiExplanationRequest): Promise<AiExplanationResponse> {
    const { question, repositoryId, sessionId } = request;

    // 1. Retrieve relevant files via semantic search (RAG)
    const contextChunks = await this.embedding.search(repositoryId, question, 10, 0.65);

    // 2. Get or create chat session
    const sid = sessionId ?? uuidv4();
    const session = await this.getOrCreateSession(sid, repositoryId, request.userId ?? '');

    // 3. Get repository name for context
    const repoRow = await queryOne<{ name: string }>(
      'SELECT name FROM repositories WHERE id = $1',
      [repositoryId]
    );

    // 4. Build messages for the LLM
    const ragPrompt = buildRAGPrompt(question, contextChunks, repoRow?.name ?? repositoryId);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPTS.CODEBASE_EXPLAINER },
      // Include conversation history (last 6 turns for context window management)
      ...session.messages.slice(-6).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: ragPrompt },
    ];

    // 5. Call LLM
    logger.info({ repositoryId, sessionId: sid, questionLength: question.length }, 'AI query started');

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.2, // Lower temp for more factual, code-focused responses
      max_tokens: 2000,
    });

    const answer = completion.choices[0].message.content ?? 'I could not generate a response.';
    const usage = completion.usage;

    // 6. Persist messages to session
    await this.appendMessages(sid, [
      { role: 'user', content: question, timestamp: new Date() },
      { role: 'assistant', content: answer, timestamp: new Date() },
    ]);

    logger.info(
      { repositoryId, sessionId: sid, tokens: usage?.total_tokens },
      'AI query completed'
    );

    return {
      answer,
      sources: contextChunks.map((c) => ({
        fileId: c.fileId,
        filePath: c.filePath,
        snippet: c.content.slice(0, 300),
        score: c.score,
        highlights: [],
      })),
      sessionId: sid,
      tokens: {
        prompt: usage?.prompt_tokens ?? 0,
        completion: usage?.completion_tokens ?? 0,
        total: usage?.total_tokens ?? 0,
      },
    };
  }

  async generateOnboarding(repositoryId: string): Promise<string> {
    // Gather repo-wide context
    const [stats, langRows] = await Promise.all([
      queryOne<{ total_files: string; total_functions: string }>(
        `SELECT
          (SELECT COUNT(*) FROM repo_files WHERE repository_id = $1)::text AS total_files,
          (SELECT COUNT(*) FROM functions   WHERE repository_id = $1)::text AS total_functions`,
        [repositoryId]
      ),
      query<{ language: string; file_count: string }>(
        `SELECT language, COUNT(*)::text AS file_count
         FROM repo_files WHERE repository_id = $1 AND language IS NOT NULL
         GROUP BY language ORDER BY COUNT(*) DESC LIMIT 5`,
        [repositoryId]
      ),
    ]);

    const topFiles = await this.embedding.search(
      repositoryId,
      'main entry point, api routes, services, database configuration, authentication',
      20,
      0.5
    );

    const context = `
Repository ID: ${repositoryId}
Total files: ${stats?.total_files ?? 'unknown'}
Total functions: ${stats?.total_functions ?? 'unknown'}
Languages: ${langRows.map((r) => `${r.language} (${r.file_count} files)`).join(', ')}

Key files discovered:
${topFiles.slice(0, 15).map((f) => `- ${f.filePath}`).join('\n')}
    `.trim();

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.ONBOARDING },
        { role: 'user', content: context },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    return completion.choices[0].message.content ?? 'Could not generate onboarding guide.';
  }

  async getSessions(repositoryId: string, userId: string) {
    return query<{ id: string; title: string; created_at: Date; updated_at: Date }>(
      `SELECT id, title, created_at, updated_at
       FROM chat_sessions
       WHERE repository_id = $1 AND user_id = $2
       ORDER BY updated_at DESC`,
      [repositoryId, userId]
    );
  }

  async getSessionMessages(sessionId: string, userId: string) {
    const row = await queryOne<{ messages: string; repository_id: string }>(
      'SELECT messages, repository_id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    if (!row) return null;
    return { messages: JSON.parse(row.messages) as ChatMessage[], repositoryId: row.repository_id };
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private async getOrCreateSession(
    sessionId: string,
    repositoryId: string,
    userId: string
  ) {
    const existing = await queryOne<{ id: string; messages: string }>(
      'SELECT id, messages FROM chat_sessions WHERE id = $1',
      [sessionId]
    );

    if (existing) {
      return {
        id: existing.id,
        messages: JSON.parse(existing.messages) as ChatMessage[],
      };
    }

    await queryOne(
      `INSERT INTO chat_sessions (id, repository_id, user_id, messages, title)
       VALUES ($1, $2, $3, '[]', $4)`,
      [sessionId, repositoryId, userId, 'New Conversation']
    );

    return { id: sessionId, messages: [] as ChatMessage[] };
  }

  private async appendMessages(sessionId: string, messages: ChatMessage[]): Promise<void> {
    await queryOne(
      `UPDATE chat_sessions
       SET messages = messages || $1::jsonb,
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(messages), sessionId]
    );
  }

  private get userId(): string | undefined {
    return undefined;
  }
}
