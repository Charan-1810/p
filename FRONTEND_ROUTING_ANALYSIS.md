# Frontend Routing & Pages Structure Analysis

## 1. COMPLETE ROUTE STRUCTURE

### App Directory Layout
```
frontend/src/app/
├── page.tsx              → / (Landing page - unauthenticated)
├── layout.tsx            → Root layout (dark theme, Providers)
├── providers.tsx         → QueryClient + React Query setup
├── globals.css
│
├── login/
│   └── page.tsx          → /login (Email/password + GitHub OAuth)
├── register/
│   └── page.tsx          → /register (Sign up + GitHub OAuth)
│
├── auth/
│   └── callback/
│       └── page.tsx      → /auth/callback (OAuth redirect handler)
│
├── dashboard/
│   └── page.tsx          → /dashboard (Repo list + import form)
│
└── repos/
    └── [repoId]/
        ├── page.tsx          → /repos/{repoId} (Repo overview)
        ├── files/
        │   └── page.tsx      → /repos/{repoId}/files (File explorer)
        ├── graph/
        │   └── page.tsx      → /repos/{repoId}/graph (Dependency visualization)
        ├── search/
        │   └── page.tsx      → /repos/{repoId}/search (Code search)
        ├── ai/
        │   └── page.tsx      → /repos/{repoId}/ai (AI chat interface)
        ├── analytics/
        │   └── page.tsx      → /repos/{repoId}/analytics (Code metrics)
        └── [id]/ (Legacy route group)
```

### Route Purpose Summary
| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Landing page with features overview | No |
| `/login` | User login (email/password or GitHub) | No |
| `/register` | User registration | No |
| `/auth/callback` | OAuth callback handler | No |
| `/dashboard` | Main hub - list repos + import new ones | **Yes** |
| `/repos/:repoId` | Repo overview with status, stats, feature cards | **Yes** |
| `/repos/:repoId/files` | Browse source files with syntax highlighting | **Yes** |
| `/repos/:repoId/graph` | Interactive dependency graph visualization | **Yes** |
| `/repos/:repoId/search` | Full-text + semantic code search | **Yes** |
| `/repos/:repoId/ai` | AI-powered Q&A chat about codebase | **Yes** |
| `/repos/:repoId/analytics` | Language breakdowns, file counts, metrics | **Yes** |

---

## 2. DASHBOARD PAGE FLOW

### File: [frontend/src/app/dashboard/page.tsx](frontend/src/app/dashboard/page.tsx)

**Key Components:**
- **RepoCard**: Displays individual repository with status badge
- **Import Form**: Takes GitHub URL, validates, submits via `importRepo` mutation
- **Repo List**: Grid layout (3 columns on desktop) with pagination

**Status Display:**
Repos show their analysis status with color-coded badges:
```typescript
const STATUS_STYLES: Record<string, string> = {
  analyzed: 'text-green-400',   // ✓ Ready to explore
  failed: 'text-red-400',       // ✗ Analysis failed
  cloning: 'text-yellow-400',   // ⟳ Stage 1
  parsing: 'text-yellow-400',   // ⟳ Stage 2
  embedding: 'text-yellow-400', // ⟳ Stage 3
  graphing: 'text-yellow-400',  // ⟳ Stage 4
  queued: 'text-gray-400',      // ⏱ Waiting
};
```

**Dashboard Hooks Used:**
- `useRepos(page)` - Fetch repos list (paginated, 20 per page)
- `useImportRepo()` - Trigger import of new repository
- `useDeleteRepo()` - Remove repository from system

---

## 3. REPO IMPORT FLOW

### Import Process (User Perspective)
1. User enters GitHub URL: `https://github.com/owner/repo`
2. Click "Import" button
3. **POST** `/repos` with `{ url: string }`
4. Server returns `Repository` object with `status: "queued"`
5. Dashboard auto-refetches repo list
6. Repo card shows progress through analysis stages

### Analysis Stages (Backend Processing)
```
queued → cloning → parsing → embedding → graphing → analyzed
```

**Data Available After Import:**
```typescript
interface Repository {
  id: string;              // Unique repository ID
  fullName: string;        // "owner/repo"
  description?: string;    // Repository description
  language?: string;       // Primary language (JavaScript, Python, etc.)
  stars: number;           // GitHub star count
  status: string;          // Current processing status
  createdAt: string;       // When repo was imported
  analyzedAt?: string;     // When analysis completed
}
```

### Key API Endpoints (from [repo.service.ts](frontend/src/services/repo.service.ts))
```typescript
POST   /repos                    → importRepo(url)        // Trigger import
GET    /repos                    → listRepos(page, limit) // Fetch repos
GET    /repos/:id                → getRepo(id)            // Single repo details
GET    /repos/:id/stats          → getStats(id)           // RepoStats object
GET    /repos/:id/analysis/progress → getProgress(id)     // { progress, message }
GET    /repos/:id/files          → getFiles(id)           // File tree
GET    /repos/:id/files/:fileId  → getFileContent()       // File with syntax
DELETE /repos/:id                → deleteRepo(id)         // Remove repo
POST   /repos/:id/reanalyze      → reanalyze(id)          // Trigger re-analysis
```

---

## 4. REPO DETAILS PAGE STRUCTURE

### File: [frontend/src/app/repos/[repoId]/page.tsx](frontend/src/app/repos/[repoId]/page.tsx)

**Overview Page Components:**
1. **Header**: Repo name, stars, language color indicator, status badge, progress bar
2. **Feature Cards**: 5 clickable cards linking to sub-features
3. **Sidebar Navigation**: Fixed left sidebar with repo sections (RepoSidebar.tsx)

