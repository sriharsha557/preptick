# Implementation Plan: MockPrep

## Overview

This implementation plan breaks down the MockPrep exam preparation platform into discrete coding tasks. The system will be built incrementally, starting with core data models and authentication, then adding syllabus management, test generation with RAG integration, test execution, evaluation, feedback, and finally performance tracking. Each task builds on previous work, with property-based testing integrated throughout to validate functionality early.

The implementation uses TypeScript with Fastify for the backend API, React for the frontend, Prisma for database management, and fast-check for property-based testing. The RAG layer uses vector embeddings for semantic search over syllabus-aligned questions.

## Tasks

- [x] 1. Set up project structure and core types
  - Create TypeScript project with necessary dependencies (Fastify for API, Prisma for database, fast-check for property testing)
  - Define core type definitions for all domain models (UserProfile, TestConfiguration, Question, MockTest, etc.)
  - Set up database schema with tables for users, syllabus topics, questions, tests, sessions, evaluations, and reports
  - Configure testing framework (Vitest) with fast-check integration
  - _Requirements: 12.1, 12.2_

- [x] 2. Implement Authentication Service
  - [x] 2.1 Create user registration with profile validation
    - Implement registerUser function with curriculum, grade (1-10), and subject validation
    - Add password hashing and user persistence
    - Validate that grade is between 1 and 10 inclusive
    - Validate that subjects exist for the chosen curriculum and grade
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x]* 2.2 Write property tests for registration validation
    - **Property 1: Registration captures all required fields**
    - **Property 2: Grade validation accepts only valid range**
    - **Property 3: Subject filtering by curriculum and grade**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  
  - [x] 2.3 Implement login and session management
    - Create login function with credential validation
    - Implement JWT token generation and validation
    - Restore user profile on login
    - _Requirements: 1.5_
  
  - [x] 2.4 Implement profile retrieval and updates
    - Create getUserProfile and updateProfile functions
    - Add profile persistence and retrieval logic
    - Ensure profile data persists across sessions
    - _Requirements: 1.4, 1.5_
  
  - [x]* 2.5 Write property test for profile persistence
    - **Property 4: User profile persistence round-trip**
    - **Validates: Requirements 1.4, 1.5**

- [x] 3. Implement Syllabus Service
  - [x] 3.1 Create syllabus data models and seed data
    - Define SyllabusTopic model with hierarchical structure
    - Create seed data for CBSE and Cambridge curricula (grades 1-10, multiple subjects)
    - Implement database seeding script
    - Organize topics according to official syllabus structure
    - _Requirements: 2.1, 2.2_
  
  - [x] 3.2 Implement topic filtering by curriculum, grade, and subject
    - Create getTopicsForSubject function with filtering logic
    - Implement hierarchical topic tree construction
    - Ensure only topics matching user's curriculum, grade, and subject are returned
    - _Requirements: 2.1_
  
  - [ ]* 3.3 Write property test for topic filtering
    - **Property 5: Topic filtering by user context**
    - **Validates: Requirements 2.1**
  
  - [x] 3.4 Implement topic validation and selection
    - Create validateTopics function to check topic existence in syllabus
    - Add validation for topic-curriculum-grade consistency
    - Allow selection of one or more topics
    - Validate all selected topics exist in official syllabus
    - _Requirements: 2.3, 2.4_
  
  - [ ]* 3.5 Write property tests for topic validation
    - **Property 6: Non-empty topic selection**
    - **Property 7: Topic validation against syllabus**
    - **Validates: Requirements 2.3, 2.4**

- [x] 4. Checkpoint - Ensure authentication and syllabus services work
  - Ensure all tests pass, ask the user if questions arise.

