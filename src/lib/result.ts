// Utility functions for working with Result types

import { Result, Ok, Err } from '../types';

/**
 * Unwrap a Result, throwing an error if it's an Err
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.value;
  }
  throw new Error(`Unwrap failed: ${JSON.stringify(result.error)}`);
}

/**
 * Unwrap a Result or return a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Map a Result's value
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return Ok(fn(result.value));
  }
  return result;
}

/**
 * Map a Result's error
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (!result.success) {
    return Err(fn(result.error));
  }
  return result;
}

/**
 * Chain Result operations (flatMap)
 */
export async function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, E>>
): Promise<Result<U, E>> {
  if (result.success) {
    return fn(result.value);
  }
  return result;
}

/**
 * Check if a Result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; value: T } {
  return result.success;
}

/**
 * Check if a Result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Wrap a function that might throw in a Result
 */
export async function tryCatch<T, E>(
  fn: () => Promise<T>,
  onError: (error: unknown) => E
): Promise<Result<T, E>> {
  try {
    const value = await fn();
    return Ok(value);
  } catch (error) {
    return Err(onError(error));
  }
}

/**
 * Combine multiple Results into one
 */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (!result.success) {
      return result;
    }
    values.push(result.value);
  }
  return Ok(values);
}
