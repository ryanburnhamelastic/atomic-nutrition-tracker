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
      unit_system TEXT NOT NULL DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id)
  `;

  // Add unit_system column if it doesn't exist (migration for existing users)
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS unit_system TEXT NOT NULL DEFAULT 'metric'
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
      use_metric BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Add use_metric column if it doesn't exist (migration for existing users)
  await sql`
    ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS use_metric BOOLEAN NOT NULL DEFAULT true
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

  // Unique constraint for upsert operations (only for base foods without brand)
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_name_unique ON foods(name) WHERE brand IS NULL
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

  // Add completed column to food_entries if it doesn't exist
  await sql`
    ALTER TABLE food_entries
    ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, date)
  `;

  // Add index for recent foods queries (meal-type filtered)
  await sql`
    CREATE INDEX IF NOT EXISTS idx_food_entries_user_meal_date ON food_entries(user_id, meal_type, date DESC)
  `;

  // Weight entries (daily weight log)
  await sql`
    CREATE TABLE IF NOT EXISTS weight_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      weight_kg DECIMAL(5,2) NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, date)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date ON weight_entries(user_id, date DESC)
  `;

  // Add trend_weight column if it doesn't exist (migration for existing users)
  await sql`
    ALTER TABLE weight_entries ADD COLUMN IF NOT EXISTS trend_weight DECIMAL(5,2)
  `;

  // Favorite foods (user's favorited base foods for quick add)
  await sql`
    CREATE TABLE IF NOT EXISTS favorite_foods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, food_id)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_favorite_foods_user ON favorite_foods(user_id)
  `;

  // User stats (streaks, achievements, tracking stats)
  await sql`
    CREATE TABLE IF NOT EXISTS user_stats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      total_days_logged INTEGER DEFAULT 0,
      last_logged_date DATE,
      achievements JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_stats(user_id)
  `;

  // User programs (time-bound macro programs like cuts/bulks)
  await sql`
    CREATE TABLE IF NOT EXISTS user_programs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      program_id TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      duration_weeks INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
      starting_weight_kg DECIMAL(5,2),
      target_weight_kg DECIMAL(5,2),
      ending_weight_kg DECIMAL(5,2),
      calorie_target INTEGER NOT NULL,
      protein_target INTEGER NOT NULL,
      carbs_target INTEGER NOT NULL,
      fat_target INTEGER NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_user_programs_user_status ON user_programs(user_id, status)
  `;

  // Add review tracking columns to user_programs (migration for existing programs)
  await sql`
    ALTER TABLE user_programs
      ADD COLUMN IF NOT EXISTS last_review_date DATE,
      ADD COLUMN IF NOT EXISTS next_review_date DATE,
      ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS macros_locked BOOLEAN DEFAULT false
  `;

  // Program reviews table - stores AI weekly reviews
  await sql`
    CREATE TABLE IF NOT EXISTS program_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      program_id UUID REFERENCES user_programs(id) ON DELETE CASCADE,
      review_week INTEGER NOT NULL,
      review_date DATE NOT NULL,

      -- Analysis inputs (snapshot of data at review time)
      days_analyzed INTEGER NOT NULL,
      avg_calories INTEGER NOT NULL,
      avg_protein INTEGER NOT NULL,
      avg_carbs INTEGER NOT NULL,
      avg_fat INTEGER NOT NULL,
      compliance_rate INTEGER NOT NULL,

      -- Weight data
      starting_weight_kg DECIMAL(5,2),
      current_weight_kg DECIMAL(5,2),
      trend_weight_kg DECIMAL(5,2),
      weight_change_kg DECIMAL(5,2),

      -- AI recommendations
      ai_analysis TEXT NOT NULL,
      recommended_calories INTEGER,
      recommended_protein INTEGER,
      recommended_carbs INTEGER,
      recommended_fat INTEGER,
      confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),

      -- User action
      status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')) DEFAULT 'pending',
      user_response_date TIMESTAMPTZ,
      user_notes TEXT,

      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),

      UNIQUE(program_id, review_week)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_program_reviews_user_status ON program_reviews(user_id, status)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_program_reviews_program ON program_reviews(program_id, review_date DESC)
  `;

  // Program macro history table - audit trail of all macro changes
  await sql`
    CREATE TABLE IF NOT EXISTS program_macro_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      program_id UUID REFERENCES user_programs(id) ON DELETE CASCADE,
      review_id UUID REFERENCES program_reviews(id) ON DELETE SET NULL,

      calorie_target INTEGER NOT NULL,
      protein_target INTEGER NOT NULL,
      carbs_target INTEGER NOT NULL,
      fat_target INTEGER NOT NULL,

      effective_date DATE NOT NULL,
      change_reason TEXT NOT NULL,

      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_program_macro_history_program ON program_macro_history(program_id, effective_date DESC)
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
