// User Profile API routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/db';
import { authenticate, verifyOwnership } from '../middleware/auth';

interface UpdateProfileBody {
  name?: string;
  gender?: string;
  schoolName?: string;
  city?: string;
  country?: string;
  profilePicture?: string;
  curriculum?: string;
  grade?: number;
  subjects?: string;
}

export async function userRoutes(fastify: FastifyInstance) {
  // Get current user's profile - requires authentication
  // Requirement 1.1, 1.2: Fetch user profile for grade auto-population
  fastify.get('/api/users/profile', {
    preHandler: [authenticate],
  }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      // Get user ID from authentication token
      const userId = (request as any).user?.id;

      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          grade: true,
          subjects: true,
          curriculum: true,
        },
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      return reply.send(user);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });

  // Get user profile - requires authentication
  fastify.get('/api/users/:userId/profile', {
    preHandler: [authenticate],
  }, async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { userId } = request.params;

      // Verify user can only access their own profile
      if (!verifyOwnership(request, userId)) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only access your own profile',
          },
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          gender: true,
          schoolName: true,
          city: true,
          country: true,
          profilePicture: true,
          curriculum: true,
          grade: true,
          subjects: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      if (!user) {
        // Return 403 instead of 404 to prevent user enumeration
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        });
      }

      return reply.send(user);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });

  // Update user profile - requires authentication
  fastify.put('/api/users/:userId/profile', {
    preHandler: [authenticate],
  }, async (
    request: FastifyRequest<{
      Params: { userId: string };
      Body: UpdateProfileBody;
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { userId } = request.params;
      const updateData = request.body;

      // Verify user can only update their own profile
      if (!verifyOwnership(request, userId)) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own profile',
          },
        });
      }

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: updateData.name,
          gender: updateData.gender,
          schoolName: updateData.schoolName,
          city: updateData.city,
          country: updateData.country,
          profilePicture: updateData.profilePicture,
          curriculum: updateData.curriculum,
          grade: updateData.grade ? parseInt(String(updateData.grade)) : undefined,
          subjects: updateData.subjects,
        },
        select: {
          id: true,
          email: true,
          name: true,
          gender: true,
          schoolName: true,
          city: true,
          country: true,
          profilePicture: true,
          curriculum: true,
          grade: true,
          subjects: true,
        },
      });

      return reply.send({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });

  // Upload profile picture - requires authentication
  fastify.post('/api/users/:userId/profile-picture', {
    preHandler: [authenticate],
  }, async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { userId } = request.params;

      // Verify user can only upload their own profile picture
      if (!verifyOwnership(request, userId)) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only upload your own profile picture',
          },
        });
      }

      // In production, handle file upload to S3/Cloudinary/etc.
      // For now, return a placeholder response
      return reply.send({
        success: true,
        message: 'Profile picture upload endpoint - implement cloud storage integration',
        url: '/placeholder-profile-picture.jpg',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });
}
