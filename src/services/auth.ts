// Authentication Service Implementation

import bcrypt from 'bcrypt';
import { prisma } from '../lib/db';
import { 
  isValidGrade, 
  isValidCurriculum, 
  isValidEmail, 
  isValidPassword,
  isNonEmptyArray,
  sanitizeString 
} from '../lib/validation';
import { Ok, Err } from '../types';
import type {
  UserId,
  UserProfile,
  Credentials,
  Session,
  ProfileUpdates,
  Result,
  RegistrationError,
  AuthError,
  NotFoundError,
  UpdateError,
} from '../types';
import type { AuthenticationService } from './interfaces';

const SALT_ROUNDS = 10;

export class AuthService implements AuthenticationService {
  /**
   * Register a new user with profile validation
   * Validates curriculum, grade (1-10), and subjects
   * Hashes password and persists user to database
   */
  async registerUser(
    profile: Omit<UserProfile, 'userId' | 'createdAt' | 'lastLogin'> & { password: string }
  ): Promise<Result<UserId, RegistrationError>> {
    // Validate email
    const email = sanitizeString(profile.email);
    if (!isValidEmail(email)) {
      return Err({ 
        type: 'ValidationError', 
        message: 'Invalid email format' 
      });
    }

    // Validate password
    if (!isValidPassword(profile.password)) {
      return Err({ 
        type: 'ValidationError', 
        message: `Password must be at least 8 characters long` 
      });
    }

    // Validate curriculum
    if (!isValidCurriculum(profile.curriculum)) {
      return Err({ 
        type: 'ValidationError', 
        message: `Invalid curriculum. Must be 'CBSE' or 'Cambridge'` 
      });
    }

    // Validate grade (1-10)
    if (!isValidGrade(profile.grade)) {
      return Err({ 
        type: 'InvalidGrade', 
        grade: profile.grade 
      });
    }

    // Validate subjects (at least one)
    if (!isNonEmptyArray(profile.subjects)) {
      return Err({ 
        type: 'ValidationError', 
        message: 'At least one subject is required' 
      });
    }

    // Sanitize subjects
    const subjects = profile.subjects.map(s => sanitizeString(s));

    // Check for duplicate user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Err({ type: 'DuplicateUser' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(profile.password, SALT_ROUNDS);

    // Create user
    try {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          curriculum: profile.curriculum,
          grade: profile.grade,
          subjects: JSON.stringify(subjects),
          createdAt: new Date(),
          lastLogin: new Date(),
        },
      });

      return Ok(user.id);
    } catch (error) {
      return Err({ 
        type: 'ValidationError', 
        message: `Failed to create user: ${error}` 
      });
    }
  }

  /**
   * Login with credentials
   * Validates email and password, returns session token
   */
  async login(credentials: Credentials): Promise<Result<Session, AuthError>> {
    const email = sanitizeString(credentials.email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return Err({ type: 'UserNotFound' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isValidPassword) {
      return Err({ type: 'InvalidCredentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate session token (simplified - in production use JWT)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return Ok({
      userId: user.id,
      token,
      expiresAt,
    });
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: UserId): Promise<Result<UserProfile, NotFoundError>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return Err({ 
        type: 'NotFound', 
        resource: 'User', 
        id: userId 
      });
    }

    return Ok({
      userId: user.id,
      email: user.email,
      curriculum: user.curriculum as 'CBSE' | 'Cambridge',
      grade: user.grade,
      subjects: JSON.parse(user.subjects) as string[],
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    });
  }

  /**
   * Validate session token
   * Returns the userId if the token is valid and not expired
   */
  async validateSession(token: string): Promise<Result<UserId, AuthError>> {
    try {
      // Decode token (format: base64(userId:timestamp))
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId, timestampStr] = decoded.split(':');
      
      if (!userId || !timestampStr) {
        return Err({ type: 'InvalidCredentials' });
      }

      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp)) {
        return Err({ type: 'InvalidCredentials' });
      }

      // Check if token is expired (7 days)
      const expirationTime = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      const now = Date.now();
      if (now - timestamp > expirationTime) {
        return Err({ type: 'SessionExpired' });
      }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return Err({ type: 'UserNotFound' });
      }

      return Ok(userId);
    } catch (error) {
      return Err({ type: 'InvalidCredentials' });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: UserId, 
    updates: ProfileUpdates
  ): Promise<Result<void, UpdateError>> {
    // Validate updates
    if (updates.grade !== undefined && !isValidGrade(updates.grade)) {
      return Err({ 
        type: 'UpdateFailed', 
        reason: `Invalid grade: ${updates.grade}. Must be between 1 and 10` 
      });
    }

    if (updates.curriculum !== undefined && !isValidCurriculum(updates.curriculum)) {
      return Err({ 
        type: 'UpdateFailed', 
        reason: `Invalid curriculum: ${updates.curriculum}. Must be 'CBSE' or 'Cambridge'` 
      });
    }

    if (updates.subjects !== undefined && !isNonEmptyArray(updates.subjects)) {
      return Err({ 
        type: 'UpdateFailed', 
        reason: 'At least one subject is required' 
      });
    }

    // Build update data
    const updateData: any = {};
    if (updates.curriculum !== undefined) {
      updateData.curriculum = updates.curriculum;
    }
    if (updates.grade !== undefined) {
      updateData.grade = updates.grade;
    }
    if (updates.subjects !== undefined) {
      updateData.subjects = JSON.stringify(updates.subjects.map(s => sanitizeString(s)));
    }

    // Update user
    try {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return Ok(undefined);
    } catch (error) {
      return Err({ 
        type: 'UpdateFailed', 
        reason: `Failed to update profile: ${error}` 
      });
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
