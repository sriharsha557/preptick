// Main application entry point

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { prisma } from './lib/db';
import { authRoutes } from './routes/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { validateEnv, logEnvStatus } from './lib/env';

// Validate environment variables at startup (fail fast in production if missing)
validateEnv();
logEnvStatus();

const fastify = Fastify({
  logger: true,
});

// Allowed origins for CORS
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? [
      'https://preptick.vercel.app',
      'https://www.preptick.vercel.app',
      process.env.FRONTEND_URL, // Allow custom frontend URL if set
    ].filter(Boolean) as string[]
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

// Register security headers
fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding from same origin
});

// Register rate limiting
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.ip,
});

// Register CORS with specific origins
fastify.register(cors, {
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Register error handlers
fastify.setErrorHandler(errorHandler);
fastify.setNotFoundHandler(notFoundHandler);

// Import route handlers
import { testRoutes } from './routes/tests';
import { syllabusRoutes } from './routes/syllabus';
import { userRoutes } from './routes/users';

// Register routes
fastify.register(authRoutes);
fastify.register(testRoutes);
fastify.register(syllabusRoutes);
fastify.register(userRoutes);

// Health check endpoint with database connectivity
fastify.get('/health', async (request, reply) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
    };
  } catch (error) {
    return reply.status(503).send({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Root endpoint
fastify.get('/', async () => {
  return {
    name: 'MockPrep API',
    version: '1.0.0',
    description: 'Exam preparation platform for CBSE and Cambridge students',
  };
});

// Graceful shutdown
const closeGracefully = async (signal: string) => {
  console.log(`Received signal ${signal}, closing gracefully...`);
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
