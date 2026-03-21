import { z } from 'zod';

// ── Common Schemas ─────────────────────────────────────────────────────────
export const UuidSchema = z.string().uuid();

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ── Auth Schemas ───────────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, underscores, and hyphens')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  displayName: z.string().min(1).max(100).trim().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ── Repository Schemas ─────────────────────────────────────────────────────
export const ImportRepoSchema = z.object({
  url: z
    .string()
    .url('Invalid URL')
    .regex(
      /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git)?(\/?|\/tree\/.+)?$/,
      'Must be a valid GitHub repository URL'
    ),
  branch: z.string().optional(),
  githubToken: z.string().optional(),
});

// ── AI Schemas ─────────────────────────────────────────────────────────────
export const AskQuestionSchema = z.object({
  question: z
    .string()
    .min(3, 'Question must be at least 3 characters')
    .max(2000, 'Question is too long')
    .trim(),
  sessionId: z.string().uuid().optional(),
  context: z.array(z.string()).max(10).optional(),
});

// ── Search Schemas ─────────────────────────────────────────────────────────
export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500).trim(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  threshold: z.coerce.number().min(0).max(1).default(0.7),
  language: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ImportRepoInput = z.infer<typeof ImportRepoSchema>;
export type AskQuestionInput = z.infer<typeof AskQuestionSchema>;
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
