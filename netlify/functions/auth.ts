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

  console.log('[Auth Function] Checking auth header:', authHeader ? 'Present' : 'Missing');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Auth Function] Invalid or missing authorization header');
    return { authenticated: false, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('[Auth Function] Token extracted, length:', token.length);

  try {
    // For Netlify deployments, we need to specify authorized parties
    // This allows tokens issued for *.netlify.app subdomains
    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      // Development instances need explicit authorized parties for subdomain deployments
      ...(process.env.CLERK_AUTHORIZED_PARTIES && {
        authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES.split(','),
      }),
    });

    console.log('[Auth Function] Token verified successfully for user:', verifiedToken.sub);
    return {
      authenticated: true,
      clerkUserId: verifiedToken.sub,
    };
  } catch (error) {
    console.error('[Auth Function] Token verification failed:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('[Auth Function] Error message:', error.message);
      console.error('[Auth Function] Error stack:', error.stack);
    }
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
