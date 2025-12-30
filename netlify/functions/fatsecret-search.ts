import { Handler, HandlerEvent } from '@netlify/functions';
import { corsHeaders } from './db';
import { authenticateRequest, unauthorizedResponse } from './auth';
import { searchFatSecret, transformFatSecretFoods } from './lib/fatsecret';

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

    // GET - Search FatSecret foods
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

      // Check if FatSecret API credentials are configured
      if (!process.env.FATSECRET_CLIENT_ID || !process.env.FATSECRET_CLIENT_SECRET) {
        return {
          statusCode: 503,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'FatSecret API not configured' }),
        };
      }

      const result = await searchFatSecret(query, limit);

      if (!result) {
        return {
          statusCode: 502,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to search FatSecret database' }),
        };
      }

      // Transform foods to our format
      const foods = transformFatSecretFoods(result);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          foods,
          totalResults: parseInt(result.total_results || '0'),
        }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('FatSecret search function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
