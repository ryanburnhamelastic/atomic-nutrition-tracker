import { Handler, HandlerEvent } from '@netlify/functions';
import { corsHeaders } from './db';
import { authenticateRequest, unauthorizedResponse } from './auth';
import { searchOpenFoodFacts, transformOpenFoodFactsProducts } from './lib/openfoodfacts';

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

    // GET - Search Open Food Facts
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

      const result = await searchOpenFoodFacts(query, limit);

      if (!result) {
        return {
          statusCode: 502,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to search Open Food Facts database' }),
        };
      }

      // Transform products to our format
      const foods = transformOpenFoodFactsProducts(result);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          foods,
          totalResults: result.count || 0,
        }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Open Food Facts search function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