**Feature Cards:**
```typescript
const FEATURES = [
  {
    href: '/files',
    label: 'File Explorer',
    icon: FileCode,
    description: 'Browse source files and read code with syntax highlighting.'
  },
  {
    href: '/graph',
    label: 'Dependency Graph',
    icon: GitFork,
    description: 'Visualize file relationships and import/export dependencies.'
  },
  {
    href: '/search',
    label: 'Code Search',
    icon: Search,
    description: 'Search across the codebase using full-text or semantic search.'
  },
  {
    href: '/ai',
    label: 'AI Chat',
    icon: Brain,
    description: 'Ask questions about the codebase and get AI-powered answers.'
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'View language breakdowns, file counts, and code metrics.'
  },
];
```

**Sidebar Navigation (from [RepoSidebar.tsx](frontend/src/components/layout/RepoSidebar.tsx)):**
```
/repos/{repoId}
├── Overview (exact match)
├── Files
├── Graph
├── AI Chat
├── Search
└── Analytics
```

**Data Loaded:**
- `useRepo(repoId)` - Repository details
- `useRepoStats(repoId)` - Statistics (RepoStats type)
- `useRepoProgress(repoId)` - Analysis progress (refetch every 3s when processing)

---

## 5. REPOSITORY DATA STRUCTURE

### Repository Interface
```typescript
interface Repository {
  id: string;              // UUID or slug
  fullName: string;        // "owner/repo" format
  description?: string;    // GitHub repo description
  language?: string;       // Primary language (e.g., "TypeScript")
  stars: number;           // GitHub stars (0 if not fetched)
  status: string;          // "queued" | "cloning" | "parsing" | "embedding" | "graphing" | "analyzed" | "failed"
  createdAt: string;       // ISO timestamp of import
  analyzedAt?: string;     // ISO timestamp when complete
}
```

### RepoStats Interface
```typescript
interface RepoStats {
  totalFiles: number;
  totalFunctions: number;
  totalClasses: number;
  totalLines: number;
  languages: Array<{
    language: string;      // e.g., "TypeScript"
    count: number;         // number of files
    percentage: number;    // percent (0-100)
  }>;
}
```

---

## 6. WHERE TO ADD A "REPO DETAILS" PAGE

### Recommended Approach

**Option A: New Route Under Repos** (Recommended)
```
/repos/:repoId/details/page.tsx
```
- Follows Next.js file-based routing
- Keeps it within repo context
- Add to sidebar nav after Overview
- Access via: `/repos/{repoId}/details`

**Option B: Replace Current Overview**
- Expand current `/repos/:repoId/page.tsx` to be more detailed
- No routing change needed

**Option C: Separate Dashboard Tab**
```
/repos/:repoId/information/page.tsx
```
- More semantic naming

### Implementation Steps for New Details Page

1. Create directory:
   ```
   frontend/src/app/repos/[repoId]/details/
   ```

2. Add navigation to [RepoSidebar.tsx](frontend/src/components/layout/RepoSidebar.tsx):
   ```typescript
   const navItems = [
     { href: '', label: 'Overview', icon: LayoutGrid, exact: true },
     { href: '/details', label: 'Details', icon: Info, exact: false }, // ← ADD HERE
     { href: '/files', label: 'Files', icon: FileCode, exact: false },
     // ... rest
   ];
   ```

3. Create `page.tsx` with:
   - Repository metadata display
   - Full description, links, topics
   - Contributors, last updated
   - Detailed stats from `useRepoStats(repoId)`

---

## 7. STATE MANAGEMENT & HOOKS

### React Query Setup
- **Provider**: `[frontend/src/app/providers.tsx](frontend/src/app/providers.tsx)`
- **Config**: `staleTime: 60s, retry: 1`
- Query keys organized by resource

### Custom Hooks (from [useRepo.ts](frontend/src/hooks/useRepo.ts))
```typescript
useRepos(page)              // List all repos with pagination
useRepo(id)                 // Single repo details + auto-refetch
useRepoStats(id)            // Repository statistics
useRepoProgress(id, enabled) // Analysis progress (3s refetch)
useImportRepo()             // Mutation: POST /repos
useDeleteRepo()             // Mutation: DELETE /repos/:id
useRepoFiles(repoId)        // File tree for explorer
useFileContent(repoId, fileId) // Individual file content
```

### Auth Store
- `useAuthStore()` - Global auth state
- Manages: `user`, `accessToken`, `refreshToken`
- Set on login/register callbacks

---

## 8. KEY NAVIGATION PATTERNS

### From Landing Page
```
/ → /login → /auth/callback → /dashboard
```

### Within Dashboard
```
/dashboard 
  ├── Click "Import" → stays on /dashboard
  ├── Click "Open explorer" on card → /repos/{id}
```

### Within Repo Context
```
/repos/{id} (overview)
├── Click card or sidebar → /repos/{id}/files
├── → /repos/{id}/graph
├── → /repos/{id}/search
├── → /repos/{id}/ai
└── → /repos/{id}/analytics
```

### Back to Dashboard
- Navbar has dashboard link

---

## 9. ENVIRONMENT & SETUP

### Providers (React Query + DevTools)
- Entry: [providers.tsx](frontend/src/app/providers.tsx)
- Wraps entire app with QueryClientProvider
- DevTools available in dev mode

### API Client
- [lib/api-client.ts](frontend/src/lib/api-client.ts)
- Axios instance with auth headers
- Auto token refresh on 401

### Theme
- Dark mode by default (`<html className="dark">`)
- Tailwind CSS + custom styling
- Color scheme: Gray-950 background, Blue/Green/Yellow accents

