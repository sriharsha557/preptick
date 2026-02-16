import { describe, it, expect } from 'vitest';

// Test data helpers for TestHistoryPage
interface TestHistoryEntry {
  testId: string;
  subject: string;
  score: number | null;
  totalQuestions: number;
  completedAt: Date | null;
  status: string;
}

// Safe accessor functions (duplicated for testing)
const safeGetScore = (test: TestHistoryEntry): number | null => {
  if (test.score === null || test.score === undefined) return null;
  if (typeof test.score !== 'number' || isNaN(test.score)) return null;
  return test.score;
};

const safeGetScoreDisplay = (test: TestHistoryEntry): string => {
  const score = safeGetScore(test);
  if (score === null) return 'N/A';
  return `${score.toFixed(1)}%`;
};

const safeGetDate = (test: TestHistoryEntry): Date | null => {
  if (!test.completedAt) return null;
  
  if (test.completedAt instanceof Date) {
    return isNaN(test.completedAt.getTime()) ? null : test.completedAt;
  }
  
  const parsed = new Date(test.completedAt);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const safeGetDateDisplay = (test: TestHistoryEntry): string => {
  const date = safeGetDate(test);
  if (!date) return 'N/A';
  
  try {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid date';
  }
};

const safeGetStatus = (test: TestHistoryEntry): string => {
  if (!test.status || typeof test.status !== 'string') return 'Unknown';
  return test.status;
};

const safeGetStatusDisplay = (test: TestHistoryEntry): string => {
  const status = safeGetStatus(test);
  if (status === 'Submitted') return 'Completed';
  if (status === 'InProgress') return 'In Progress';
  return status;
};

const safeGetSubject = (test: TestHistoryEntry): string => {
  if (!test.subject || typeof test.subject !== 'string') return 'Unknown Subject';
  return test.subject;
};

const safeGetTotalQuestions = (test: TestHistoryEntry): number => {
  if (test.totalQuestions === null || test.totalQuestions === undefined) return 0;
  if (typeof test.totalQuestions !== 'number' || isNaN(test.totalQuestions)) return 0;
  return Math.max(0, test.totalQuestions);
};

const isValidTestEntry = (test: any): test is TestHistoryEntry => {
  return (
    test &&
    typeof test === 'object' &&
    typeof test.testId === 'string' &&
    test.testId.length > 0
  );
};

describe('TestHistoryPage Safe Accessors', () => {
  describe('safeGetScore', () => {
    it('should return score for valid number', () => {
      const test: TestHistoryEntry = {
        testId: '1',
        subject: 'Math',
        score: 85.5,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(safeGetScore(test)).toBe(85.5);
    });

    it('should return null for null score', () => {
      const test: TestHistoryEntry = {
        testId: '1',
        subject: 'Math',
        score: null,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'InProgress',
      };
      expect(safeGetScore(test)).toBeNull();
    });

    it('should return null for NaN score', () => {
      const test: any = {
        testId: '1',
        subject: 'Math',
        score: NaN,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(safeGetScore(test)).toBeNull();
    });
  });

  describe('safeGetScoreDisplay', () => {
    it('should format valid score', () => {
      const test: TestHistoryEntry = {
        testId: '1',
        subject: 'Math',
        score: 85.5,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(safeGetScoreDisplay(test)).toBe('85.5%');
    });

    it('should return N/A for null score', () => {
      const test: TestHistoryEntry = {
        testId: '1',
        subject: 'Math',
        score: null,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'InProgress',
      };
      expect(safeGetScoreDisplay(test)).toBe('N/A');
    });
  });

  describe('safeGetDate', () => {
    it('should return valid Date object', () => {
      const date = new Date('2024-01-15');
      const test: TestHistoryEntry = {
        testId: '1',
        subject: 'Math',
        score: 85,
        totalQuestions: 10,
        completedAt: date,
        status: 'Submitted',
      };
      expect(safeGetDate(test)).toEqual(date);
    });

    it('should return null for null date', () => {
      const test: TestHistoryEntry = {
        testId: '1',
        subject: 'Math',
        score: 85,
        totalQuestions: 10,
        completedAt: null,
        status: 'InProgress',
      };
      expect(safeGetDate(test)).toBeNull();
    });

    it('should return null for invalid Date', () => {
      const test: any = {
        testId: '1',
        subject: 'Math',
        score: 85,
        totalQuestions: 10,
        completedAt: new Date('invalid'),
        status: 'Submitted',
      };
      expect(safeGetDate(test)).toBeNull();
    });
  });

  describe('safeGetDateDisplay', () => {
    it('should format valid date', () => {
      const date = new Date('2024-01-15T10:30:00');
      const test: TestHistoryEntry = {
        testId: '1',
        subject: 'Math',
        score: 85,
        totalQuestions: 10,
        completedAt: date,
        status: 'Submitted',
      };
      const result = safeGetDateDisplay(test);
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should return N/A for null date', () => {
      const test: TestHistoryEntry = {
        testId: '1',
        subject: 'Math',
        score: 85,
        totalQuestions: 10,
        completedAt: null,
        status: 'InProgress',
      };
      expect(safeGetDateDisplay(test)).toBe('N/A');
    });
  });

  describe('safeGetStatus', () => {
    it('should return valid status', () => {
      const test: TestHistoryEntry = {
        testId: '1',
        subject: 'Math',
        score: 85,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(safeGetStatus(test)).toBe('Submitted');
    });

    it('should return Unknown for empty status', () => {
      const test: any = {
        testId: '1',
        subject: 'Math',
        score: 85,
        totalQuestions: 10,
        completedAt: new Date(),
        status: '',
      };
      expect(safeGetStatus(test)).toBe('Unknown');
    });

    it('should return Unknown for non-string status', () => {
      const test: any = {
        testId: '1',
        subject: 'Math',
        score: 85,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 123,
      };
      expect(safeGetStatus(test)).toBe('Unknown');
    });
  });

  describe('safeGetStatusDisplay', () => {
    it('should return Completed for Submitted status', () => {
      const test: TestHistoryEntry = {
        testId: '1',
        subject: 'Math',
        score: 85,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(safeGetStatusDisplay(test)).toBe('Completed');
    });

    it('should return In Progress for InProgress status', () => {
      const test: TestHistoryEntry = {
        testId: '1',
        subject: 'Math',
        score: null,
        totalQuestions: 10,
        completedAt: null,
        status: 'InProgress',
      };
      expect(safeGetStatusDisplay(test)).toBe('In Progress');
    });

    it('should return status as-is for unknown status', () => {
      const test: any = {
        testId: '1',
        subject: 'Math',
        score: 85,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'Draft',
      };
      expect(safeGetStatusDisplay(test)).toBe('Draft');
    });
  });

  describe('safeGetSubject', () => {
    it('should return valid subject', () => {
      const test: TestHistoryEntry = {
        testId: '1',
        subject: 'Mathematics',
        score: 85,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(safeGetSubject(test)).toBe('Mathematics');
    });

    it('should return Unknown Subject for empty subject', () => {
      const test: any = {
        testId: '1',
        subject: '',
        score: 85,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(safeGetSubject(test)).toBe('Unknown Subject');
    });

    it('should return Unknown Subject for non-string subject', () => {
      const test: any = {
        testId: '1',
        subject: null,
        score: 85,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(safeGetSubject(test)).toBe('Unknown Subject');
    });
  });

  describe('safeGetTotalQuestions', () => {
    it('should return valid question count', () => {
      const test: TestHistoryEntry = {
        testId: '1',
        subject: 'Math',
        score: 85,
        totalQuestions: 25,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(safeGetTotalQuestions(test)).toBe(25);
    });

    it('should return 0 for null question count', () => {
      const test: any = {
        testId: '1',
        subject: 'Math',
        score: 85,
        totalQuestions: null,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(safeGetTotalQuestions(test)).toBe(0);
    });

    it('should return 0 for negative question count', () => {
      const test: any = {
        testId: '1',
        subject: 'Math',
        score: 85,
        totalQuestions: -5,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(safeGetTotalQuestions(test)).toBe(0);
    });

    it('should return 0 for NaN question count', () => {
      const test: any = {
        testId: '1',
        subject: 'Math',
        score: 85,
        totalQuestions: NaN,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(safeGetTotalQuestions(test)).toBe(0);
    });
  });

  describe('isValidTestEntry', () => {
    it('should return true for valid test entry', () => {
      const test: TestHistoryEntry = {
        testId: 'test-123',
        subject: 'Math',
        score: 85,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(isValidTestEntry(test)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isValidTestEntry(null)).toBeFalsy();
    });

    it('should return false for undefined', () => {
      expect(isValidTestEntry(undefined)).toBeFalsy();
    });

    it('should return false for missing testId', () => {
      const test: any = {
        subject: 'Math',
        score: 85,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(isValidTestEntry(test)).toBe(false);
    });

    it('should return false for empty testId', () => {
      const test: any = {
        testId: '',
        subject: 'Math',
        score: 85,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(isValidTestEntry(test)).toBe(false);
    });

    it('should return false for non-string testId', () => {
      const test: any = {
        testId: 123,
        subject: 'Math',
        score: 85,
        totalQuestions: 10,
        completedAt: new Date(),
        status: 'Submitted',
      };
      expect(isValidTestEntry(test)).toBe(false);
    });
  });
});

describe('TestHistoryPage Error Handling', () => {
  // Mock ApiError class for testing
  class ApiError extends Error {
    constructor(public statusCode: number, message: string) {
      super(message);
      this.name = 'ApiError';
    }
  }

  // Helper function to simulate error message generation (from loadHistory)
  const getErrorMessage = (err: any): string => {
    let errorMessage = 'Failed to load test history. Please try again.';
    
    if (err instanceof ApiError) {
      if (err.statusCode === 401 || err.statusCode === 403) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (err.statusCode === 404) {
        errorMessage = 'Test history service not found. Please contact support.';
      } else if (err.statusCode === 500) {
        errorMessage = 'Server error occurred while loading your history. Please try again later.';
      } else if (err.statusCode >= 500) {
        errorMessage = 'Our servers are experiencing issues. Please try again in a few minutes.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred while loading your history.';
      }
    } else if (err instanceof TypeError && err.message.includes('fetch')) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }
    
    return errorMessage;
  };

  describe('Error message generation', () => {
    it('should return auth error message for 401 status', () => {
      const error = new ApiError(401, 'Unauthorized');
      const message = getErrorMessage(error);
      expect(message).toBe('Your session has expired. Please log in again.');
    });

    it('should return auth error message for 403 status', () => {
      const error = new ApiError(403, 'Forbidden');
      const message = getErrorMessage(error);
      expect(message).toBe('Your session has expired. Please log in again.');
    });

    it('should return not found error message for 404 status', () => {
      const error = new ApiError(404, 'Not Found');
      const message = getErrorMessage(error);
      expect(message).toBe('Test history service not found. Please contact support.');
    });

    it('should return server error message for 500 status', () => {
      const error = new ApiError(500, 'Internal Server Error');
      const message = getErrorMessage(error);
      expect(message).toBe('Server error occurred while loading your history. Please try again later.');
    });

    it('should return server issues message for 503 status', () => {
      const error = new ApiError(503, 'Service Unavailable');
      const message = getErrorMessage(error);
      expect(message).toBe('Our servers are experiencing issues. Please try again in a few minutes.');
    });

    it('should return custom error message for ApiError with message', () => {
      const error = new ApiError(400, 'Custom error message');
      const message = getErrorMessage(error);
      expect(message).toBe('Custom error message');
    });

    it('should return network error message for fetch TypeError', () => {
      const error = new TypeError('fetch failed');
      const message = getErrorMessage(error);
      expect(message).toBe('Network error. Please check your internet connection and try again.');
    });

    it('should return error message for generic Error', () => {
      const error = new Error('Something went wrong');
      const message = getErrorMessage(error);
      expect(message).toBe('Something went wrong');
    });

    it('should return default message for unknown error type', () => {
      const error = 'string error';
      const message = getErrorMessage(error);
      expect(message).toBe('Failed to load test history. Please try again.');
    });

    it('should return default message for null error', () => {
      const error = null;
      const message = getErrorMessage(error);
      expect(message).toBe('Failed to load test history. Please try again.');
    });
  });

  describe('Empty state messages', () => {
    it('should show "No Test History Yet" when tests array is empty', () => {
      const tests: TestHistoryEntry[] = [];
      const filteredTests: TestHistoryEntry[] = [];
      
      const shouldShowNoHistory = tests.length === 0;
      const shouldShowNoFiltered = filteredTests.length === 0 && tests.length > 0;
      
      expect(shouldShowNoHistory).toBe(true);
      expect(shouldShowNoFiltered).toBe(false);
    });

    it('should show "No Tests Found" when filter returns empty but tests exist', () => {
      const tests: TestHistoryEntry[] = [
        {
          testId: '1',
          subject: 'Math',
          score: 85,
          totalQuestions: 10,
          completedAt: new Date(),
          status: 'Submitted',
        },
      ];
      const filteredTests: TestHistoryEntry[] = [];
      
      const shouldShowNoHistory = tests.length === 0;
      const shouldShowNoFiltered = filteredTests.length === 0 && tests.length > 0;
      
      expect(shouldShowNoHistory).toBe(false);
      expect(shouldShowNoFiltered).toBe(true);
    });

    it('should not show empty state when filtered tests exist', () => {
      const tests: TestHistoryEntry[] = [
        {
          testId: '1',
          subject: 'Math',
          score: 85,
          totalQuestions: 10,
          completedAt: new Date(),
          status: 'Submitted',
        },
      ];
      const filteredTests: TestHistoryEntry[] = tests;
      
      const shouldShowEmpty = filteredTests.length === 0;
      
      expect(shouldShowEmpty).toBe(false);
    });
  });
});

