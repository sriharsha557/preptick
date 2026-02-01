// Environment variable validation
// Validates required environment variables at startup and fails fast if missing

import { z } from 'zod';

const envSchema = z.object({
  // Required for production
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  // Supabase configuration
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL').optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // GROQ API for LLM features
  GROQ_API_KEY: z.string().optional(),

  // Server configuration
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Frontend URL for CORS
  FRONTEND_URL: z.string().url().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

let cachedEnv: EnvConfig | null = null;

/**
 * Validate environment variables at startup
 * Throws an error if required variables are missing
 */
export function validateEnv(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map(e => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    console.error('\n❌ Environment validation failed:\n');
    console.error(errors);
    console.error('\nPlease check your .env file or environment variables.\n');

    // In production, fail fast
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    // In development, warn but continue with defaults where possible
    console.warn('⚠️  Continuing with development defaults...\n');
  }

  cachedEnv = result.success ? result.data : (envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/mockprep',
    PORT: process.env.PORT || '3000',
    NODE_ENV: process.env.NODE_ENV || 'development',
  }) as EnvConfig);

  return cachedEnv;
}

/**
 * Get validated environment config
 * Call validateEnv() first during startup
 */
export function getEnv(): EnvConfig {
  if (!cachedEnv) {
    return validateEnv();
  }
  return cachedEnv;
}

/**
 * Check if a feature is available based on env config
 */
export function hasFeature(feature: 'llm' | 'supabase'): boolean {
  const env = getEnv();

  switch (feature) {
    case 'llm':
      return !!env.GROQ_API_KEY;
    case 'supabase':
      return !!env.SUPABASE_URL && !!env.SUPABASE_ANON_KEY;
    default:
      return false;
  }
}

/**
 * Log environment status (without sensitive values)
 */
export function logEnvStatus(): void {
  const env = getEnv();

  console.log('\n📋 Environment Configuration:');
  console.log(`  - NODE_ENV: ${env.NODE_ENV}`);
  console.log(`  - PORT: ${env.PORT}`);
  console.log(`  - Database: ${env.DATABASE_URL ? '✓ configured' : '✗ missing'}`);
  console.log(`  - Supabase: ${hasFeature('supabase') ? '✓ configured' : '✗ not configured'}`);
  console.log(`  - LLM (GROQ): ${hasFeature('llm') ? '✓ configured' : '✗ not configured'}`);
  console.log('');
}
