import { Handler, HandlerEvent } from '@netlify/functions';
import { corsHeaders } from './db';
import { authenticateRequest, unauthorizedResponse } from './auth';
import { barcodeLookupFatSecret, getFoodByIdFatSecret, validateBarcode, transformFatSecretFood } from './lib/fatsecret';

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

    // GET - Lookup food by barcode
    if (event.httpMethod === 'GET') {
      const barcode = event.queryStringParameters?.barcode;

      if (!barcode) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Barcode parameter is required' }),
        };
      }

      // Validate barcode format
      const validation = validateBarcode(barcode);
      if (!validation.valid || !validation.normalized) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid barcode format. Must be 8, 12, or 13 digits (UPC-A, EAN-8, EAN-13)',
          }),
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

      // Step 1: Lookup food_id from barcode
      const foodId = await barcodeLookupFatSecret(validation.normalized);

      if (!foodId) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Barcode not found in database. Try searching by product name instead.',
          }),
        };
      }

      // Step 2: Get full food details by food_id
      const foodDetails = await getFoodByIdFatSecret(foodId);

      if (!foodDetails) {
        return {
          statusCode: 502,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to retrieve food details from database' }),
        };
      }

      // Transform to unified Food interface
      const food = transformFatSecretFood(foodDetails);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ food }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Barcode lookup function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
