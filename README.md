# Atomic Nutrition Tracker

A modern, AI-powered nutrition tracking web application built with React, TypeScript, and Firebase. Track your macros, manage nutrition programs, and achieve your fitness goals with intelligent assistance.

## Features

### Core Functionality
- **Daily Nutrition Logging** - Track calories, protein, carbs, and fat for each meal
- **USDA Food Database** - Search 300,000+ foods with detailed nutrition information
- **Custom Foods** - Add and save your own foods with custom macros
- **Favorites & Quick Add** - Save frequently eaten foods for quick logging
- **Weight Tracking** - Log and visualize weight progress over time
- **Unit System Support** - Toggle between metric (kg, cm) and imperial (lbs, ft/in) units

### Smart Programs
Choose from 8 program templates to match your goals:
- **Aggressive Cut** ⚡ - 20% deficit for rapid fat loss
- **Moderate Cut** 📉 - 15% deficit for steady fat loss
- **Conservative Cut** 📊 - 10% deficit for slow fat loss
- **Maintenance** ⚖️ - Maintain current weight and composition
- **Lean Bulk** 💪 - 10% surplus for muscle gain
- **Bulk** 🏋️ - 15% surplus for faster muscle gain
- **Custom Program** ⚙️ - Set your own calorie and macro targets
- **AI Generated** ✨ - Let AI calculate personalized targets based on your stats

### Advanced Features
- **Trend Weight (EWMA)** - Exponentially weighted moving average for accurate weight trends
- **Program Progress Tracking** - Visual progress bars, days remaining, and weight change
- **Program Completion** - Automatic end-of-program summaries with achievements
- **Weekly Program Reviews** - AI analyzes compliance, weight progress, and recommends macro adjustments
- **Meal Completion Locking** - Mark meals as complete to prevent accidental editing
- **Auto-Calculate Macros** - When editing, changing gram amount automatically recalculates all macros
- **Streaks & Achievements** - Gamification to keep you motivated
- **Dark Mode** - Full dark mode support with theme persistence
- **PWA Support** - Install as a mobile app with offline capabilities

### AI Integration (Gemini 2.0 Flash)
- **AI Goal Generation** - Personalized macro targets based on your age, sex, height, weight, activity level, and goal
- **AI Meal Planner** ✨ - Get personalized meal suggestions based on remaining macros for the day
- **Macro-Aware Food Parsing** - AI suggests appropriate serving sizes to help you hit your targets
- **AI Food Entry** - Parse foods from text descriptions or photos (text: "2 scrambled eggs", photo: snap a pic)
- **Weekly Program Reviews** - AI analyzes your progress and suggests macro adjustments
- **Smart Recommendations** - Get intelligent nutrition advice tailored to your program

## Tech Stack

### Frontend
- **React 19** - Latest React with hooks and context
- **TypeScript** - Full type safety throughout the application
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Clerk** - Authentication and user management

### Backend
- **Netlify Functions** - Serverless API endpoints
- **Neon PostgreSQL** - Serverless Postgres database
- **Google Gemini API** - AI-powered goal generation

### APIs & Services
- **USDA FoodData Central** - Comprehensive food database
- **Clerk Authentication** - Secure user authentication with JWT
- **Netlify Deployment** - Continuous deployment and hosting

## Project Structure

> **📖 For detailed architecture and development patterns, see [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)**

