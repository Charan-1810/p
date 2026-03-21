import Typesense from 'typesense';
import { QdrantClient } from '@qdrant/js-client-rest';
import { logger } from '@ace/shared';

const TYPESENSE_HOST = process.env.TYPESENSE_HOST ?? 'localhost';
const TYPESENSE_PORT = parseInt(process.env.TYPESENSE_PORT ?? '8108', 10);
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY ?? 'xyz';
const QDRANT_URL = process.env.QDRANT_URL ?? 'http://localhost:6333';

let typesenseClient: InstanceType<typeof Typesense.Client> | null = null;
let qdrantClient: QdrantClient | null = null;

export const COLLECTIONS = {
  CODE_FILES: 'code_files',
  FUNCTIONS: 'functions',
  CLASSES: 'classes',
} as const;

export const QDRANT_COLLECTION = 'code_embeddings';

export function getTypesense(): InstanceType<typeof Typesense.Client> {
  if (!typesenseClient) {
    typesenseClient = new Typesense.Client({
      nodes: [{ host: TYPESENSE_HOST, port: TYPESENSE_PORT, protocol: 'http' }],
      apiKey: TYPESENSE_API_KEY,
      connectionTimeoutSeconds: 10,
    });
  }
  return typesenseClient;
}

export function getQdrant(): QdrantClient {
  if (!qdrantClient) {
    qdrantClient = new QdrantClient({ url: QDRANT_URL });
  }
  return qdrantClient;
}

export async function initTypesenseCollections(): Promise<void> {
  try {
    const client = getTypesense();
    // Verify connection by getting collections
    await client.collections().retrieve();
    logger.info('Typesense collections initialized');
  } catch (err) {
    logger.warn({ err }, 'Failed to initialize Typesense collections');
    throw err;
  }
}
