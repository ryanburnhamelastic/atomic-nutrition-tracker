import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let sql: NeonQueryFunction<false, false>;

export function getDb(): NeonQueryFunction<false, false> {
  if (!sql) {
    const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('Database URL not configured');
    }
    sql = neon(databaseUrl);
  }
  return sql;
}

/**
 * Initialize database tables
 * Call this at the start of each function to ensure tables exist
 * Uses IF NOT EXISTS so it's safe to call multiple times
 */
export async function initDb(): Promise<void> {
  const sql = getDb();

  // Users table - synced with Clerk
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clerk_user_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id)
  `;

  // TODO: Add your application-specific tables here
  // Example:
  // await sql`
  //   CREATE TABLE IF NOT EXISTS items (
  //     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  //     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  //     name TEXT NOT NULL,
  //     description TEXT,
  //     created_at TIMESTAMPTZ DEFAULT NOW(),
  //     updated_at TIMESTAMPTZ DEFAULT NOW()
  //   )
  // `;
}

/**
 * CORS headers for API responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};
