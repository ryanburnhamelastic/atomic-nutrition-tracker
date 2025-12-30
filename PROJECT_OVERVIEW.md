# Atomic Nutrition Tracker - Project Overview

**Last Updated:** December 29, 2024

This document provides a high-level overview of the Atomic Nutrition Tracker project for AI agents and developers who need to quickly understand the architecture, current state, and development patterns without extensive code review.

## Quick Summary

A modern, AI-powered nutrition tracking web application built with React 19, TypeScript, Vite, and Tailwind CSS on the frontend, with Netlify serverless functions and Neon PostgreSQL on the backend. Features include macro tracking, AI-powered meal suggestions, program management with weekly reviews, and comprehensive analytics.

## Architecture at a Glance

### Frontend Stack
- **React 19** with TypeScript and functional components
- **Vite** for build tooling and development server
- **Tailwind CSS** for styling (utility-first, dark mode support)
- **Clerk** for authentication (JWT-based)
- **React Router** for navigation
- **Context API** for state management (AuthContext, NutritionContext, ThemeContext)

### Backend Stack
- **Netlify Functions** - Serverless API endpoints (Node.js)
- **Neon PostgreSQL** - Serverless database with auto-scaling
- **@neondatabase/serverless** - Database client library
- **Google Gemini 2.0 Flash** - AI for meal parsing, suggestions, and program reviews
- **USDA FoodData Central API** - 300k+ food database

### Key External Services
- **Clerk Authentication** - User management and JWT tokens
- **Netlify** - Hosting, deployment, and serverless functions
- **Neon Database** - Serverless PostgreSQL
- **Google Gemini API** - AI features
- **USDA FoodData Central** - Food nutrition database

## Database Schema

All tables use UUID primary keys and include `created_at` and `updated_at` timestamps.

### Core Tables
- **users** - User profiles (linked to Clerk via `clerk_user_id`)
  - `unit_system` (metric/imperial)
  - Links to all user data via foreign keys

- **user_goals** - Nutrition targets
  - Daily calorie and macro targets
  - One per user (UNIQUE constraint)

- **foods** - System-wide food database
  - USDA foods and verified items
  - Searchable via GIN index on name

- **custom_foods** - User-created foods
  - User-specific nutritional entries
  - Allows custom branding and serving sizes

- **food_entries** - Daily food logs
  - References either `foods` or `custom_foods`
  - Stores denormalized nutrition data (calories, macros)
  - `completed` boolean for meal locking
  - Indexed by `user_id` and `date`

- **weight_entries** - Weight tracking
  - Daily weight logs
  - `trend_weight` for EWMA calculation
  - Unique constraint on (user_id, date)

- **favorite_foods** - Quick add favorites
  - Links users to frequently eaten foods

- **user_stats** - Gamification
  - Streaks, achievements, total days logged
  - Updated by background job

- **user_programs** - Macro programs (cuts/bulks)
  - Time-bound nutrition programs
  - Status: active, completed, cancelled
  - Tracks starting/ending weight and macro targets
  - `macros_locked` prevents AI adjustments

- **program_reviews** - AI weekly reviews
  - Generated weekly during active programs
  - Analyzes compliance, weight progress, macro adherence
  - Recommends macro adjustments
  - Status: pending, accepted, rejected, expired

- **program_macro_history** - Audit trail
  - Tracks all macro changes within a program
  - Links to reviews for AI-driven changes

## Key Features & Components

### 1. Food Logging System
**Location:** `src/pages/LogFood.tsx`, `src/components/food/`

**How it works:**
- Multiple input methods: USDA search, custom foods, quick add, AI parsing
- Supports both "servings" and "grams" input modes
- Denormalized storage: nutrition data copied to `food_entries` at log time
- Edit functionality with auto-calculation of macros when gram amount changes

**Key Components:**
- `FoodSearch.tsx` - USDA database search with autocomplete
- `AIFoodInput.tsx` - Photo and text-based food parsing via Gemini
- `QuickAddForm.tsx` - Manual food entry with serving calculations
- `FoodEntryCard.tsx` - Display and manage logged foods with completion checkbox

### 2. AI Meal Planner
**Location:** `src/components/food/MealPlannerModal.tsx`, `netlify/functions/suggest-meals.ts`

**How it works:**
- Accessible via floating action button (FAB) on Dashboard
- Analyzes remaining macros for the day
- Queries recent food history (past 7 days)
- Uses Gemini AI to suggest specific meals + general guidance
- Considers time of day (only suggests remaining meals)

**Unique Features:**
- Planned foods input (text-based, comma/newline separated)
- Specific meal suggestions with macros and reasoning
- General nutrition guidance (priorities, avoidances, tips)
- Confidence level indicator

