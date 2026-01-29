// Tests for Result utility functions

import { describe, it, expect } from 'vitest';
import { Ok, Err } from '../types';
import {
  unwrap,
  unwrapOr,
  map,
  mapErr,
  isOk,
  isErr,
  combine,
} from './result';

describe('Result utilities', () => {
  describe('unwrap', () => {
    it('should return value for Ok result', () => {
      const result = Ok(42);
      expect(unwrap(result)).toBe(42);
    });

    it('should throw for Err result', () => {
      const result = Err({ type: 'error' as const });
      expect(() => unwrap(result)).toThrow();
    });
  });

  describe('unwrapOr', () => {
    it('should return value for Ok result', () => {
      const result = Ok(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it('should return default for Err result', () => {
      const result = Err({ type: 'error' as const });
      expect(unwrapOr(result, 0)).toBe(0);
    });
  });

  describe('map', () => {
    it('should transform Ok value', () => {
      const result = Ok(42);
      const mapped = map(result, (x) => x * 2);
      expect(isOk(mapped) && mapped.value).toBe(84);
    });

    it('should preserve Err', () => {
      const result = Err({ type: 'error' as const });
      const mapped = map(result, (x: number) => x * 2);
      expect(isErr(mapped)).toBe(true);
    });
  });

  describe('mapErr', () => {
    it('should preserve Ok', () => {
      const result = Ok(42);
      const mapped = mapErr(result, () => ({ type: 'new-error' as const }));
      expect(isOk(mapped) && mapped.value).toBe(42);
    });

    it('should transform Err', () => {
      const result = Err({ type: 'error' as const });
      const mapped = mapErr(result, () => ({ type: 'new-error' as const }));
      expect(isErr(mapped) && mapped.error.type).toBe('new-error');
    });
  });

  describe('isOk and isErr', () => {
    it('should correctly identify Ok', () => {
      const result = Ok(42);
      expect(isOk(result)).toBe(true);
      expect(isErr(result)).toBe(false);
    });

    it('should correctly identify Err', () => {
      const result = Err({ type: 'error' as const });
      expect(isOk(result)).toBe(false);
      expect(isErr(result)).toBe(true);
    });
  });

  describe('combine', () => {
    it('should combine all Ok results', () => {
      const results = [Ok(1), Ok(2), Ok(3)];
      const combined = combine(results);
      expect(isOk(combined) && combined.value).toEqual([1, 2, 3]);
    });

    it('should return first Err', () => {
      const results = [Ok(1), Err({ type: 'error' as const }), Ok(3)];
      const combined = combine(results);
      expect(isErr(combined)).toBe(true);
    });
  });
});
