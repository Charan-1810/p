// ─────────────────────────────────────────────────────────────────────────────
// Shared Types — AI Codebase Explainer
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ─────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  githubId?: string;
  githubUsername?: string;
  githubAccessToken?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  sub: string;       // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ── Repository ───────────────────────────────────────────────────────────────
export type RepoStatus =
  | 'pending'
  | 'cloning'
  | 'cloned'
  | 'analyzing'
  | 'analyzed'
  | 'failed';

export interface Repository {
  id: string;
  userId: string;
  name: string;
  fullName: string;
  description?: string;
  url: string;
  cloneUrl: string;
  defaultBranch: string;
  language?: string;
  isPrivate: boolean;
  stars: number;
  forks: number;
  size: number;
  localPath?: string;
  status: RepoStatus;
  analysisProgress: number;
  errorMessage?: string;
  lastAnalyzedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepoFile {
  id: string;
  repositoryId: string;
  path: string;
  name: string;
  extension: string;
  language?: string;
  size: number;
  linesOfCode: number;
  content?: string;
  contentHash: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Analysis ─────────────────────────────────────────────────────────────────
export interface ParsedFunction {
  name: string;
  startLine: number;
  endLine: number;
  parameters: string[];
  returnType?: string;
  isAsync: boolean;
  isExported: boolean;
  complexity: number;
  docstring?: string;
}

export interface ParsedClass {
  name: string;
  startLine: number;
  endLine: number;
  methods: ParsedFunction[];
  properties: string[];
  superClass?: string;
  interfaces: string[];
  isExported: boolean;
}

export interface ParsedImport {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isDynamic: boolean;
  resolvedPath?: string;
}

export interface FileAnalysis {
  fileId: string;
  repositoryId: string;
  filePath: string;
  language: string;
  functions: ParsedFunction[];
  classes: ParsedClass[];
  imports: ParsedImport[];
  exports: string[];
  dependencies: string[];
  complexity: number;
  linesOfCode: number;
  analyzedAt: Date;
}

// ── Graph ─────────────────────────────────────────────────────────────────────
export type GraphNodeType = 'File' | 'Function' | 'Class' | 'Module' | 'Package';
export type GraphEdgeType = 'IMPORTS' | 'CALLS' | 'DEFINES' | 'EXPORTS' | 'DEPENDS_ON' | 'INHERITS' | 'IMPLEMENTS';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  repositoryId: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  type: GraphEdgeType;
  sourceId: string;
  targetId: string;
  properties?: Record<string, unknown>;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  repositoryId: string;
  generatedAt: Date;
}

// ── Search ────────────────────────────────────────────────────────────────────
export interface SearchResult {
  fileId: string;
  filePath: string;
  functionName?: string;
  className?: string;
  snippet: string;
  score: number;
  highlights: string[];
}

export interface SemanticSearchRequest {
  query: string;
  repositoryId: string;
  limit?: number;
  threshold?: number;
  filter?: {
    language?: string;
    filePattern?: string;
  };
}

// ── AI ────────────────────────────────────────────────────────────────────────
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: Date;
}

export interface ChatSession {
  id: string;
  repositoryId: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AiExplanationRequest {
  question: string;
  repositoryId: string;
  sessionId?: string;
  userId?: string;
  context?: string[];
}

export interface AiExplanationResponse {
  answer: string;
  sources: SearchResult[];
  sessionId: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// ── Worker Jobs ───────────────────────────────────────────────────────────────
export type JobType = 'clone' | 'parse' | 'embed' | 'graph' | 'security-scan';

export interface JobData {
  repositoryId: string;
  userId: string;
  [key: string]: unknown;
}

export interface CloneJobData extends JobData {
  cloneUrl: string;
  branch: string;
  githubToken?: string;
}

export interface ParseJobData extends JobData {
  localPath: string;
  languages: string[];
}

export interface EmbedJobData extends JobData {
  fileIds: string[];
}

export interface GraphJobData extends JobData {
  fileIds: string[];
}

// ── API Responses ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasNext?: boolean;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ── Events ────────────────────────────────────────────────────────────────────
export type AnalysisEventType =
  | 'analysis:started'
  | 'analysis:progress'
  | 'analysis:completed'
  | 'analysis:failed'
  | 'clone:started'
  | 'clone:completed'
  | 'clone:failed'
  | 'parse:started'
  | 'parse:progress'
  | 'parse:completed'
  | 'graph:completed'
  | 'embed:completed';

export interface AnalysisEvent {
  type: AnalysisEventType;
  repositoryId: string;
  userId: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}