### 3. Macro-Aware AI Parsing
**Location:** `netlify/functions/parse-food-text.ts`, `netlify/functions/lib/gemini.ts`

**How it works:**
- When user enters food text (e.g., "chicken breast"), frontend calculates remaining macros
- Passes remaining calories, protein, carbs, fat to backend
- AI suggests appropriate serving sizes to help hit macro targets
- Example: If user needs 500 cal and 50g protein, suggests larger portion

**Implementation:**
- Frontend: `AIFoodInput.tsx` uses `useNutrition()` context for goals and daily summary
- Backend: Enhanced Gemini prompt includes macro context
- API: Optional `macroContext` parameter in `parseText()`

### 4. Program Management & Reviews
**Location:** `src/components/programs/`, `netlify/functions/program-reviews.ts`

**How it works:**
- Users create time-bound programs (e.g., 12-week cut)
- AI generates weekly reviews analyzing:
  - Weight progress vs. target
  - Average calorie/macro adherence
  - Compliance rate (days hitting targets)
- Recommends macro adjustments based on progress
- Users can accept (updates program macros) or reject (keeps current)

**Review Logic:**
- Triggered weekly or manually
- Analyzes past 7 days of data
- Calculates TDEE based on weight change
- Suggests adjustments if weight not tracking to target
- Respects `macros_locked` flag (user can disable AI adjustments)

### 5. Meal Completion System
**Location:** `src/components/nutrition/FoodEntryCard.tsx`

**How it works:**
- Users can mark food entries as "completed" (locked)
- Completed entries:
  - Cannot be edited or deleted
  - Display with strikethrough and reduced opacity
  - Show green checkmark indicator
- Backend: PATCH endpoint toggles `completed` boolean

**Use Case:** Lock in meals that are already eaten to prevent accidental modifications

### 6. Weight Tracking & Trend Weight
**Location:** `src/pages/Progress.tsx`, `src/components/weight/`

**How it works:**
- Daily weight entries stored with EWMA trend calculation
- Trend weight formula: `new_trend = (new_weight × 0.1) + (old_trend × 0.9)`
- Smooths out daily fluctuations for accurate progress tracking
- Charts show both actual weight and trend line

## State Management Patterns

### AuthContext (`src/contexts/AuthContext.tsx`)
- Wraps Clerk authentication
- Provides `user`, `isLoaded`, `getToken()`
- Sets auth token getter in API client on mount

### NutritionContext (`src/contexts/NutritionContext.tsx`)
- Manages selected date (for multi-day navigation)
- Fetches and caches daily summary for selected date
- Provides goals (from active program or user_goals)
- Provides `refreshSummary()` for invalidation

### ThemeContext (`src/contexts/ThemeContext.tsx`)
- Dark mode toggle with localStorage persistence
- Applies/removes `dark` class on document root

## API Client Pattern

**Location:** `src/lib/api.ts`

All API calls follow this pattern:
```typescript
const response = await apiRequest<ReturnType>('/endpoint', options);
if (response.error) {
  // Handle error
} else {
  // Use response.data
}
```

**Key Features:**
- Generic `apiRequest<T>()` wrapper handles auth, headers, errors
- Auth token automatically added via `getAuthToken()` function
- Separate `apiUpload()` for FormData (file uploads)
- Organized by domain: `usersApi`, `foodEntriesApi`, `goalsApi`, etc.

## Netlify Functions Pattern

**Location:** `netlify/functions/`

All functions follow this structure:
```typescript
import { Handler, HandlerEvent } from '@netlify/functions';
import { initDb, getDb, corsHeaders } from './db';
import { authenticateRequest, unauthorizedResponse } from './auth';

const handler: Handler = async (event: HandlerEvent) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    await initDb(); // Ensures tables exist
    const sql = getDb(); // Neon client
    const authResult = await authenticateRequest(event); // Verify JWT

    if (!authResult.authenticated) {
      return unauthorizedResponse(corsHeaders, authResult.error);
    }

    const { clerkUserId } = authResult;
    // Get user from database...
    // Handle HTTP methods (GET, POST, PUT, DELETE)...
  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

export { handler };
```

**Authentication Flow:**
1. Client calls `getToken()` from Clerk
2. Token added to Authorization header: `Bearer ${token}`
3. Backend verifies token with Clerk API
4. Extracts user info, looks up `user_id` from `clerk_user_id`
5. Uses `user_id` for all database queries

## Environment Variables

### Client-side (VITE_ prefix)
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk authentication
- `VITE_USDA_API_KEY` - USDA food search

