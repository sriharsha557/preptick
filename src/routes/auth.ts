// Authentication API routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';
import { prisma } from '../lib/db';
import {
  loginSchema,
  registerSchema,
  formatZodErrors,
  type LoginInput,
  type RegisterInput,
} from '../lib/validators';

export async function authRoutes(fastify: FastifyInstance) {
  // Login endpoint
  fastify.post('/api/auth/login', async (
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate request body
      const validation = loginSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Validation failed',
          message: formatZodErrors(validation.error),
        });
      }

      const { email, password } = validation.data;

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return reply.status(401).send({
          error: 'Invalid credentials',
          message: error.message,
        });
      }

      if (!data.user || !data.session) {
        return reply.status(401).send({
          error: 'Invalid credentials',
        });
      }

      // Get user profile from database
      const user = await prisma.user.findUnique({
        where: { email },
      });

      return reply.send({
        user: {
          id: data.user.id,
          email: data.user.email,
          curriculum: user?.curriculum,
          grade: user?.grade,
          subjects: user?.subjects ? JSON.parse(user.subjects) : [],
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Register endpoint
  fastify.post('/api/auth/register', async (
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate request body
      const validation = registerSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Validation failed',
          message: formatZodErrors(validation.error),
        });
      }

      const { email, password, curriculum, grade, subjects } = validation.data;

      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return reply.status(400).send({
          error: 'Registration failed',
          message: error.message,
        });
      }

      if (!data.user) {
        return reply.status(400).send({
          error: 'Registration failed',
        });
      }

      // Create user profile in database
      const user = await prisma.user.create({
        data: {
          id: data.user.id,
          email,
          passwordHash: '', // Supabase handles password
          curriculum,
          grade,
          subjects: JSON.stringify(subjects),
          createdAt: new Date(),
          lastLogin: new Date(),
        },
      });

      return reply.status(201).send({
        user: {
          id: user.id,
          email: user.email,
          curriculum: user.curriculum,
          grade: user.grade,
          subjects: JSON.parse(user.subjects),
        },
        message: 'Registration successful. Please check your email to verify your account.',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get profile endpoint
  fastify.get('/api/auth/profile', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      // Get token from Authorization header
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'No token provided',
        });
      }

      const token = authHeader.substring(7);

      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid token',
        });
      }

      // Get user profile from database
      const profile = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (!profile) {
        return reply.status(404).send({
          error: 'User not found',
        });
      }

      return reply.send({
        user: {
          id: profile.id,
          email: profile.email,
          curriculum: profile.curriculum,
          grade: profile.grade,
          subjects: JSON.parse(profile.subjects),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Logout endpoint
  fastify.post('/api/auth/logout', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      // Get token from Authorization header
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'No token provided',
        });
      }

      const token = authHeader.substring(7);

      // Sign out from Supabase
      await supabase.auth.signOut();

      return reply.send({
        message: 'Logout successful',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // OAuth consent endpoint (for Supabase OAuth flow)
  fastify.get('/oauth/consent', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    // This endpoint is used by Supabase OAuth Server
    // For now, just return a simple HTML page
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Consent - PREP TICK</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              text-align: center;
              max-width: 400px;
            }
            h1 {
              color: #333;
              margin-bottom: 1rem;
            }
            p {
              color: #666;
              line-height: 1.6;
            }
            .button {
              background: #667eea;
              color: white;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              text-decoration: none;
              display: inline-block;
              margin-top: 1rem;
            }
            .button:hover {
              background: #5568d3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>OAuth Consent</h1>
            <p>PREP TICK is requesting access to your account.</p>
            <p>This is a development endpoint. In production, implement proper OAuth consent flow.</p>
            <a href="http://localhost:5173/login" class="button">Return to Login</a>
          </div>
        </body>
      </html>
    `;
    
    reply.type('text/html').send(html);
  });
}
