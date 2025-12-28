# Gemini AI Integration Plan

## Overview
Integrate Google's Gemini AI to enhance the nutrition tracking experience with intelligent food recognition, natural language processing, and personalized insights.

## Proposed Features

### 1. Photo Food Recognition (Priority: High)
**Description**: Users can take or upload a photo of their meal, and Gemini will identify foods and estimate nutrition.

**Implementation**:
- Add camera/upload button to LogFood page
- Create `netlify/functions/analyze-food-image.ts` endpoint
- Use Gemini Vision API to analyze image
- Return structured food data (name, estimated portions, nutrition)
- Allow user to confirm/adjust before logging

**UI Flow**:
1. User taps camera icon on LogFood page
2. Takes photo or selects from gallery
3. Loading state while analyzing
4. Shows identified foods with estimated nutrition
5. User can edit quantities and confirm
6. Foods are logged to journal

### 2. Natural Language Food Logging (Priority: High)
**Description**: Users can type "I had 2 eggs and toast with butter" and the AI parses and logs multiple foods.

**Implementation**:
- Add voice/text input field to LogFood page
- Create `netlify/functions/parse-food-text.ts` endpoint
- Use Gemini to extract foods, quantities, and nutrition estimates
- Return array of parsed food entries
- Allow user to review and confirm

**Example Inputs**:
- "2 eggs and coffee with cream"
- "Chicken salad with ranch dressing"
- "A medium pepperoni pizza, 3 slices"

### 3. Recipe Nutrition Calculator (Priority: Medium)
**Description**: Paste a recipe and get a complete nutrition breakdown per serving.

**Implementation**:
- New page: `/recipe-calculator`
- Text area for pasting recipe
- Gemini parses ingredients and quantities
- Calculates total and per-serving nutrition
- Option to save as custom food

### 4. Smart Nutrition Insights (Priority: Medium)
**Description**: Weekly AI-powered analysis of eating patterns with actionable suggestions.

**Implementation**:
- Add insights section to Reports page
- Create `netlify/functions/generate-insights.ts`
- Analyze last 7 days of food entries
- Generate personalized recommendations
- Focus on goal progress and macro balance

**Example Insights**:
- "You're averaging 40g below your protein goal. Try adding Greek yogurt for breakfast."
- "Your fiber intake has been low this week. Consider adding more vegetables."

## Technical Requirements

### API Setup
1. Add `GEMINI_API_KEY` to environment variables
2. Install `@google/generative-ai` package
3. Create shared Gemini client utility

### Netlify Function Structure
```typescript
// netlify/functions/lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
export const visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
```

### Prompt Engineering
Each feature needs carefully crafted prompts that:
- Return structured JSON responses
- Include nutrition database knowledge
- Handle ambiguity gracefully
- Provide reasonable estimates

**Example Prompt for Image Analysis**:
```
Analyze this food image and identify all visible foods.
For each food item, provide:
- name: Common food name
- portion: Estimated portion size (e.g., "1 cup", "4 oz")
- calories: Estimated calories
- protein: Grams of protein
- carbs: Grams of carbohydrates
- fat: Grams of fat

Return as JSON array. Be conservative with estimates.
```

## Implementation Phases

### Phase A: Core AI Features
1. Set up Gemini API client
2. Implement image food recognition
3. Add camera/upload UI to LogFood
4. Implement natural language parsing
5. Add text input UI to LogFood

### Phase B: Enhanced Features
1. Recipe calculator page
2. Weekly insights generation
3. Insights UI on Reports page

### Phase C: Polish
1. Improve prompts based on user feedback
2. Add confidence scores to estimates
3. Cache common food lookups
4. Rate limiting and error handling

## Cost Considerations
- Gemini 1.5 Flash is cost-effective for this use case
- Image analysis: ~$0.00025 per image
- Text parsing: ~$0.00001 per request
- Implement rate limiting (e.g., 10 AI analyses per day per user)

## Privacy & Security
- Images are processed and not stored
- No personally identifiable information sent to API
- Clear user consent for AI features
- Option to disable AI features in settings
