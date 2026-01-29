// Tests for validation utilities

import { describe, it, expect } from 'vitest';
import {
  isValidGrade,
  isPositiveInteger,
  isValidCurriculum,
  isValidEmail,
  isNonEmptyArray,
  isValidPassword,
  sanitizeString,
  normalizeAnswer,
} from './validation';

describe('Validation utilities', () => {
  describe('isValidGrade', () => {
    it('should accept grades 1-10', () => {
      for (let grade = 1; grade <= 10; grade++) {
        expect(isValidGrade(grade)).toBe(true);
      }
    });

    it('should reject grade 0', () => {
      expect(isValidGrade(0)).toBe(false);
    });

    it('should reject grade 11', () => {
      expect(isValidGrade(11)).toBe(false);
    });

    it('should reject negative grades', () => {
      expect(isValidGrade(-1)).toBe(false);
    });

    it('should reject non-integer grades', () => {
      expect(isValidGrade(5.5)).toBe(false);
    });
  });

  describe('isPositiveInteger', () => {
    it('should accept positive integers', () => {
      expect(isPositiveInteger(1)).toBe(true);
      expect(isPositiveInteger(100)).toBe(true);
    });

    it('should reject zero', () => {
      expect(isPositiveInteger(0)).toBe(false);
    });

    it('should reject negative numbers', () => {
      expect(isPositiveInteger(-1)).toBe(false);
    });

    it('should reject non-integers', () => {
      expect(isPositiveInteger(1.5)).toBe(false);
    });
  });

  describe('isValidCurriculum', () => {
    it('should accept CBSE', () => {
      expect(isValidCurriculum('CBSE')).toBe(true);
    });

    it('should accept Cambridge', () => {
      expect(isValidCurriculum('Cambridge')).toBe(true);
    });

    it('should reject invalid curriculum', () => {
      expect(isValidCurriculum('IB')).toBe(false);
      expect(isValidCurriculum('cbse')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user @domain.com')).toBe(false);
    });
  });

  describe('isNonEmptyArray', () => {
    it('should accept non-empty arrays', () => {
      expect(isNonEmptyArray([1])).toBe(true);
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
    });

    it('should reject empty arrays', () => {
      expect(isNonEmptyArray([])).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should accept passwords with 8+ characters', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('12345678')).toBe(true);
    });

    it('should reject passwords with less than 8 characters', () => {
      expect(isValidPassword('pass')).toBe(false);
      expect(isValidPassword('1234567')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\thello\n')).toBe('hello');
    });

    it('should preserve internal whitespace', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world');
    });
  });

  describe('normalizeAnswer', () => {
    it('should lowercase and trim', () => {
      expect(normalizeAnswer('  HELLO  ')).toBe('hello');
    });

    it('should remove extra spaces', () => {
      expect(normalizeAnswer('hello   world')).toBe('hello world');
    });

    it('should handle mixed case and spacing', () => {
      expect(normalizeAnswer('  Hello   World  ')).toBe('hello world');
    });
  });
});
