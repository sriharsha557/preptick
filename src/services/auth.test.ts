// Unit tests for Authentication Service

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authService } from './auth';
import { prisma } from '../lib/db';
import type { UserProfile } from '../types';

describe('AuthenticationService', () => {
  // Clean up database before and after each test
  beforeEach(async () => {
    await prisma.user.deleteMany({});
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
  });

  describe('registerUser', () => {
    it('should register a valid user with CBSE curriculum', async () => {
      const profile = {
        email: 'student@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics', 'Science'],
      };

      const result = await authService.registerUser(profile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeDefined();
        expect(typeof result.value).toBe('string');

        // Verify user was created in database
        const user = await prisma.user.findUnique({
          where: { id: result.value },
        });
        expect(user).toBeDefined();
        expect(user?.email).toBe(profile.email);
        expect(user?.curriculum).toBe(profile.curriculum);
        expect(user?.grade).toBe(profile.grade);
        expect(JSON.parse(user?.subjects || '[]')).toEqual(profile.subjects);
      }
    });

    it('should register a valid user with Cambridge curriculum', async () => {
      const profile = {
        email: 'cambridge@example.com',
        password: 'securepass',
        curriculum: 'Cambridge' as const,
        grade: 10,
        subjects: ['Physics', 'Chemistry', 'Biology'],
      };

      const result = await authService.registerUser(profile);

      expect(result.success).toBe(true);
      if (result.success) {
        const user = await prisma.user.findUnique({
          where: { id: result.value },
        });
        expect(user?.curriculum).toBe('Cambridge');
        expect(user?.grade).toBe(10);
      }
    });

    it('should reject registration with invalid grade (0)', async () => {
      const profile = {
        email: 'invalid@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 0,
        subjects: ['Mathematics'],
      };

      const result = await authService.registerUser(profile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('InvalidGrade');
        if (result.error.type === 'InvalidGrade') {
          expect(result.error.grade).toBe(0);
        }
      }
    });

    it('should reject registration with invalid grade (11)', async () => {
      const profile = {
        email: 'invalid@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 11,
        subjects: ['Mathematics'],
      };

      const result = await authService.registerUser(profile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('InvalidGrade');
        if (result.error.type === 'InvalidGrade') {
          expect(result.error.grade).toBe(11);
        }
      }
    });

    it('should reject registration with invalid grade (non-integer)', async () => {
      const profile = {
        email: 'invalid@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5.5,
        subjects: ['Mathematics'],
      };

      const result = await authService.registerUser(profile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('InvalidGrade');
      }
    });

    it('should accept registration with grade 1 (boundary)', async () => {
      const profile = {
        email: 'grade1@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 1,
        subjects: ['English'],
      };

      const result = await authService.registerUser(profile);

      expect(result.success).toBe(true);
    });

    it('should accept registration with grade 10 (boundary)', async () => {
      const profile = {
        email: 'grade10@example.com',
        password: 'password123',
        curriculum: 'Cambridge' as const,
        grade: 10,
        subjects: ['Mathematics'],
      };

      const result = await authService.registerUser(profile);

      expect(result.success).toBe(true);
    });

    it('should reject registration with empty subjects array', async () => {
      const profile = {
        email: 'nosubjects@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: [],
      };

      const result = await authService.registerUser(profile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('ValidationError');
      }
    });

    it('should reject registration with invalid email', async () => {
      const profile = {
        email: 'invalid-email',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };

      const result = await authService.registerUser(profile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('ValidationError');
      }
    });

    it('should reject registration with short password', async () => {
      const profile = {
        email: 'test@example.com',
        password: 'short',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };

      const result = await authService.registerUser(profile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('ValidationError');
      }
    });

    it('should reject registration with duplicate email', async () => {
      const profile = {
        email: 'duplicate@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };

      // Register first user
      const result1 = await authService.registerUser(profile);
      expect(result1.success).toBe(true);

      // Try to register with same email
      const result2 = await authService.registerUser(profile);
      expect(result2.success).toBe(false);
      if (!result2.success) {
        expect(result2.error.type).toBe('DuplicateUser');
      }
    });

    it('should hash password (not store plaintext)', async () => {
      const profile = {
        email: 'secure@example.com',
        password: 'mypassword123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };

      const result = await authService.registerUser(profile);

      expect(result.success).toBe(true);
      if (result.success) {
        const user = await prisma.user.findUnique({
          where: { id: result.value },
        });
        expect(user?.passwordHash).toBeDefined();
        expect(user?.passwordHash).not.toBe(profile.password);
        expect(user?.passwordHash.length).toBeGreaterThan(20); // bcrypt hashes are long
      }
    });

    it('should trim whitespace from email and subjects', async () => {
      const profile = {
        email: '  whitespace@example.com  ',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['  Mathematics  ', '  Science  '],
      };

      const result = await authService.registerUser(profile);

      expect(result.success).toBe(true);
      if (result.success) {
        const user = await prisma.user.findUnique({
          where: { id: result.value },
        });
        expect(user?.email).toBe('whitespace@example.com');
        expect(JSON.parse(user?.subjects || '[]')).toEqual(['Mathematics', 'Science']);
      }
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      // Register a user first
      const profile = {
        email: 'login@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };
      await authService.registerUser(profile);

      // Login
      const result = await authService.login({
        email: profile.email,
        password: profile.password,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.userId).toBeDefined();
        expect(result.value.token).toBeDefined();
        expect(result.value.expiresAt).toBeInstanceOf(Date);
      }
    });

    it('should reject login with wrong password', async () => {
      // Register a user first
      const profile = {
        email: 'wrongpass@example.com',
        password: 'correctpassword',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };
      await authService.registerUser(profile);

      // Try to login with wrong password
      const result = await authService.login({
        email: profile.email,
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('InvalidCredentials');
      }
    });

    it('should reject login with non-existent email', async () => {
      const result = await authService.login({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('UserNotFound');
      }
    });

    it('should update lastLogin timestamp on successful login', async () => {
      // Register a user
      const profile = {
        email: 'timestamp@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };
      const registerResult = await authService.registerUser(profile);
      expect(registerResult.success).toBe(true);

      if (registerResult.success) {
        const userId = registerResult.value;
        const userBefore = await prisma.user.findUnique({ where: { id: userId } });
        const lastLoginBefore = userBefore?.lastLogin;

        // Wait a bit to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 10));

        // Login
        await authService.login({
          email: profile.email,
          password: profile.password,
        });

        const userAfter = await prisma.user.findUnique({ where: { id: userId } });
        const lastLoginAfter = userAfter?.lastLogin;

        expect(lastLoginAfter).toBeDefined();
        expect(lastLoginAfter!.getTime()).toBeGreaterThanOrEqual(lastLoginBefore!.getTime());
      }
    });
  });

  describe('validateSession', () => {
    it('should validate a valid session token', async () => {
      // Register and login a user
      const profile = {
        email: 'session@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };
      await authService.registerUser(profile);
      
      const loginResult = await authService.login({
        email: profile.email,
        password: profile.password,
      });

      expect(loginResult.success).toBe(true);
      if (loginResult.success) {
        const { token, userId } = loginResult.value;

        // Validate the session
        const validateResult = await authService.validateSession(token);
        
        expect(validateResult.success).toBe(true);
        if (validateResult.success) {
          expect(validateResult.value).toBe(userId);
        }
      }
    });

    it('should reject an invalid token format', async () => {
      const result = await authService.validateSession('invalid-token');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('InvalidCredentials');
      }
    });

    it('should reject a malformed token', async () => {
      const malformedToken = Buffer.from('malformed').toString('base64');
      const result = await authService.validateSession(malformedToken);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('InvalidCredentials');
      }
    });

    it('should reject an expired token', async () => {
      // Create an expired token (8 days old)
      const userId = 'test-user-id';
      const expiredTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago
      const expiredToken = Buffer.from(`${userId}:${expiredTimestamp}`).toString('base64');

      const result = await authService.validateSession(expiredToken);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SessionExpired');
      }
    });

    it('should reject a token for non-existent user', async () => {
      // Create a token for a user that doesn't exist
      const nonExistentUserId = 'non-existent-user-id';
      const token = Buffer.from(`${nonExistentUserId}:${Date.now()}`).toString('base64');

      const result = await authService.validateSession(token);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('UserNotFound');
      }
    });

    it('should accept a token that is not yet expired', async () => {
      // Register and login a user
      const profile = {
        email: 'notexpired@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };
      const registerResult = await authService.registerUser(profile);
      expect(registerResult.success).toBe(true);

      if (registerResult.success) {
        const userId = registerResult.value;
        
        // Create a token that's 6 days old (still valid)
        const sixDaysAgo = Date.now() - (6 * 24 * 60 * 60 * 1000);
        const token = Buffer.from(`${userId}:${sixDaysAgo}`).toString('base64');

        const result = await authService.validateSession(token);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toBe(userId);
        }
      }
    });
  });

  describe('getUserProfile', () => {
    it('should retrieve user profile by ID', async () => {
      // Register a user
      const profile = {
        email: 'getprofile@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 7,
        subjects: ['Mathematics', 'Science', 'English'],
      };
      const registerResult = await authService.registerUser(profile);
      expect(registerResult.success).toBe(true);

      if (registerResult.success) {
        const userId = registerResult.value;

        // Get profile
        const result = await authService.getUserProfile(userId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.userId).toBe(userId);
          expect(result.value.email).toBe(profile.email);
          expect(result.value.curriculum).toBe(profile.curriculum);
          expect(result.value.grade).toBe(profile.grade);
          expect(result.value.subjects).toEqual(profile.subjects);
          expect(result.value.createdAt).toBeInstanceOf(Date);
          expect(result.value.lastLogin).toBeInstanceOf(Date);
        }
      }
    });

    it('should return NotFound error for non-existent user', async () => {
      const result = await authService.getUserProfile('non-existent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NotFound');
        expect(result.error.resource).toBe('User');
        expect(result.error.id).toBe('non-existent-id');
      }
    });
  });

  describe('profile persistence (Requirements 1.4, 1.5)', () => {
    it('should persist and restore profile across login sessions', async () => {
      // Register a user
      const profile = {
        email: 'persistence@example.com',
        password: 'password123',
        curriculum: 'Cambridge' as const,
        grade: 8,
        subjects: ['Mathematics', 'Physics', 'Chemistry'],
      };
      const registerResult = await authService.registerUser(profile);
      expect(registerResult.success).toBe(true);

      if (registerResult.success) {
        const userId = registerResult.value;

        // Simulate logout by just getting a new session
        // Login again
        const loginResult = await authService.login({
          email: profile.email,
          password: profile.password,
        });
        expect(loginResult.success).toBe(true);

        if (loginResult.success) {
          // Retrieve profile after login
          const profileResult = await authService.getUserProfile(loginResult.value.userId);
          expect(profileResult.success).toBe(true);

          if (profileResult.success) {
            // Verify all profile data is restored
            expect(profileResult.value.curriculum).toBe(profile.curriculum);
            expect(profileResult.value.grade).toBe(profile.grade);
            expect(profileResult.value.subjects).toEqual(profile.subjects);
            expect(profileResult.value.email).toBe(profile.email);
            expect(profileResult.value.createdAt).toBeInstanceOf(Date);
            expect(profileResult.value.lastLogin).toBeInstanceOf(Date);
          }
        }
      }
    });

    it('should persist profile updates across sessions', async () => {
      // Register a user
      const profile = {
        email: 'updatepersist@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };
      const registerResult = await authService.registerUser(profile);
      expect(registerResult.success).toBe(true);

      if (registerResult.success) {
        const userId = registerResult.value;

        // Update profile
        const updateResult = await authService.updateProfile(userId, {
          grade: 7,
          curriculum: 'Cambridge',
          subjects: ['Physics', 'Chemistry'],
        });
        expect(updateResult.success).toBe(true);

        // Simulate logout and login
        const loginResult = await authService.login({
          email: profile.email,
          password: profile.password,
        });
        expect(loginResult.success).toBe(true);

        if (loginResult.success) {
          // Retrieve profile after login
          const profileResult = await authService.getUserProfile(loginResult.value.userId);
          expect(profileResult.success).toBe(true);

          if (profileResult.success) {
            // Verify updated profile data is persisted
            expect(profileResult.value.curriculum).toBe('Cambridge');
            expect(profileResult.value.grade).toBe(7);
            expect(profileResult.value.subjects).toEqual(['Physics', 'Chemistry']);
          }
        }
      }
    });
  });

  describe('updateProfile', () => {
    it('should update user grade', async () => {
      // Register a user
      const profile = {
        email: 'update@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };
      const registerResult = await authService.registerUser(profile);
      expect(registerResult.success).toBe(true);

      if (registerResult.success) {
        const userId = registerResult.value;

        // Update grade
        const updateResult = await authService.updateProfile(userId, { grade: 6 });
        expect(updateResult.success).toBe(true);

        // Verify update
        const profileResult = await authService.getUserProfile(userId);
        expect(profileResult.success).toBe(true);
        if (profileResult.success) {
          expect(profileResult.value.grade).toBe(6);
        }
      }
    });

    it('should update user curriculum', async () => {
      // Register a user
      const profile = {
        email: 'updatecurr@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };
      const registerResult = await authService.registerUser(profile);
      expect(registerResult.success).toBe(true);

      if (registerResult.success) {
        const userId = registerResult.value;

        // Update curriculum
        const updateResult = await authService.updateProfile(userId, { 
          curriculum: 'Cambridge' 
        });
        expect(updateResult.success).toBe(true);

        // Verify update
        const profileResult = await authService.getUserProfile(userId);
        expect(profileResult.success).toBe(true);
        if (profileResult.success) {
          expect(profileResult.value.curriculum).toBe('Cambridge');
        }
      }
    });

    it('should update user subjects', async () => {
      // Register a user
      const profile = {
        email: 'updatesubj@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };
      const registerResult = await authService.registerUser(profile);
      expect(registerResult.success).toBe(true);

      if (registerResult.success) {
        const userId = registerResult.value;

        // Update subjects
        const newSubjects = ['Physics', 'Chemistry', 'Biology'];
        const updateResult = await authService.updateProfile(userId, { 
          subjects: newSubjects 
        });
        expect(updateResult.success).toBe(true);

        // Verify update
        const profileResult = await authService.getUserProfile(userId);
        expect(profileResult.success).toBe(true);
        if (profileResult.success) {
          expect(profileResult.value.subjects).toEqual(newSubjects);
        }
      }
    });

    it('should reject update with invalid grade', async () => {
      // Register a user
      const profile = {
        email: 'invalidupdate@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };
      const registerResult = await authService.registerUser(profile);
      expect(registerResult.success).toBe(true);

      if (registerResult.success) {
        const userId = registerResult.value;

        // Try to update with invalid grade
        const updateResult = await authService.updateProfile(userId, { grade: 15 });
        expect(updateResult.success).toBe(false);
        if (!updateResult.success) {
          expect(updateResult.error.type).toBe('UpdateFailed');
        }
      }
    });

    it('should reject update with empty subjects array', async () => {
      // Register a user
      const profile = {
        email: 'emptysubj@example.com',
        password: 'password123',
        curriculum: 'CBSE' as const,
        grade: 5,
        subjects: ['Mathematics'],
      };
      const registerResult = await authService.registerUser(profile);
      expect(registerResult.success).toBe(true);

      if (registerResult.success) {
        const userId = registerResult.value;

        // Try to update with empty subjects
        const updateResult = await authService.updateProfile(userId, { subjects: [] });
        expect(updateResult.success).toBe(false);
        if (!updateResult.success) {
          expect(updateResult.error.type).toBe('UpdateFailed');
        }
      }
    });
  });
});
