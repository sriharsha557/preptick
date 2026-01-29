// Core domain types for MockPrep

// ============================================================================
// Basic Types
// ============================================================================

export type UserId = string;
export type TestId = string;
export type QuestionId = string;
export type TopicId = string;
export type SessionId = string;
export type EvaluationId = string;
export type ReportId = string;
export type Timestamp = Date;

export type Curriculum = 'CBSE' | 'Cambridge';
export type Subject = string;
export type QuestionType = 'MultipleChoice' | 'ShortAnswer' | 'Numerical';
export type TestMode = 'PrintablePDF' | 'InAppExam';
export type TestStatus = 'Generated' | 'InProgress' | 'Submitted';
export type SessionStatus = 'InProgress' | 'Submitted';

// ============================================================================
// User Profile
// ============================================================================

export type UserProfile = {
  userId: UserId;
  email: string;
  curriculum: Curriculum;
  grade: number; // 1-10
  subjects: Subject[];
  createdAt: Timestamp;
  lastLogin: Timestamp;
};

export type Credentials = {
  email: string;
  password: string;
};

export type Session = {
  userId: UserId;
  token: string;
  expiresAt: Timestamp;
};

export type ProfileUpdates = Partial<{
  curriculum: Curriculum;
  grade: number;
  subjects: Subject[];
}>;

// ============================================================================
// Syllabus
// ============================================================================

export type Topic = {
  topicId: TopicId;
  name: string;
  parentTopic?: TopicId;
  syllabusSection: string;
  curriculum: Curriculum;
  grade: number;
  subject: Subject;
};

export type SyllabusContent = {
  topicId: TopicId;
  officialText: string;
  learningObjectives: string[];
  keyTerms: string[];
};

export type SyllabusTopic = {
  topicId: TopicId;
  curriculum: Curriculum;
  grade: number;
  subject: Subject;
  topicName: string;
  parentTopicId?: TopicId;
  syllabusSection: string;
  officialContent: string;
  learningObjectives: string[];
};

// ============================================================================
// Questions
// ============================================================================

export type Question = {
  questionId: QuestionId;
  topicId: TopicId;
  questionText: string;
  questionType: QuestionType;
  options?: string[]; // for multiple choice
  correctAnswer: string;
  syllabusReference: string;
  difficulty: 'ExamRealistic';
  createdAt: Timestamp;
};

export type AnswerKey = {
  testId: TestId;
  answers: Map<QuestionId, string>;
};

// ============================================================================
// Test Configuration and Generation
// ============================================================================

export type TestConfiguration = {
  subject: Subject;
  topics: TopicId[];
  questionCount: number;
  testCount: number;
  mode: TestMode;
};

export type MockTest = {
  testId: TestId;
  userId: UserId;
  subject: Subject;
  topics: TopicId[];
  questions: Question[];
  mode: TestMode;
  status: TestStatus;
  createdAt: Timestamp;
};

export type GeneratedTests = {
  tests: MockTest[];
  answerKeys: AnswerKey[];
};

// ============================================================================
// Test Execution
// ============================================================================

export type TestSession = {
  sessionId: SessionId;
  testId: TestId;
  userId: UserId;
  startedAt: Timestamp;
  submittedAt?: Timestamp;
  responses: Map<QuestionId, UserAnswer>;
  status: SessionStatus;
};

export type UserAnswer = {
  questionId: QuestionId;
  answer: string;
  answeredAt: Timestamp;
};

export type TestSubmission = {
  sessionId: SessionId;
  testId: TestId;
  responses: Map<QuestionId, UserAnswer>;
  submittedAt: Timestamp;
};

// ============================================================================
// Evaluation and Feedback
// ============================================================================

export type EvaluationResult = {
  evaluationId: EvaluationId;
  testId: TestId;
  userId: UserId;
  overallScore: number; // percentage
  correctCount: number;
  totalCount: number;
  topicScores: TopicScore[];
  evaluatedAt: Timestamp;
};

