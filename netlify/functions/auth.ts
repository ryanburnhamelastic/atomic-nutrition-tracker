import { verifyToken } from '@clerk/backend';
import { HandlerEvent } from '@netlify/functions';

export interface AuthResult {
  authenticated: boolean;
  clerkUserId?: string;
  error?: string;
}

/**
 * Authenticate a request using Clerk JWT token
 * Extract the Bearer token from Authorization header and verify it
 */
export async function authenticateRequest(event: HandlerEvent): Promise<AuthResult> {
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      // Optional: Add authorized parties for subdomain cookie protection
      // authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES?.split(','),
    });

    return {
      authenticated: true,
      clerkUserId: verifiedToken.sub,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { authenticated: false, error: 'Invalid or expired token' };
  }
}

/**
 * Helper to create an unauthorized response
 */
export function unauthorizedResponse(headers: Record<string, string>, message = 'Unauthorized') {
  return {
    statusCode: 401,
    headers,
    body: JSON.stringify({ error: message }),
  };
}
