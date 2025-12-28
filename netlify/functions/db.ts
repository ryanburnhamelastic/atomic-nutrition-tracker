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

  // User nutrition goals
  await sql`
    CREATE TABLE IF NOT EXISTS user_goals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      calorie_target INTEGER NOT NULL DEFAULT 2000,
      protein_target INTEGER NOT NULL DEFAULT 150,
      carbs_target INTEGER NOT NULL DEFAULT 250,
      fat_target INTEGER NOT NULL DEFAULT 65,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Base food database (system-wide, read-only for users)
  await sql`
    CREATE TABLE IF NOT EXISTS foods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      brand TEXT,
      serving_size DECIMAL(10,2) NOT NULL,
      serving_unit TEXT NOT NULL,
      calories DECIMAL(10,2) NOT NULL,
      protein DECIMAL(10,2) NOT NULL DEFAULT 0,
      carbs DECIMAL(10,2) NOT NULL DEFAULT 0,
      fat DECIMAL(10,2) NOT NULL DEFAULT 0,
      is_verified BOOLEAN DEFAULT false,
      source TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_foods_name_search ON foods USING gin(to_tsvector('english', name))
  `;

  // User custom foods
  await sql`
    CREATE TABLE IF NOT EXISTS custom_foods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      brand TEXT,
      serving_size DECIMAL(10,2) NOT NULL,
      serving_unit TEXT NOT NULL,
      calories DECIMAL(10,2) NOT NULL,
      protein DECIMAL(10,2) NOT NULL DEFAULT 0,
      carbs DECIMAL(10,2) NOT NULL DEFAULT 0,
      fat DECIMAL(10,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_custom_foods_user ON custom_foods(user_id)
  `;

  // Food entries (logged items)
  await sql`
    CREATE TABLE IF NOT EXISTS food_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      food_id UUID,
      custom_food_id UUID REFERENCES custom_foods(id),
      date DATE NOT NULL,
      meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
      servings DECIMAL(10,2) NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      serving_size DECIMAL(10,2) NOT NULL,
      serving_unit TEXT NOT NULL,
      calories DECIMAL(10,2) NOT NULL,
      protein DECIMAL(10,2) NOT NULL,
      carbs DECIMAL(10,2) NOT NULL,
      fat DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, date)
  `;
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
