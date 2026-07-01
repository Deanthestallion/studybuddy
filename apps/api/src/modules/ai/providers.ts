import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { AppError } from '../../utils/AppError';

export type AiProvider = 'openai' | 'anthropic';

/** Which provider is configured (OpenAI-compatible wins; null = disabled). */
export function activeProvider(): AiProvider | null {
  if (env.OPENAI_API_KEY || env.OPENAI_BASE_URL) return 'openai';
  if (env.ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

export const aiEnabled = () => activeProvider() !== null;

let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;

/** OpenAI-compatible client for tool-calling (the planner agent). */
export function getOpenAIClient(): OpenAI {
  if (activeProvider() !== 'openai') {
    throw new AppError(
      503,
      'AI_UNAVAILABLE',
      'The AI planner requires an OpenAI-compatible provider. Set OPENAI_API_KEY.',
    );
  }
  openai ??= new OpenAI({ apiKey: env.OPENAI_API_KEY || 'not-needed', baseURL: env.OPENAI_BASE_URL });
  return openai;
}

export const openaiModel = () => env.OPENAI_MODEL;

function mapError(err: unknown): AppError {
  if (err instanceof OpenAI.AuthenticationError || err instanceof Anthropic.AuthenticationError) {
    return new AppError(503, 'AI_UNAVAILABLE', 'AI is misconfigured (invalid API key).');
  }
  if (err instanceof OpenAI.RateLimitError || err instanceof Anthropic.RateLimitError) {
    return AppError.tooMany('AI is busy right now — please retry in a moment.');
  }
  logger.error({ err }, 'AI generation request failed');
  return new AppError(502, 'AI_ERROR', 'AI generation failed. Please try again.');
}

interface GenArgs {
  system: string;
  content: string;
  jsonSchema: Record<string, unknown>;
  schemaName: string;
}

/**
 * Provider-agnostic structured generation: returns the raw JSON string the
 * model produced. Callers validate it with their zod schema.
 */
export async function generateJson(args: GenArgs): Promise<string> {
  const provider = activeProvider();
  if (!provider) {
    throw new AppError(
      503,
      'AI_UNAVAILABLE',
      'AI is not configured. Set OPENAI_API_KEY (or ANTHROPIC_API_KEY).',
    );
  }

  if (provider === 'openai') {
    openai ??= new OpenAI({
      apiKey: env.OPENAI_API_KEY || 'not-needed', // keyless local endpoints (Ollama) ignore this
      baseURL: env.OPENAI_BASE_URL,
    });
    // `schema` mode = OpenAI Structured Outputs (strongest). `object` mode =
    // plain JSON mode for compat/local endpoints that lack json_schema support.
    const response_format =
      env.OPENAI_JSON_MODE === 'object'
        ? ({ type: 'json_object' } as const)
        : ({
            type: 'json_schema',
            json_schema: { name: args.schemaName, schema: args.jsonSchema, strict: true },
          } as const);
    try {
      const res = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        response_format,
        messages: [
          { role: 'system', content: args.system },
          { role: 'user', content: args.content },
        ],
      });
      const text = res.choices[0]?.message?.content?.trim();
      if (!text) throw new AppError(502, 'AI_PARSE_FAILED', 'The model returned no content. Retry.');
      return text;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw mapError(err);
    }
  }

  // Anthropic
  anthropic ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY! });
  try {
    const res = await anthropic.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 8000,
      system: args.system,
      messages: [{ role: 'user', content: args.content }],
      output_config: { format: { type: 'json_schema', schema: args.jsonSchema } },
    });
    return res.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();
  } catch (err) {
    throw mapError(err);
  }
}