- [-] 5. Implement Question Bank and RAG Infrastructure
  - [x] 5.1 Set up vector database for question embeddings
    - Configure vector database (using Supabase pgvector)
    - Create embedding generation service using OpenAI embeddings
    - Implement question indexing with syllabus context
    - _Requirements: 13.1, 13.2_
  
  - [x] 5.2 Create question bank seed data
    - Generate sample questions for multiple topics, subjects, and curricula
    - Include all question types (MultipleChoice, ShortAnswer, Numerical)
    - Add syllabus references and correct answers for each question
    - Index questions in vector database
    - Ensure all questions reference specific syllabus sections
    - _Requirements: 13.3_
  
  - [ ]* 5.3 Write property test for question bank references
    - **Property 43: Question bank syllabus references**
    - **Validates: Requirements 13.3**
  
  - [x] 5.4 Implement RAG content retriever
    - Create retrieveQuestions function with semantic search
    - Implement filtering by topics and exclusion of previously used questions
    - Add relevance scoring and ranking
    - Prioritize questions with highest syllabus relevance scores
    - _Requirements: 13.2, 13.5_
  
  - [ ]* 5.5 Write property test for question prioritization
    - **Property 44: Question prioritization by relevance**
    - **Validates: Requirements 13.5**

- [ ] 6. Implement Test Generator
  - [x] 6.1 Create test configuration validation
    - Implement validateConfiguration function for positive integers and topic existence
    - Validate that number of questions is a positive integer
    - Validate that number of tests is a positive integer
    - Add validation for sufficient questions in question bank
    - Store test configuration for test generation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 6.2 Write property tests for configuration validation
    - **Property 8: Test configuration captures all fields**
    - **Property 9: Positive integer validation**
    - **Property 10: Question availability validation**
    - **Property 11: Test configuration persistence round-trip**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
  
  - [x] 6.3 Implement test generation orchestration
    - Create generateTests function that calls RAG retriever
    - Use RAG architecture to retrieve syllabus-aligned content
    - Ensure all questions match selected topics from official syllabus
    - Generate questions at exam-realistic difficulty (no difficulty selection)
    - Implement question uniqueness tracking across multiple tests
    - Generate answer keys with correct answers for each question
    - Persist test configurations and generated tests
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 6.4 Write property tests for test generation
    - **Property 12: Generated questions match selected topics**
    - **Property 13: Question uniqueness across multiple tests**
    - **Property 14: Answer key completeness**
    - **Validates: Requirements 4.2, 4.4, 4.5**
  
  - [x] 6.5 Implement insufficient questions error handling
    - Add error response when question bank lacks sufficient unique questions
    - Notify user and suggest reducing number of tests or questions
    - Include available count and suggested actions in error
    - _Requirements: 14.2_
  
  - [ ]* 6.6 Write property test for insufficient questions handling
    - **Property 45: Insufficient questions error handling**
    - **Validates: Requirements 14.2**

- [ ] 7. Implement LLM Question Generator (fallback)
  - [x] 7.1 Create LLM-based question generation
    - Implement generateQuestions function using LLM API (OpenAI)
    - Use syllabus context as grounding for question generation
    - Ensure exam-realistic difficulty without user selection
    - Avoid duplicating existing questions
    - _Requirements: 4.3_
  
  - [x] 7.2 Implement syllabus alignment validation
    - Create validateSyllabusAlignment function to check generated questions
    - Add validation logic to ensure questions match syllabus content
    - Calculate alignment scores with reasoning
    - _Requirements: 4.2_
  
  - [x] 7.3 Integrate LLM generator as fallback in test generation
    - Modify generateTests to use LLM when RAG retrieval is insufficient
    - Ensure generated questions are indexed for future use
    - Support updates to question bank when syllabi are revised
    - _Requirements: 4.1, 4.2, 13.4_

- [x] 8. Checkpoint - Ensure test generation works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement PDF Generation Service
  - [x] 9.1 Create PDF formatting for test questions
    - Implement generatePDF function using PDFKit library
    - Format questions in standard exam paper layout
    - Exclude answers from test PDF
    - Provide download link to user
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 9.2 Write property tests for PDF generation
    - **Property 15: PDF contains all test questions**
    - **Property 16: Test PDF excludes answers**
    - **Validates: Requirements 5.1, 5.3**
  
  - [x] 9.3 Create answer key PDF generation
    - Implement separate PDF generation for answer keys
    - Include correct answers with question references
    - Make answer key accessible after test completion
    - _Requirements: 5.5_
  
  - [ ]* 9.4 Write property test for answer key PDF
    - **Property 17: Separate answer key PDF exists**
    - **Validates: Requirements 5.5**

