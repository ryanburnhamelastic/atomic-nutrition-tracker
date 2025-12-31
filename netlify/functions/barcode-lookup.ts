import { Handler, HandlerEvent } from '@netlify/functions';
import { corsHeaders } from './db';
import { authenticateRequest, unauthorizedResponse } from './auth';
import { barcodeLookupOpenFoodFacts, transformOpenFoodFactsProduct } from './lib/openfoodfacts';

/**
 * Validate and normalize barcode format
 * Accepts: UPC-A (12 digits), EAN-13 (13 digits), EAN-8 (8 digits)
 */
function validateBarcode(barcode: string): { valid: boolean; normalized: string | null } {
  // Remove whitespace and non-digit characters
  const cleaned = barcode.replace(/\D/g, '');

  // Check valid lengths
  if ([8, 12, 13].includes(cleaned.length)) {
    return { valid: true, normalized: cleaned };
  }

  return { valid: false, normalized: null };
}

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

      // Lookup product in Open Food Facts
      const product = await barcodeLookupOpenFoodFacts(validation.normalized);

      if (!product) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Barcode not found in database. Try searching by product name instead.',
          }),
        };
      }

      // Transform to unified Food interface
      const food = transformOpenFoodFactsProduct(product);

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
