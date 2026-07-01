import './loadEnv';
import { z } from 'zod';

/**
 * Validated, typed environment. The process refuses to boot with bad config —
 * fail fast at startup instead of at the first request in production.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),

  // Accepts both Postgres URLs (prod) and sqlite `file:` URLs (local dev).
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL: z.coerce.number().int().positive().default(60 * 60 * 24 * 14),
  PASSWORD_RESET_TTL: z.coerce.number().int().positive().default(3600),

  RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),

  // Cookie behavior. When the web app and API are on different sites
  // (e.g. app.example.com vs api.example.com), set COOKIE_SAMESITE=none so the
  // refresh cookie is sent cross-site (browsers also require Secure, which is
  // on automatically in production).
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().optional(),

  // Email (password reset). If SMTP_URL is unset, reset links are logged
  // instead of emailed (fine for local/dev). Any provider's SMTP works.
  SMTP_URL: z.string().optional(),
  EMAIL_FROM: z.string().default('Study Buddy <no-reply@studybuddy.app>'),
  // Public URL of the web app, used to build links inside emails.
  APP_WEB_URL: z.string().optional(),

  // All-in-one mode: when enabled, the API also serves the built web SPA from
  // the same origin (no CORS / cross-site cookie concerns). Used for single-host
  // / tunnel deployments. WEB_DIST_PATH overrides the default ../web/dist.
  SERVE_WEB: z.string().optional(),
  WEB_DIST_PATH: z.string().optional(),

  // ── AI study assistant (quiz/flashcard generation) ──────────────────────────
  // Provider is auto-detected: OpenAI-compatible if OPENAI_* is set, else
  // Anthropic if ANTHROPIC_API_KEY is set, else the feature is disabled.

  // OpenAI-compatible (OpenAI, Azure, Groq, OpenRouter, or a LOCAL/free model
  // via Ollama/LM Studio). For a local model set OPENAI_BASE_URL (no key needed)
  // e.g. http://localhost:11434/v1 and OPENAI_JSON_MODE=object.
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_JSON_MODE: z.enum(['schema', 'object']).default('schema'),

  // Anthropic (optional alternative). Set ANTHROPIC_MODEL to claude-sonnet-4-6
  // or claude-haiku-4-5 to trade capability for cost.
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-opus-4-8'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const serveWeb = env.SERVE_WEB === '1' || env.SERVE_WEB === 'true';
