// ─────────────────────────────────────────────────────────────────────────────
// Application Constants
// ─────────────────────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  CLONE: 'repo-clone',
  PARSE: 'repo-parse',
  EMBED: 'repo-embed',
  GRAPH: 'repo-graph',
  SECURITY_SCAN: 'repo-security-scan',
} as const;

export const SUPPORTED_LANGUAGES: Record<string, string[]> = {
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
  typescript: ['.ts', '.tsx', '.mts', '.cts'],
  python: ['.py', '.pyw', '.pyi'],
  java: ['.java'],
  go: ['.go'],
  cpp: ['.cpp', '.cc', '.cxx', '.hpp', '.h', '.hxx'],
  rust: ['.rs'],
  ruby: ['.rb', '.rake'],
  php: ['.php'],
  csharp: ['.cs'],
  swift: ['.swift'],
  kotlin: ['.kt', '.kts'],
};

export const EXCLUDED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.github',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  'coverage',
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  'venv',
  '.venv',
  'env',
  '.env',
  'vendor',
  'target',
  '.idea',
  '.vscode',
  '.DS_Store',
]);

export const EXCLUDED_FILE_PATTERNS = [
  /\.min\.(js|css)$/,
  /\.bundle\.js$/,
  /\.map$/,
  /lock\.json$/,
  /yarn\.lock$/,
  /package-lock\.json$/,
  /pnpm-lock\.yaml$/,
];

export const SERVICE_NAMES = {
  API_GATEWAY: 'api-gateway',
  AUTH: 'auth-service',
  REPO: 'repo-service',
  PARSER: 'parser-service',
  GRAPH: 'graph-service',
  SEARCH: 'search-service',
  AI: 'ai-service',
  WORKERS: 'workers',
} as const;

export const NEO4J_LABELS = {
  FILE: 'File',
  FUNCTION: 'Function',
  CLASS: 'Class',
  MODULE: 'Module',
  PACKAGE: 'Package',
  REPOSITORY: 'Repository',
} as const;

export const NEO4J_RELATIONSHIPS = {
  IMPORTS: 'IMPORTS',
  CALLS: 'CALLS',
  DEFINES: 'DEFINES',
  EXPORTS: 'EXPORTS',
  DEPENDS_ON: 'DEPENDS_ON',
  INHERITS: 'INHERITS',
  IMPLEMENTS: 'IMPLEMENTS',
  CONTAINS: 'CONTAINS',
  PART_OF: 'PART_OF',
} as const;

export const REDIS_KEYS = {
  REFRESH_TOKEN: (userId: string) => `refresh_token:${userId}`,
  ANALYSIS_PROGRESS: (repoId: string) => `analysis:progress:${repoId}`,
  RATE_LIMIT: (ip: string, route: string) => `rl:${ip}:${route}`,
  REPO_CACHE: (repoId: string) => `repo:cache:${repoId}`,
  SEARCH_CACHE: (query: string) => `search:cache:${Buffer.from(query).toString('base64')}`,
} as const;

export const QDRANT_COLLECTION = 'code_embeddings';
export const EMBEDDING_DIMENSION = 1536; // text-embedding-3-small

export const MAX_CONTEXT_CHUNKS = 10;
export const MAX_CHUNK_SIZE = 512;
export const CHUNK_OVERLAP = 50;

export const ANALYSIS_PROGRESS = {
  CLONING: 10,
  CLONED: 20,
  PARSING: 30,
  PARSED: 60,
  BUILDING_GRAPH: 70,
  GRAPH_BUILT: 80,
  EMBEDDING: 85,
  EMBEDDED: 95,
  COMPLETED: 100,
} as const;
