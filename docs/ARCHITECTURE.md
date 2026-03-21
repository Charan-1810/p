# Architecture

## System overview

ACE is a microservices SaaS platform. All client traffic flows through Nginx → API Gateway, which authenticates JWT tokens and proxies requests to the appropriate service.

```
┌─────────────────────────────────────────────────────────────┐
│  Browser / Mobile                                           │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Nginx (port 80)  – reverse proxy                           │
│    /api/*  → API Gateway                                    │
│    /*      → Frontend (Next.js)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  API Gateway (port 4000) – Fastify + @fastify/http-proxy    │
│  • JWT verification (RS256 / HS256)                         │
│  • Rate limiting (100 req/min default)                      │
│  • Header forwarding: x-user-id, x-user-email, x-user-role │
│  • Routes: /auth/* /repos/* /parser/* /graph/* /search/*   │
│            /ai/*                                            │
└──────────────────────────────┬──────────────────────────────┘
           ┌────────┬──────────┼──────────┬──────────┐
           ▼        ▼          ▼          ▼          ▼
        Auth     Repo      Parser     Graph      AI+Search
       (4001)   (4002)    (4003)     (4004)    (4006/4005)
```

## Analysis pipeline

When a user imports a repository, a sequential BullMQ job chain is triggered:

```
POST /repos  →  repo-service creates DB record  →  cloneQueue.add()
                                                         │
                                                         ▼
                                                   Clone Processor
                                                   (simple-git clone)
                                                         │
                                                         ▼
                                                   Parse Processor
                                                   (calls parser-service)
                                                   Babel / Python parsers
                                                   saves functions & classes
                                                   to PostgreSQL
                                                         │
                                                         ▼
                                                   Embed Processor
                                                   (calls ai-service /embed)
                                                   OpenAI embeddings → Qdrant
                                                   Typesense file index
                                                         │
                                                         ▼
                                                   Graph Processor
                                                   (calls graph-service)
                                                   Neo4j nodes + edges
                                                         │
                                                         ▼
                                                  status = "analyzed"
```

## Data model

### PostgreSQL
| Table | Purpose |
|---|---|
| `users` | Accounts with email/password or GitHub OAuth |
| `repositories` | One record per imported repo |
| `repo_files` | Every parsed file with path, language, LOC |
| `functions` | Functions extracted per file |
| `classes` | Classes extracted per file |
| `chat_sessions` | AI conversation history (JSONB messages) |

### Neo4j graph schema
**Node labels:** `Repository`, `File`, `Function`, `Class`, `Module`  
**Relationships:** `IMPORTS`, `DEFINES`, `CONTAINS`, `CALLS`, `EXPORTS`

### Qdrant collections
- `code_embeddings` — 1536-dim vectors (text-embedding-3-small), payload: `{repositoryId, fileId, filePath, language, chunkIndex, content}`

### Typesense collections
- `code_files` — full-text searchable file metadata
- `functions` — searchable by name and signature
- `classes` — searchable by name

## AI (RAG) flow

```
User question
     │
     ▼
Embed question  (OpenAI text-embedding-3-small)
     │
     ▼
Qdrant search   (top-K relevant code chunks filtered by repositoryId)
     │
     ▼
Build context prompt:
     system prompt + top-K code chunks + last-N conversation messages
     │
     ▼
GPT-4o chat completion
     │
     ▼
Stream/return answer + persist to chat_sessions
```

## Security

- All passwords hashed with bcrypt (12 rounds)
- Access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry, stored in Redis (revocable)
- API rate limit: 100 req/min per IP on API Gateway
- Services run as non-root `aceuser` inside containers
- No credentials exposed via API responses (pino redaction)
- Content-Security-Policy, X-Frame-Options, and other headers via @fastify/helmet
