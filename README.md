# AI Codebase Explainer (ACE)

**ACE** is a production-grade SaaS platform that imports GitHub repositories, analyzes their source code, builds dependency graphs, enables semantic search, and answers AI questions about the codebase.

---

## Features

| Feature | Technology |
|---|---|
| GitHub repo import & cloning | simple-git, GitHub REST API |
| Multi-language code parsing | Babel (JS/TS), regex (Python) |
| Dependency graph | Neo4j + D3.js visualization |
| Semantic & full-text search | Qdrant vectors + Typesense |
| AI Q&A (RAG) | OpenAI GPT-4o + embeddings |
| Auth (email + GitHub OAuth) | JWT, bcrypt, refresh tokens |
| Job queue pipeline | BullMQ + Redis |
| Frontend | Next.js 14, TailwindCSS, Monaco Editor |

---

## Architecture

```
Browser ──► Nginx ──► API Gateway (4000)
                            │
          ┌─────────────────┼──────────────────────┐
          ▼                 ▼                       ▼
    Auth (4001)      Repo (4002)            AI (4006)
    Parser (4003)    Graph (4004)           Search (4005)
          │
    BullMQ Workers ──► Redis queues
          │
     clone → parse → embed → graph (sequential pipeline)
```

**Data stores:**
- PostgreSQL — users, repos, files, functions, classes, chat sessions
- Redis — session tokens, BullMQ queues, progress cache
- Neo4j — dependency graph (nodes: File/Function/Class; edges: IMPORTS/DEFINES/CALLS)
- Qdrant — code chunk embeddings (text-embedding-3-small, dim 1536)
- Typesense — full-text search index for files, functions, classes

---

## Quick start

### Prerequisites
- Docker & Docker Compose v2
- Node.js 20+
- OpenAI API key
- GitHub OAuth app (for social login)

### 1. Clone and configure

```bash
git clone https://github.com/your-org/ai-codebase-explainer
cd ai-codebase-explainer
cp .env.example .env
# Fill in the required values in .env:
#   OPENAI_API_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, JWT_SECRET
```

### 2. Start infrastructure

```bash
make infra-up   # starts postgres, redis, neo4j, qdrant, typesense
```

### 3. Run database migrations

```bash
make migrate
```

### 4. Start all services (development)

```bash
npm install
make dev        # starts all 6 backend services + workers + frontend with hot-reload
```

Or via Docker:

```bash
make docker-up  # builds and starts everything in containers
```

### 5. Open the app

```
http://localhost:3000
```

---

## Project structure

```
ai-codebase-explainer/
├── backend/
│   ├── shared/            # @ace/shared — types, DB clients, utilities
│   ├── api-gateway/       # Fastify reverse proxy + JWT middleware (port 4000)
│   ├── services/
│   │   ├── auth-service/  # Register, login, GitHub OAuth (port 4001)
│   │   ├── repo-service/  # Repo import, file tree, status (port 4002)
│   │   ├── parser-service/# Babel + Python parsers (port 4003)
│   │   ├── graph-service/ # Neo4j graph builder (port 4004)
│   │   ├── search-service/# Typesense + Qdrant hybrid search (port 4005)
│   │   └── ai-service/    # RAG, embeddings, chat sessions (port 4006)
│   └── workers/           # BullMQ processors (clone → parse → embed → graph)
├── frontend/              # Next.js 14 App Router UI
├── infra/
│   └── nginx/             # nginx.conf (prod reverse proxy)
├── scripts/
│   ├── init-db.sql        # PostgreSQL schema
│   └── migrate.ts         # Migration runner
├── .github/workflows/     # CI/CD pipeline
├── docker-compose.yml
├── Makefile
└── .env.example
```

---

## Environment variables

See [.env.example](.env.example) for the full list. Key variables:

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o and embeddings |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `JWT_SECRET` | Secret for signing access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `POSTGRES_*` | PostgreSQL connection settings |
| `NEO4J_URI` | Neo4j bolt connection (e.g. `bolt://localhost:7687`) |
| `QDRANT_URL` | Qdrant HTTP endpoint |
| `TYPESENSE_API_KEY` | Typesense API key |
| `REPOS_BASE_PATH` | Local filesystem path for cloned repos |

---

## API overview

All routes go through the API Gateway at port 4000. Public routes (no auth):
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/github`
- `GET /api/v1/auth/github/callback`

Protected routes (require `Authorization: Bearer <token>`):
- `GET/POST /api/v1/repos` — list / import repositories
- `GET /api/v1/repos/:id` — repository details
- `GET /api/v1/repos/:id/files` — file tree
- `GET /api/v1/repos/:id/stats` — language breakdown stats
- `GET /api/v1/repos/:id/analysis/progress` — live progress polling
- `GET /api/v1/graph/repos/:id` — full dependency graph
- `GET /api/v1/search/repos/:id/search?q=...` — hybrid search
- `POST /api/v1/ai/repos/:id/ask` — ask the AI a question
- `GET /api/v1/ai/repos/:id/onboarding` — AI-generated onboarding guide
- `GET /api/v1/ai/repos/:id/sessions` — chat session list

---

## Development commands

```bash
make help       # list all available commands
make setup      # install all npm dependencies
make infra-up   # start only infrastructure services
make infra-down # stop infrastructure services
make migrate    # run DB migrations
make dev        # start all services with hot-reload
make docker-up  # build & start full Docker stack
make health     # check all service health endpoints
make clean      # remove dist/ and node_modules/
```