- [ ] 10. Implement Test Execution Service
  - [x] 10.1 Create test session management for in-app exams
    - Implement startTest function to create test sessions
    - Display questions in scrollable format or one at a time
    - Provide input mechanisms for different question types (multiple choice, text input)
    - Add session state tracking (InProgress, Submitted)
    - _Requirements: 6.1, 6.2_
  
  - [x] 10.2 Implement answer submission and navigation during test
    - Create submitAnswer function to save user responses with timestamps
    - Allow users to navigate between questions during test
    - Prevent access to hints or answers during test
    - Save all responses for evaluation
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 10.3 Write property tests for test execution
    - **Property 19: Test response persistence**
    - **Property 20: Response timestamps**
    - **Validates: Requirements 6.5, 7.1**
  
  - [x] 10.4 Implement test submission
    - Create submitTest function to finalize test session
    - Save all user responses with timestamps
    - Mark session as submitted and prevent further modifications
    - Make answer key available after submission
    - _Requirements: 7.1, 7.2, 7.4_
  
  - [ ]* 10.5 Write property test for submission controls
    - **Property 22: Response immutability after submission**
    - **Validates: Requirements 7.4**
  
  - [x] 10.6 Implement answer key access and display
    - Add logic to prevent answer key access during active tests
    - Enable answer key access after submission
    - Display both user's answers and correct answers side by side
    - Clearly indicate which answers were correct and incorrect
    - _Requirements: 7.2, 7.3, 7.5_
  
  - [ ]* 10.7 Write property tests for access control
    - **Property 18: Answer key access control during active test**
    - **Property 21: Answer key access after submission**
    - **Validates: Requirements 6.4, 7.2**

- [ ] 11. Implement no-assistance enforcement
  - [x] 11.1 Enforce exam integrity during tests
    - Prevent hints, explanations, or answer suggestions during active tests
    - Prevent access to external resources during in-app exam mode
    - Prevent answer key viewing until after submission
    - Display message that assistance is available only after submission
    - Maintain exam integrity by preventing answer lookup
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [ ]* 11.2 Write property test for no assistance
    - **Property 48: No assistance during active test**
    - **Validates: Requirements 15.1, 15.3, 15.5**

- [ ] 12. Implement Evaluator Service
  - [x] 12.1 Create answer comparison logic
    - Implement compareAnswers function for different question types
    - Handle multiple choice, short answer, and numerical comparisons
    - Add fuzzy matching for short answers (case-insensitive, whitespace-tolerant)
    - _Requirements: 8.1_
  
  - [x] 12.2 Implement test evaluation
    - Create evaluateTest function to compare all responses against answer key
    - Calculate total score as percentage of correct answers
    - Calculate per-topic scores for each topic included in test
    - Identify weak topics where user scored below 60% accuracy
    - Generate performance report after evaluation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 12.3 Write property tests for evaluation
    - **Property 23: Score calculation accuracy**
    - **Property 24: Per-topic score calculation**
    - **Property 25: Weak topic identification threshold**
    - **Property 26: Performance report generation**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5**

