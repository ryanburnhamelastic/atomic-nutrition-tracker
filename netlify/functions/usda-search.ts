import { Handler, HandlerEvent } from '@netlify/functions';
import { corsHeaders } from './db';
import { authenticateRequest, unauthorizedResponse } from './auth';
import { searchUSDA, transformUSDAFood } from './lib/usda';

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

    // GET - Search USDA foods
    if (event.httpMethod === 'GET') {
      const query = event.queryStringParameters?.q;
      const limit = Math.min(Number(event.queryStringParameters?.limit) || 20, 50);

      if (!query) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Search query is required' }),
        };
      }

      // Check if USDA API key is configured
      if (!process.env.USDA_API_KEY) {
        return {
          statusCode: 503,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'USDA API not configured' }),
        };
      }

      const result = await searchUSDA(query, limit);

      if (!result) {
        return {
          statusCode: 502,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to search USDA database' }),
        };
      }

      // Transform foods to our format
      const foods = result.foods.map(transformUSDAFood);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          foods,
          totalHits: result.totalHits,
        }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('USDA search function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
