// Error handling middleware for Fastify

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Standardized API error response
 */
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Custom error handler for Fastify
 * Provides consistent error responses across all endpoints
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const statusCode = error.statusCode || 500;

  // Log error (but not in tests)
  if (process.env.NODE_ENV !== 'test') {
    request.log.error({
      err: error,
      url: request.url,
      method: request.method,
    });
  }

  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  const message = statusCode === 500 && isProduction
    ? 'Internal server error'
    : error.message;

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message,
    },
  };

  // Include validation errors if present
  if (error.validation) {
    response.error.code = 'VALIDATION_ERROR';
    response.error.details = error.validation;
  }

  reply.status(statusCode).send(response);
}

/**
 * Not found handler for undefined routes
 */
export function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): void {
  reply.status(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
    },
  });
}
