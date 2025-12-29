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
- **Streaks & Achievements** - Gamification to keep you motivated
- **Dark Mode** - Full dark mode support with theme persistence
- **PWA Support** - Install as a mobile app with offline capabilities

### AI Integration (Gemini)
- **AI Goal Generation** - Personalized macro targets based on your age, sex, height, weight, activity level, and goal
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

```
atomic-nutrition-tracker/
├── src/
│   ├── components/
│   │   ├── common/           # Reusable UI components
│   │   ├── food/             # Food logging components
│   │   ├── programs/         # Program selection and display
│   │   ├── weight/           # Weight tracking components
│   │   └── achievements/     # Streaks and achievements
│   ├── contexts/
│   │   ├── AuthContext.tsx   # User authentication state
│   │   ├── NutritionContext.tsx  # Nutrition data state
│   │   └── ThemeContext.tsx  # Dark mode theme
│   ├── lib/
│   │   ├── api.ts            # API client functions
│   │   ├── units.ts          # Unit conversion utilities
│   │   ├── programTemplates.ts  # Program templates and calculations
│   │   └── achievements.ts   # Achievement definitions
│   ├── pages/
│   │   ├── Dashboard.tsx     # Main overview page
│   │   ├── LogFood.tsx       # Food logging interface
│   │   ├── Foods.tsx         # Food management
│   │   ├── Progress.tsx      # Weight and trend charts
│   │   └── Settings.tsx      # User preferences
│   └── types/
│       └── index.ts          # TypeScript type definitions
├── netlify/
│   └── functions/
│       ├── db.ts             # Database initialization
│       ├── foods.ts          # Food CRUD operations
│       ├── food-entries.ts   # Food entry logging
│       ├── weight-entries.ts # Weight tracking
│       ├── user-programs.ts  # Program management
│       ├── usda-search.ts    # USDA API integration
│       ├── generate-goals.ts # AI goal generation
│       └── users.ts          # User management
└── public/                   # Static assets
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