### Server-side (Netlify Functions)
- `NETLIFY_DATABASE_URL` or `DATABASE_URL` - Neon PostgreSQL
- `CLERK_SECRET_KEY` - Clerk JWT verification
- `GEMINI_API_KEY` - Google Gemini AI

## Common Development Patterns

### Adding a New Feature
1. **Types First** - Add TypeScript interfaces to `src/types/index.ts`
2. **Database** - Add table/column in `netlify/functions/db.ts` `initDb()`
3. **Backend** - Create/update Netlify function in `netlify/functions/`
4. **API Client** - Add method to appropriate API object in `src/lib/api.ts`
5. **Component** - Create React component in `src/components/` or page in `src/pages/`
6. **Integration** - Wire up to existing pages via props/context

### Working with Database
```typescript
// Always use template literals for SQL
const result = await sql`
  SELECT * FROM users WHERE id = ${userId}
`;

// For inserts with RETURNING
const [newEntry] = await sql`
  INSERT INTO food_entries (user_id, date, ...)
  VALUES (${userId}, ${date}, ...)
  RETURNING *
`;
```

### Error Handling
- Backend: Return `{ error: 'Message' }` with appropriate status code
- Frontend: Check `response.error` before accessing `response.data`
- Always log errors to console for debugging

## Testing & Deployment

### Local Development
```bash
npm run dev          # Start Vite dev server on :5173
npm run build        # TypeScript + Vite build
npm run lint         # ESLint
```

### Deployment
- **Platform:** Netlify
- **Trigger:** Push to `main` branch
- **Build:** `npm run build`
- **Output:** `dist/` directory
- **Functions:** `netlify/functions/` auto-deployed

### Common Issues & Fixes
1. **"Token not found"** - Check `setAuthTokenGetter()` is called in AuthContext
2. **"User not found"** - User row not created, check `/users` endpoint
3. **CORS errors** - Verify `corsHeaders` in all function responses
4. **Dark mode not persisting** - Check localStorage and ThemeContext initialization
5. **Timezone issues** - Use `getTodayDate()` from `timeHelpers.ts`, not `toISOString()`

## Recent Major Changes (December 2024)

1. **AI Meal Planner** - Floating modal with personalized meal suggestions based on remaining macros
2. **Macro-Aware AI Parsing** - AI considers remaining macros when suggesting serving sizes
3. **Meal Completion System** - Lock meals to prevent editing once eaten
4. **Auto-Calculate Macros on Edit** - Changing gram amount recalculates all macros proportionally
5. **Program Reviews** - Weekly AI analysis with macro adjustment recommendations
6. **Improved Checkbox Visibility** - Better dark mode styling for completion checkboxes

## File Structure Quick Reference

```
src/
├── components/
│   ├── common/              # LoadingSpinner, ErrorMessage, MealPlannerFAB
│   ├── food/                # FoodSearch, AIFoodInput, QuickAddForm, MealPlannerModal
│   ├── nutrition/           # DailyProgress, MealSection, FoodEntryCard
│   ├── programs/            # ProgramSelection, ActiveProgramCard, ProgramReviewModal
│   ├── weight/              # WeightLogSection, WeightChart
│   └── achievements/        # StreakCounter, AchievementBadges
├── contexts/                # AuthContext, NutritionContext, ThemeContext
├── lib/
│   ├── api.ts              # API client (all endpoints)
│   ├── units.ts            # kg/lbs conversion
│   ├── programTemplates.ts # Cut/bulk/maintain templates
│   └── timeHelpers.ts      # Date utilities (getTodayDate, etc.)
├── pages/                  # Dashboard, LogFood, Progress, Settings, Foods
└── types/
    └── index.ts           # All TypeScript interfaces

netlify/functions/
├── lib/
│   ├── gemini.ts          # Gemini AI client (analyzeImage, parseText)
│   └── usda.ts            # USDA API client
├── auth.ts                # JWT verification
├── db.ts                  # Database init and connection
├── users.ts               # User CRUD
├── food-entries.ts        # Food logging
├── suggest-meals.ts       # AI meal planner
├── program-reviews.ts     # Weekly program analysis
└── [other endpoints]
```

## Next Steps for New Developers

1. Read this document thoroughly
2. Check `README.md` for setup instructions
3. Review `src/types/index.ts` to understand data models
4. Explore `src/lib/api.ts` to see all available endpoints
5. Look at `Dashboard.tsx` to see how components are wired together
6. Check `netlify/functions/food-entries.ts` for backend patterns

## When to Update This Document

- After adding major features
- When changing architecture or patterns
- After significant refactoring
- When adding new external services
- When changing database schema significantly

---

**Maintained by:** Ryan Burnham
**Repository:** https://github.com/ryanburnhamelastic/atomic-nutrition-tracker
