// Validation utilities

import { Curriculum, Subject } from '../types';

/**
 * Validate that a grade is between 1 and 10 inclusive
 */
export function isValidGrade(grade: number): boolean {
  return Number.isInteger(grade) && grade >= 1 && grade <= 10;
}

/**
 * Validate that a value is a positive integer
 */
export function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/**
 * Validate curriculum type
 */
export function isValidCurriculum(curriculum: string): curriculum is Curriculum {
  return curriculum === 'CBSE' || curriculum === 'Cambridge';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate that an array is non-empty
 */
export function isNonEmptyArray<T>(arr: T[]): boolean {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Validate password strength (minimum 8 characters)
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Sanitize user input by trimming whitespace
 */
export function sanitizeString(input: string): string {
  return input.trim();
}

/**
 * Normalize answer for comparison (lowercase, trim, remove extra spaces)
 */
export function normalizeAnswer(answer: string): string {
  return answer.toLowerCase().trim().replace(/\s+/g, ' ');
}