- [x] 13. Checkpoint - Ensure evaluation works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement Feedback Engine
  - [x] 13.1 Create performance report generation
    - Implement generatePerformanceReport function
    - Display overall score, per-topic scores, and identified weak topics
    - Rank topics by performance from weakest to strongest
    - Show number of questions attempted and percentage correct for each weak topic
    - Provide report only after test submission, not during test
    - Persist performance reports for historical tracking
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 13.2 Write property tests for performance reports
    - **Property 27: Performance report completeness**
    - **Property 28: Topic ranking by performance**
    - **Property 29: Weak topic data completeness**
    - **Property 30: Report access control timing**
    - **Property 31: Performance report persistence round-trip**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
  
  - [x] 13.3 Implement improvement suggestion generation
    - Create generateImprovementSuggestions function
    - Generate targeted suggestions for each weak topic
    - Suggest specific syllabus sections or concepts to review
    - Reference official syllabus content in suggestions
    - Offer option to generate new mock test focused on weak topics
    - Allow users to create retry tests with same or different topic combinations
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 13.4 Write property tests for improvement suggestions
    - **Property 32: Improvement suggestions for all weak topics**
    - **Property 33: Suggestions contain syllabus references**
    - **Property 34: Retry test option availability**
    - **Property 35: Retry test topic flexibility**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [ ] 14. Implement question tracking and retry tests
  - [x] 14.1 Implement question tracking per user
    - Track which questions have been presented to each user
    - Maintain question variety across tests while ensuring syllabus coverage
    - Ensure no question appears in more than one test for same configuration
    - _Requirements: 14.1, 14.3, 14.5_
  
  - [ ]* 14.2 Write property test for question tracking
    - **Property 46: Question tracking per user**
    - **Validates: Requirements 14.3**
  
  - [x] 14.3 Implement retry test with unseen question prioritization
    - Prioritize questions user has not seen before in retry tests
    - Support retry tests focused on weak topics
    - Allow configuration with same or different topics
    - _Requirements: 14.4, 14.5_
  
  - [ ]* 14.4 Write property test for retry prioritization
    - **Property 47: Retry test prioritizes unseen questions**
    - **Validates: Requirements 14.4**

- [ ] 15. Implement Performance History Service
  - [x] 15.1 Create test history retrieval
    - Implement getTestHistory function with reverse chronological ordering
    - Store all completed tests and their performance reports
    - Display test date, subject, topics covered, and overall score for each test
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [ ]* 15.2 Write property tests for history retrieval
    - **Property 36: Test and report storage**
    - **Property 37: History chronological ordering**
    - **Property 38: History entry completeness**
    - **Validates: Requirements 11.1, 11.2, 11.3**
  
  - [x] 15.3 Implement historical report retrieval
    - Create getPerformanceReport function for historical tests
    - Display complete performance report including all questions and answers
    - Return complete original reports with all data preserved
    - _Requirements: 11.4_
  
  - [ ]* 15.4 Write property test for historical report completeness
    - **Property 39: Historical report completeness**
    - **Validates: Requirements 11.4**
  
  - [x] 15.5 Implement performance trend visualization
    - Create getPerformanceTrends function for subjects and topics
    - Calculate trend data points over time
    - Provide visualizations showing performance trends for each subject and topic
    - Prepare data for chart rendering
    - _Requirements: 11.5_

- [ ] 16. Implement data persistence and session management
  - [x] 16.1 Add comprehensive data persistence
    - Persist user profiles, test configurations, completed tests, and performance reports
    - Ensure all user data persists across sessions
    - Implement logout and login with data restoration
    - Ensure data integrity when storing and retrieving test results
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ]* 16.2 Write property test for session persistence
    - **Property 40: Data persistence across sessions**
    - **Validates: Requirements 12.1, 12.2**
  
  - [x] 16.3 Add timestamps to all significant events
    - Include timestamps for test creation, submission, evaluation
    - Add timestamps to all user actions and responses
    - Store timestamps for all significant events
    - _Requirements: 12.4_
  
  - [ ]* 16.4 Write property test for event timestamps
    - **Property 41: Event timestamps**
    - **Validates: Requirements 12.4**
  
  - [x] 16.5 Implement concurrent access safety
    - Use database transactions for multi-step operations
    - Add optimistic locking for concurrent updates
    - Handle concurrent access to user data without data corruption
    - Ensure data integrity under concurrent access
    - _Requirements: 12.5_
  
  - [ ]* 16.6 Write property test for concurrent access
    - **Property 42: Concurrent access safety**
    - **Validates: Requirements 12.5**

