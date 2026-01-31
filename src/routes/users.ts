// User Profile API routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/db';

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
  // Get user profile
  fastify.get('/api/users/:userId/profile', async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { userId } = request.params;

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
        return reply.status(404).send({
          error: 'User not found',
          message: `User with ID ${userId} not found`,
        });
      }

      return reply.send(user);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Update user profile
  fastify.put('/api/users/:userId/profile', async (
    request: FastifyRequest<{ 
      Params: { userId: string };
      Body: UpdateProfileBody;
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { userId } = request.params;
      const updateData = request.body;

      // Validate user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return reply.status(404).send({
          error: 'User not found',
          message: `User with ID ${userId} not found`,
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
          grade: updateData.grade,
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
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Upload profile picture (placeholder - in production, use cloud storage)
  fastify.post('/api/users/:userId/profile-picture', async (
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { userId } = request.params;

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
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