export type TopicScore = {
  topicId: TopicId;
  topicName: string;
  correct: number;
  total: number;
  percentage: number;
};

export type WeakTopic = {
  topicId: TopicId;
  topicName: string;
  score: number;
  questionsAttempted: number;
  questionsCorrect: number;
};

export type ImprovementSuggestion = {
  topicId: TopicId;
  syllabusSection: string;
  conceptsToReview: string[];
  retryTestOption: boolean;
};

export type PerformanceReport = {
  reportId: ReportId;
  testId: TestId;
  userId: UserId;
  evaluationId: EvaluationId;
  evaluation: EvaluationResult;
  weakTopics: WeakTopic[];
  suggestions: ImprovementSuggestion[];
  createdAt: Timestamp;
};

// ============================================================================
// Performance History
// ============================================================================

export type TestHistoryEntry = {
  testId: TestId;
  testDate: Timestamp;
  subject: Subject;
  topics: TopicId[];
  overallScore: number;
};

export type PerformanceTrend = {
  subject: Subject;
  topicId?: TopicId;
  dataPoints: TrendDataPoint[];
};

export type TrendDataPoint = {
  date: Timestamp;
  score: number;
  testId: TestId;
};

// ============================================================================
// RAG and LLM
// ============================================================================

export type SyllabusContext = {
  topicId: TopicId;
  content: string;
  relatedConcepts: string[];
};

export type AlignmentScore = {
  score: number; // 0-1
  reasoning: string;
  syllabusReferences: string[];
};

// ============================================================================
// PDF Generation
// ============================================================================

export type PDFDocument = {
  buffer: Buffer;
  filename: string;
};

// ============================================================================
// Error Types
// ============================================================================

export type RegistrationError =
  | { type: 'InvalidGrade'; grade: number }
  | { type: 'InvalidSubject'; subject: string }
  | { type: 'DuplicateUser' }
  | { type: 'ValidationError'; message: string };

export type AuthError =
  | { type: 'InvalidCredentials' }
  | { type: 'UserNotFound' }
  | { type: 'SessionExpired' };

export type ValidationError = {
  type: 'ValidationError';
  field: string;
  message: string;
};

export type NotFoundError = {
  type: 'NotFound';
  resource: string;
  id: string;
};

export type GenerationError =
  | { type: 'InsufficientQuestions'; available: number; requested: number }
  | { type: 'InvalidConfiguration'; reason: string }
  | { type: 'RAGError'; message: string }
  | { type: 'LLMError'; message: string };

export type ConfigError =
  | { type: 'InvalidQuestionCount'; value: number }
  | { type: 'InvalidTestCount'; value: number }
  | { type: 'InvalidTopics'; topics: TopicId[] }
  | { type: 'EmptyTopicSelection' };

export type StateError =
  | { type: 'TestAlreadySubmitted'; testId: TestId }
  | { type: 'TestNotSubmitted'; testId: TestId }
  | { type: 'AnswerKeyNotAccessible'; reason: string };

export type UpdateError = {
  type: 'UpdateFailed';
  reason: string;
};

export type StartError = {
  type: 'StartFailed';
  reason: string;
};

export type SubmitError = {
  type: 'SubmitFailed';
  reason: string;
};

export type PDFError = {
  type: 'PDFGenerationFailed';
  reason: string;
};

export type RetrievalError =
  | { type: 'InsufficientMatches'; found: number; requested: number }
  | { type: 'VectorDBError'; message: string };

export type IndexError = {
  type: 'IndexFailed';
  reason: string;
};

// ============================================================================
// Result Type (for error handling)
// ============================================================================

export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

// Helper functions for Result type
export const Ok = <T, E>(value: T): Result<T, E> => ({
  success: true,
  value,
});

export const Err = <T, E>(error: E): Result<T, E> => ({
  success: false,
  error,
});