```
atomic-nutrition-tracker/
├── src/
│   ├── components/
│   │   ├── common/           # LoadingSpinner, ErrorMessage, MealPlannerFAB
│   │   ├── food/             # FoodSearch, AIFoodInput, QuickAddForm, MealPlannerModal
│   │   ├── nutrition/        # DailyProgress, MealSection, FoodEntryCard
│   │   ├── programs/         # ProgramSelection, ProgramReviewModal, ActiveProgramCard
│   │   ├── weight/           # WeightLogSection, WeightChart
│   │   └── achievements/     # StreakCounter, AchievementBadges
│   ├── contexts/
│   │   ├── AuthContext.tsx   # User authentication with Clerk
│   │   ├── NutritionContext.tsx  # Nutrition data and goals state
│   │   └── ThemeContext.tsx  # Dark mode theme management
│   ├── lib/
│   │   ├── api.ts            # API client functions (all endpoints)
│   │   ├── units.ts          # kg/lbs, cm/ft conversion
│   │   ├── timeHelpers.ts    # Date utilities (timezone-safe)
│   │   ├── programTemplates.ts  # Cut/bulk/maintain templates
│   │   └── achievements.ts   # Achievement definitions
│   ├── pages/
│   │   ├── Dashboard.tsx     # Main overview page with program tracking
│   │   ├── LogFood.tsx       # Food logging with AI parsing
│   │   ├── Foods.tsx         # Food management and favorites
│   │   ├── Progress.tsx      # Weight charts and analytics
│   │   └── Settings.tsx      # User preferences and unit system
│   └── types/
│       └── index.ts          # TypeScript type definitions
├── netlify/
│   └── functions/
│       ├── lib/
│       │   ├── gemini.ts     # Google Gemini AI client
│       │   └── usda.ts       # USDA API integration
│       ├── auth.ts           # JWT verification with Clerk
│       ├── db.ts             # Database initialization and schema
│       ├── users.ts          # User profile management
│       ├── food-entries.ts   # Daily food logging CRUD
│       ├── suggest-meals.ts  # AI meal planner endpoint
│       ├── parse-food-text.ts # AI food parsing from text
│       ├── analyze-food-image.ts # AI food parsing from photos
│       ├── weight-entries.ts # Weight tracking
│       ├── user-programs.ts  # Program management
│       ├── program-reviews.ts # Weekly AI program reviews
│       ├── usda-search.ts    # USDA food database search
│       └── generate-goals.ts # AI goal generation
├── PROJECT_OVERVIEW.md       # 📖 Architecture guide for developers
├── README.md                 # This file
└── public/                   # Static assets and PWA manifest
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Netlify account
- Clerk account
- Neon database account
- Google Gemini API key
- USDA FoodData Central API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/atomic-nutrition-tracker.git
cd atomic-nutrition-tracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# USDA FoodData Central
VITE_USDA_API_KEY=your_usda_api_key

# Netlify Functions (for local development)
NEON_DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_test_...
GEMINI_API_KEY=your_gemini_api_key
```

4. **Set up Netlify environment variables**

In your Netlify dashboard, add these environment variables:
- `NEON_DATABASE_URL` - Your Neon PostgreSQL connection string
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `GEMINI_API_KEY` - Your Google Gemini API key

### Database Setup

The database schema is automatically initialized on first function call. Tables created:
- `users` - User profiles with unit preferences
- `nutrition_goals` - Daily calorie and macro targets
- `foods` - Custom foods and USDA food cache
- `food_entries` - Daily food logs
- `weight_entries` - Weight tracking data
- `user_programs` - Active and completed programs
- `user_favorites` - Favorite foods for quick add

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

