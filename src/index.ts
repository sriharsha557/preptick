// Main application entry point

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { prisma } from './lib/db';

const fastify = Fastify({
  logger: true,
});

// Register CORS
fastify.register(cors, {
  origin: true,
});

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
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
