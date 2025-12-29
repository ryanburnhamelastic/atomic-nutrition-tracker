/**
 * Gemini AI Client for Food Analysis
 * Uses Google's Gemini 1.5 Flash for image and text processing
 */

import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use Gemini 2.5 Flash for both text and vision (latest, cost-effective)
export const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

// Response interface for parsed food data
export interface GeminiFood {
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface GeminiResponse {
  foods: GeminiFood[];
}

// Prompt for analyzing food images
const IMAGE_ANALYSIS_PROMPT = `Analyze this food image and identify all visible food items.
For each food, estimate nutrition based on common USDA values:

Return ONLY valid JSON in this exact format:
{
  "foods": [
    {
      "name": "Food name",
      "servingSize": 100,
      "servingUnit": "g",
      "calories": 200,
      "protein": 10,
      "carbs": 25,
      "fat": 8
    }
  ]
}

Guidelines:
- Use common food names (e.g., "Scrambled Eggs" not "eggs, scrambled with butter")
- Estimate reasonable portion sizes based on what's visible
- Use standard units: g, oz, cup, piece, slice, tbsp
- Round nutrition values to whole numbers
- Be conservative with estimates
- If multiple items are visible, list each separately`;

// Prompt for parsing natural language food descriptions
const TEXT_PARSING_PROMPT = `Parse this food description and extract individual food items with nutrition estimates.

Input: "{text}"

Return ONLY valid JSON in this exact format:
{
  "foods": [
    {
      "name": "Food name",
      "servingSize": 100,
      "servingUnit": "g",
      "calories": 200,
      "protein": 10,
      "carbs": 25,
      "fat": 8
    }
  ]
}

Guidelines:
- Extract each food item mentioned
- Use quantities mentioned (e.g., "2 eggs" = servingSize: 2, servingUnit: "piece")
- If no quantity specified, use a single serving
- Use common USDA nutrition values
- Round nutrition values to whole numbers
- Common examples:
  - "2 scrambled eggs" -> 2 eggs with typical scrambled egg nutrition
  - "coffee with cream" -> coffee and cream as separate items or combined
  - "chicken breast" -> assume 4oz/113g typical portion`;

/**
 * Analyze a food image and return identified foods with nutrition
 */
export async function analyzeImage(imageBase64: string, mimeType: string): Promise<GeminiResponse | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not configured');
    return null;
  }

  try {
    const imagePart: Part = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
      },
    };

    const result = await model.generateContent([IMAGE_ANALYSIS_PROMPT, imagePart]);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Gemini response:', text);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeminiResponse;

    // Validate and sanitize response
    if (!parsed.foods || !Array.isArray(parsed.foods)) {
      return { foods: [] };
    }

    return {
      foods: parsed.foods.map(sanitizeFood),
    };
  } catch (error) {
    console.error('Gemini image analysis failed:', error);
    return null;
  }
}

/**
 * Parse natural language food description into structured food data
 */
export async function parseText(text: string): Promise<GeminiResponse | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not configured');
    return null;
  }

  try {
    const prompt = TEXT_PARSING_PROMPT.replace('{text}', text);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Gemini response:', responseText);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeminiResponse;

    // Validate and sanitize response
    if (!parsed.foods || !Array.isArray(parsed.foods)) {
      return { foods: [] };
    }

    return {
      foods: parsed.foods.map(sanitizeFood),
    };
  } catch (error) {
    console.error('Gemini text parsing failed:', error);
    return null;
  }
}

/**
 * Sanitize and validate food data from Gemini
 */
function sanitizeFood(food: Partial<GeminiFood>): GeminiFood {
  return {
    name: String(food.name || 'Unknown Food').slice(0, 100),
    servingSize: Math.max(0.1, Number(food.servingSize) || 1),
    servingUnit: String(food.servingUnit || 'serving').slice(0, 20),
    calories: Math.max(0, Math.round(Number(food.calories) || 0)),
    protein: Math.max(0, Math.round(Number(food.protein) || 0)),
    carbs: Math.max(0, Math.round(Number(food.carbs) || 0)),
    fat: Math.max(0, Math.round(Number(food.fat) || 0)),
  };
}