Run linting:
```bash
npm run lint
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Deployment

### Netlify Deployment

1. **Connect your repository to Netlify**
   - Import your project from GitHub
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

2. **Add environment variables** (see Setup section above)

3. **Deploy**
```bash
git push origin main
```

Netlify will automatically build and deploy your app.

## Usage Guide

### Setting Up Your Profile
1. Sign up / Sign in with Clerk authentication
2. Go to Settings and choose your unit system (metric or imperial)
3. Toggle dark mode if preferred

### Starting a Program
1. Navigate to Dashboard
2. Click "Select Program" if no active program
3. Choose from 8 program templates:
   - Select a preset template (cut, maintain, bulk)
   - Set custom macros manually
   - Generate AI-powered personalized targets
4. Enter your current stats (weight, height, activity level)
5. Set program duration (weeks)
6. Add optional notes and target weight
7. Start your program

### Logging Food
1. Go to Log Food page
2. Select meal type (Breakfast, Lunch, Dinner, Snacks)
3. Choose a method:
   - **Search USDA Database** - Find foods from 300k+ options
   - **Quick Add** - Use a favorite food
   - **Manual Entry** - Enter macros directly
   - **AI Entry** (future) - Photo or text-based logging
4. Adjust serving size
5. Log the food

### Tracking Weight
1. Enter your weight on the Dashboard (Weight Log section)
2. View recent entries and weight change
3. See trend weight (EWMA) on Progress page
4. Track program weight progress on Dashboard

### Managing Foods
1. Go to Foods page
2. View all your logged foods
3. Add foods to favorites (⭐) for quick access
4. Edit or delete custom foods

## API Endpoints

### Netlify Functions

- `GET /users` - Get current user profile
- `PUT /users` - Update user profile (name, unit system)
- `GET /nutrition-goals` - Get daily nutrition targets
- `POST /nutrition-goals` - Create/update nutrition goals
- `POST /generate-goals` - AI-powered goal generation
- `GET /foods` - List user's foods
- `POST /foods` - Create custom food
- `GET /food-entries` - List food entries by date
- `POST /food-entries` - Log a food entry
- `DELETE /food-entries/:id` - Delete food entry
- `GET /weight-entries` - List weight entries
- `POST /weight-entries` - Log weight entry
- `GET /user-programs` - Get active and completed programs
- `POST /user-programs` - Create new program
- `PUT /user-programs/:id` - Update program
- `POST /usda-search` - Search USDA food database

## Unit Conversion

The app supports both metric and imperial units:

### Weight
- **Metric**: kg (0.1 kg increments)
- **Imperial**: lbs (0.5 lb increments)
- Conversion: 1 kg = 2.20462 lbs

### Height
- **Metric**: cm
- **Imperial**: ft/in

All weights are stored in kg in the database and converted for display based on user preference.

## Program Calculations

### BMR (Basal Metabolic Rate)
Uses Mifflin-St Jeor equation:
- **Male**: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
- **Female**: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161

### TDEE (Total Daily Energy Expenditure)
BMR × Activity Multiplier:
- Sedentary: 1.2
- Light: 1.375
- Moderate: 1.55
- Active: 1.725
- Very Active: 1.9

### Macro Calculation
- **Protein**: grams/kg bodyweight × 4 cal/g
- **Fat**: grams/kg bodyweight × 9 cal/g
- **Carbs**: Remaining calories ÷ 4 cal/g

## Future Plans

### High Priority
- **Recipe Builder** - Create and save recipes with multiple ingredients and automatic macro calculation
- **Meal Prep Planning** - Plan meals for multiple days ahead with grocery list generation
- **Barcode Scanner** - Scan product barcodes to instantly log foods
- **Restaurant Integration** - Database of restaurant menu items with nutrition info
- **Export/Import Data** - CSV export for analytics, import from other apps (MyFitnessPal, etc.)

### AI Enhancements
- **Smart Macro Distribution** - AI suggests optimal macro timing throughout the day
- **Photo-Based Portion Estimation** - AI estimates serving sizes from photos (e.g., "that's about 6oz")
- **Meal Prep Suggestions** - AI recommends batch cooking recipes based on goals and preferences
- **Nutrition Insights** - Weekly AI-generated insights about eating patterns and trends
- **Voice Input** - "Hey, I just ate a chicken breast and rice" → auto-logged

### Social & Community
- **Share Meals** - Share your meals with friends or community
- **Recipe Sharing** - Browse and save community recipes
- **Challenge Tracking** - Join or create nutrition challenges
- **Coach Integration** - Allow coaches to view client progress and make recommendations

### Analytics & Visualization
- **Advanced Charts** - Macro ratio trends, micronutrient tracking, meal timing analysis
- **Weekly/Monthly Reports** - Comprehensive summaries with insights and achievements
- **Correlation Analysis** - See how food choices correlate with weight, energy, workouts
- **Predictive Modeling** - Predict weight trajectory based on current adherence

### Mobile Improvements
- **Native Mobile App** - iOS and Android apps with offline-first sync
- **Widgets** - Home screen widgets for quick food logging and macro tracking
- **Notifications** - Reminders to log meals, weekly review alerts, achievement notifications
- **Apple Health / Google Fit Integration** - Sync weight, activity, and nutrition data

### Quality of Life
- **Quick Add Templates** - Save common meals as templates (e.g., "Typical Breakfast")
- **Copy Previous Day** - Duplicate yesterday's meals with one tap
- **Meal History Search** - Search all previously logged meals by name or date
- **Smart Defaults** - Learn from patterns (e.g., "You usually eat eggs for breakfast")
- **Undo/Redo** - Undo recent food deletions or edits

### Program & Goal Enhancements
- **Multi-Phase Programs** - Create programs with different phases (e.g., 4 weeks cut, 1 week maintain, repeat)
- **Goal Templates** - Pre-built goal templates for common scenarios (wedding prep, competition prep, etc.)
- **Macro Cycling** - Different macros for training vs. rest days
- **Refeed Days** - Scheduled higher-carb days during cuts
- **Diet Breaks** - Planned maintenance periods during long programs

### Integrations
- **Fitness Trackers** - Strava, Garmin, Whoop, Oura Ring for activity-adjusted calories
- **Food Delivery** - Integration with meal delivery services
- **Grocery Services** - One-click ordering from Instacart, Amazon Fresh based on meal plan
- **Calendar Sync** - Block out meal prep time, sync review notifications

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes with descriptive messages
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Acknowledgments

- Inspired by [MacroFactor](https://macrofactorapp.com/) nutrition tracking methodology
- USDA FoodData Central for comprehensive food database
- Google Gemini for AI-powered features
- Clerk for seamless authentication

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

Built with by Ryan Burnham