- [x] 17. Checkpoint - Ensure all core functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Implement API endpoints and routing
  - [x] 18.1 Create authentication endpoints
    - POST /api/auth/register - User registration with profile validation
    - POST /api/auth/login - User login with session token
    - GET /api/auth/profile - Get user profile
    - PUT /api/auth/profile - Update user profile
    - POST /api/auth/logout - User logout
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 18.2 Create syllabus endpoints
    - GET /api/syllabus/subjects - Get subjects for curriculum and grade
    - GET /api/syllabus/topics - Get topics for curriculum/grade/subject
    - POST /api/syllabus/validate - Validate topic selection
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4_
  
  - [x] 18.3 Create test generation endpoints
    - POST /api/tests/generate - Generate mock tests with configuration
    - GET /api/tests/:testId - Get test details
    - GET /api/tests/:testId/pdf - Download test PDF
    - GET /api/tests/:testId/answer-key-pdf - Download answer key PDF
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 18.4 Create test execution endpoints
    - POST /api/tests/:testId/start - Start test session
    - POST /api/tests/:testId/answer - Submit answer for question
    - POST /api/tests/:testId/submit - Submit completed test
    - GET /api/tests/:testId/answer-key - Get answer key (after submission only)
    - GET /api/tests/:testId/session - Get current test session state
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 18.5 Create evaluation and feedback endpoints
    - GET /api/tests/:testId/evaluation - Get evaluation results
    - GET /api/tests/:testId/report - Get performance report (after submission only)
    - POST /api/tests/retry - Generate retry test for weak topics
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 18.6 Create history endpoints
    - GET /api/history - Get test history for user (reverse chronological)
    - GET /api/history/:testId - Get historical test details
    - GET /api/history/trends - Get performance trends by subject and topic
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 19. Implement error handling and validation middleware
  - [x] 19.1 Create validation middleware
    - Add request validation for all endpoints using Zod
    - Return descriptive error messages for validation failures
    - Validate grade is between 1-10
    - Validate positive integers for question and test counts
    - Validate topic existence and consistency
    - _Requirements: 1.2, 2.4, 3.2, 3.3, 3.4_
  
  - [x] 19.2 Create error handling middleware
    - Implement global error handler for all error types
    - Format error responses consistently with ErrorResponse type
    - Log errors for monitoring and debugging
    - Include suggested actions in error responses
    - Handle validation, resource, state, and system errors
    - _Requirements: All error handling requirements_
  
  - [x] 19.3 Add authentication middleware
    - Verify JWT tokens on protected endpoints
    - Return 401 for unauthenticated requests
    - Attach user context to authenticated requests
    - _Requirements: 1.5_
  
  - [x] 19.4 Implement retry and recovery logic
    - Add exponential backoff for RAG/LLM calls (max 3 retries)
    - Cache successful responses to reduce API calls
    - Implement fallback behavior for transient failures
    - Use database transactions for multi-step operations
    - Implement idempotency for test submission
    - _Requirements: All system error requirements_

- [ ]* 20. Write integration tests
  - Test complete user workflow: registration → topic selection → test configuration → test generation → test taking → evaluation → feedback
  - Test multi-test generation with question uniqueness verification
  - Test concurrent user access to shared resources
  - Test RAG retrieval and LLM generation pipeline
  - Test PDF generation for various test configurations
  - Test retry test workflow with weak topic focus
  - Test performance history and trend calculation
  - Test error handling for all error categories
  - _Requirements: All requirements_

- [x] 21. Final checkpoint - Complete system validation
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all 48 correctness properties are tested
  - Confirm all requirements are covered by implementation
  - Validate end-to-end workflows function correctly
  - Check error handling for all error scenarios

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check with minimum 100 iterations per test
- Each property test is tagged with: `Feature: mockprep, Property {N}: {property text}`
- Integration tests validate end-to-end workflows
- The implementation uses TypeScript with Fastify (backend) and React (frontend)
- RAG layer uses Supabase pgvector for vector database
- LLM integration uses OpenAI API for question generation
- PDF generation uses PDFKit library
- Authentication uses JWT tokens with bcrypt password hashing
- Database uses Prisma ORM with PostgreSQL
