// Application constants

// Grade range
export const MIN_GRADE = 1;
export const MAX_GRADE = 10;

// Weak topic threshold (percentage)
export const WEAK_TOPIC_THRESHOLD = 60;

// Password requirements
export const MIN_PASSWORD_LENGTH = 8;

// Test configuration limits
export const MIN_QUESTIONS_PER_TEST = 1;
export const MAX_QUESTIONS_PER_TEST = 100;
export const MIN_TESTS_TO_GENERATE = 1;
export const MAX_TESTS_TO_GENERATE = 10;

// JWT expiration (in seconds)
export const JWT_EXPIRATION = 7 * 24 * 60 * 60; // 7 days

// Supported curricula
export const CURRICULA = ['CBSE', 'Cambridge'] as const;

// Question types
export const QUESTION_TYPES = ['MultipleChoice', 'ShortAnswer', 'Numerical'] as const;

// Test modes
export const TEST_MODES = ['PrintablePDF', 'InAppExam'] as const;

// Test statuses
export const TEST_STATUSES = ['Generated', 'InProgress', 'Submitted'] as const;

// Session statuses
export const SESSION_STATUSES = ['InProgress', 'Submitted'] as const;

// Property-based test configuration
export const PBT_NUM_RUNS = 100;
export const PBT_FEATURE_TAG = 'mockprep';
