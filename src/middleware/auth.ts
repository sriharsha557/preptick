// Authentication Middleware
// Uses Supabase for token verification

import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';

// Extend Fastify types for authentication
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;      // User ID from Supabase
      userId: string;  // Alias for id (for compatibility)
      email: string;
    };
  }
}

/**
 * Authentication pre-handler hook
 * Verifies the Supabase token and attaches user info to request
 * Use as: preHandler: [authenticate]
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
      return;
    }

    // Attach user info to request
    request.user = {
      id: user.id,
      userId: user.id, // Alias for compatibility
      email: user.email || '',
    };
  } catch (err) {
    console.error('Authentication error:', err);
    reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed',
      },
    });
  }
}

/**
 * Verify token ownership - ensures user can only access their own resources
 */
export function verifyOwnership(request: FastifyRequest, resourceUserId: string): boolean {
  return request.user?.userId === resourceUserId;
}
