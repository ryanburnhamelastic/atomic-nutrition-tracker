import { Handler, HandlerEvent } from '@netlify/functions';
import { corsHeaders } from './db';
import { authenticateRequest, unauthorizedResponse } from './auth';
import { parseText, MacroContext } from './lib/gemini';

const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    const authResult = await authenticateRequest(event);

    if (!authResult.authenticated || !authResult.clerkUserId) {
      return unauthorizedResponse(corsHeaders, authResult.error);
    }

    // POST - Parse food text
    if (event.httpMethod === 'POST') {
      // Check if Gemini API key is configured
      if (!process.env.GEMINI_API_KEY) {
        return {
          statusCode: 503,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'AI service not configured' }),
        };
      }

      // Parse request body
      let body: {
        text?: string;
        remainingCalories?: number;
        remainingProtein?: number;
        remainingCarbs?: number;
        remainingFat?: number;
      };
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid request body' }),
        };
      }

      const { text, remainingCalories, remainingProtein, remainingCarbs, remainingFat } = body;

      if (!text || typeof text !== 'string') {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Text description is required' }),
        };
      }

      // Limit text length
      if (text.length > 1000) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Text too long. Please use a shorter description.' }),
        };
      }

      // Build macro context if provided
      let macroContext: MacroContext | undefined;
      if (
        typeof remainingCalories === 'number' &&
        typeof remainingProtein === 'number' &&
        typeof remainingCarbs === 'number' &&
        typeof remainingFat === 'number'
      ) {
        macroContext = {
          remainingCalories,
          remainingProtein,
          remainingCarbs,
          remainingFat,
        };
      }

      // Parse with Gemini (with macro context if available)
      const result = await parseText(text.trim(), macroContext);

      if (!result) {
        return {
          statusCode: 502,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to parse text. Please try again.' }),
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          ...result,
          originalText: text,
        }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Parse food text function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
