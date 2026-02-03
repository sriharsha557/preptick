// Service interfaces for MockPrep

import {
  UserId,
  TestId,
  QuestionId,
  TopicId,
  SessionId,
  UserProfile,
  Credentials,
  Session,
  ProfileUpdates,
  Topic,
  SyllabusContent,
  TestConfiguration,
  GeneratedTests,
  Question,
  TestSession,
  UserAnswer,
  TestSubmission,
  AnswerKey,
  EvaluationResult,
  PerformanceReport,
  WeakTopic,
  ImprovementSuggestion,
  TestHistoryEntry,
  PerformanceTrend,
  SyllabusContext,
  AlignmentScore,
  PDFDocument,
  Curriculum,
  Subject,
  QuestionType,
  Result,
  RegistrationError,
  AuthError,
  NotFoundError,
  UpdateError,
  ValidationError,
  ConfigError,
  GenerationError,
  StartError,
  SubmitError,
  PDFError,
  RetrievalError,
  IndexError,
  TopicScore,
} from '../types';

// ============================================================================
// Authentication Service
// ============================================================================

export interface AuthenticationService {
  registerUser(profile: Omit<UserProfile, 'userId' | 'createdAt' | 'lastLogin'> & { password: string }): Promise<Result<UserId, RegistrationError>>;
  login(credentials: Credentials): Promise<Result<Session, AuthError>>;
  validateSession(token: string): Promise<Result<UserId, AuthError>>;
  getUserProfile(userId: UserId): Promise<Result<UserProfile, NotFoundError>>;
  updateProfile(userId: UserId, updates: ProfileUpdates): Promise<Result<void, UpdateError>>;
}

// ============================================================================
// Syllabus Service
// ============================================================================

export interface SyllabusService {
  getTopicsForSubject(curriculum: Curriculum, grade: number, subject: Subject): Promise<Topic[]>;
  validateTopics(curriculum: Curriculum, grade: number, topics: TopicId[]): Promise<Result<void, ValidationError>>;
  getSyllabusContent(topicId: TopicId): Promise<SyllabusContent>;
}

// ============================================================================
// Test Generator
// ============================================================================

export interface TestGenerator {
  generateTests(config: TestConfiguration, userId: UserId): Promise<Result<GeneratedTests, GenerationError>>;
  validateConfiguration(config: TestConfiguration): Promise<Result<void, ConfigError>>;
}

// ============================================================================
// RAG Content Retriever
// ============================================================================

export interface RAGRetriever {
  retrieveQuestions(
    topics: TopicId[],
    count: number,
    excludeIds: QuestionId[]
  ): Promise<Result<Question[], RetrievalError>>;
  
  getSyllabusContext(topicId: TopicId): Promise<SyllabusContext>;
  
  indexQuestion(question: Question): Promise<Result<void, IndexError>>;
}

// ============================================================================
// Question Generator (LLM-based)
// ============================================================================

export interface QuestionGenerator {
  generateQuestions(
    syllabusContext: SyllabusContext,
    count: number,
    existingQuestions: Question[],
    subject?: string,
    testMode?: 'InAppExam' | 'PDFDownload'
  ): Promise<Result<Question[], GenerationError>>;

  validateSyllabusAlignment(
    question: Question,
    syllabusContext: SyllabusContext
  ): Promise<Result<AlignmentScore, ValidationError>>;
}

// ============================================================================
// Test Execution Service
// ============================================================================

export interface TestExecutionService {
  startTest(testId: TestId, userId: UserId): Promise<Result<TestSession, StartError>>;
  submitAnswer(sessionId: SessionId, questionId: QuestionId, answer: UserAnswer): Promise<Result<void, SubmitError>>;
  submitTest(sessionId: SessionId): Promise<Result<TestSubmission, SubmitError>>;
  generatePDF(testId: TestId, includeAnswers: boolean): Promise<Result<PDFDocument, PDFError>>;
}

// ============================================================================
// Evaluator
// ============================================================================

export interface Evaluator {
  evaluateTest(submission: TestSubmission, answerKey: AnswerKey): Promise<EvaluationResult>;
  compareAnswers(userAnswer: string, correctAnswer: string, questionType: QuestionType): boolean;
}

// ============================================================================
// Feedback Engine
// ============================================================================

export interface FeedbackEngine {
  generatePerformanceReport(evaluation: EvaluationResult, testId: TestId): Promise<PerformanceReport>;
  identifyWeakTopics(topicScores: TopicScore[], threshold: number): WeakTopic[];
  generateImprovementSuggestions(weakTopics: WeakTopic[]): Promise<ImprovementSuggestion[]>;
}

// ============================================================================
// Performance History Service
// ============================================================================

export interface PerformanceHistoryService {
  getTestHistory(userId: UserId): Promise<TestHistoryEntry[]>;
  getPerformanceReport(testId: TestId): Promise<Result<PerformanceReport, NotFoundError>>;
  getPerformanceTrends(userId: UserId, subject: Subject): Promise<PerformanceTrend[]>;
}
