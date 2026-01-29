# Implementation Plan: MockPrep

## Overview

This implementation plan breaks down the MockPrep exam preparation platform into discrete coding tasks. The system will be built incrementally, starting with core data models and authentication, then adding test generation with RAG integration, test execution, evaluation, feedback, and finally performance tracking. Each task builds on previous work, with testing integrated throughout to validate functionality early.

## Tasks

- [x] 1. Set up project structure and core types
  - Create TypeScript project with necessary dependencies (Express/Fastify for API, Prisma/TypeORM for database, fast-check for property testing)
  - Define core type definitions for all domain models (UserProfile, TestConfiguration, Question, MockTest, etc.)
  - Set up database schema with tables for users, syllabus topics, questions, tests, sessions, evaluations, and reports
  - Configure testing framework (Jest/Vitest) with fast-check integration
  - _Requirements: 12.1, 12.2_

- [ ] 2. Implement Authentication Service
  - [x] 2.1 Create user registration with profile validation
    - Implement registerUser function with curriculum, grade (1-10), and subject validation
    - Add password hashing and user persistence
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 2.2 Write property test for registration validation
    - **Property 1: Registration captures all required fields**
    - **Property 2: Grade validation accepts only valid range**
    - **Validates: Requirements 1.1, 1.2**
  
  - [x] 2.3 Implement login and session management
    - Create login function with credential validation
    - Implement session token generation and validation
    - _Requirements: 1.5_
  
  - [x] 2.4 Implement profile retrieval and updates
    - Create getUserProfile and updateProfile functions
    - Add profile persistence and retrieval logic
    - _Requirements: 1.4, 1.5_
  
  - [ ]* 2.5 Write property test for profile persistence
    - **Property 4: User profile persistence round-trip**
    - **Validates: Requirements 1.4, 1.5**

- [ ] 3. Implement Syllabus Service
  - [x] 3.1 Create syllabus data models and seed data
    - Define SyllabusTopic model with hierarchical structure
    - Create seed data for CBSE and Cambridge curricula (grades 1-10, multiple subjects)
    - Implement database seeding script
    - _Requirements: 2.1, 2.2_
  
  - [x] 3.2 Implement topic filtering by curriculum, grade, and subject
    - Create getTopicsForSubject function with filtering logic
    - Implement hierarchical topic tree construction
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 3.3 Write property tests for topic filtering
    - **Property 3: Subject filtering by curriculum and grade**
    - **Property 5: Topic filtering by user context**
    - **Validates: Requirements 1.3, 2.1**
  
  - [x] 3.3 Implement topic validation
    - Create validateTopics function to check topic existence in syllabus
    - Add validation for topic-curriculum-grade consistency
    - _Requirements: 2.4_
  
  - [ ]* 3.4 Write property test for topic validation
    - **Property 7: Topic validation against syllabus**
    - **Validates: Requirements 2.4**

- [x] 4. Checkpoint - Ensure authentication and syllabus services work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Question Bank and RAG Infrastructure
  - [x] 5.1 Set up vector database for question embeddings
    - Configure vector database (Pinecone, Weaviate, or pgvector)
    - Create embedding generation service using OpenAI/Cohere embeddings
    - Implement question indexing with syllabus context
    - _Requirements: 13.1, 13.2_
  
  - [x] 5.2 Create question bank seed data
    - Generate sample questions for multiple topics, subjects, and curricula
    - Include all question types (MultipleChoice, ShortAnswer, Numerical)
    - Add syllabus references and correct answers
    - Index questions in vector database
    - _Requirements: 13.3_
  
  - [ ]* 5.3 Write property test for question bank references
    - **Property 43: Question bank syllabus references**
    - **Validates: Requirements 13.3**
  
  - [~] 5.4 Implement RAG content retriever
    - Create retrieveQuestions function with semantic search
    - Implement filtering by topics and exclusion of previously used questions
    - Add relevance scoring and ranking
    - _Requirements: 13.2, 13.5_
  
  - [ ]* 5.5 Write property test for question prioritization
    - **Property 44: Question prioritization by relevance**
    - **Validates: Requirements 13.5**

- [ ] 6. Implement Test Generator
  - [~] 6.1 Create test configuration validation
    - Implement validateConfiguration function for positive integers and topic existence
    - Add validation for sufficient questions in question bank
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ]* 6.2 Write property tests for configuration validation
    - **Property 8: Test configuration captures all fields**
    - **Property 9: Positive integer validation**
    - **Property 10: Question availability validation**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  
  - [~] 6.3 Implement test generation orchestration
    - Create generateTests function that calls RAG retriever
    - Implement question uniqueness tracking across multiple tests
    - Generate answer keys for each test
    - Persist test configurations and generated tests
    - _Requirements: 4.2, 4.4, 4.5_
  
  - [ ]* 6.4 Write property tests for test generation
    - **Property 11: Test configuration persistence round-trip**
    - **Property 12: Generated questions match selected topics**
    - **Property 13: Question uniqueness across multiple tests**
    - **Property 14: Answer key completeness**
    - **Validates: Requirements 3.5, 4.2, 4.4, 4.5**
  
  - [~] 6.5 Implement insufficient questions error handling
    - Add error response when question bank lacks sufficient unique questions
    - Include available count and suggested actions in error
    - _Requirements: 14.2_
  
  - [ ]* 6.6 Write property test for insufficient questions handling
    - **Property 45: Insufficient questions error handling**
    - **Validates: Requirements 14.2**

- [ ] 7. Implement LLM Question Generator (fallback)
  - [~] 7.1 Create LLM-based question generation
    - Implement generateQuestions function using LLM API (OpenAI/Anthropic)
    - Use syllabus context as grounding for question generation
    - Ensure exam-realistic difficulty without user selection
    - _Requirements: 4.3_
  
  - [~] 7.2 Implement syllabus alignment validation
    - Create validateSyllabusAlignment function to check generated questions
    - Add validation logic to ensure questions match syllabus content
    - _Requirements: 4.2_
  
  - [~] 7.3 Integrate LLM generator as fallback in test generation
    - Modify generateTests to use LLM when RAG retrieval is insufficient
    - Ensure generated questions are indexed for future use
    - _Requirements: 4.1, 4.2_

- [~] 8. Checkpoint - Ensure test generation works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement PDF Generation Service
  - [~] 9.1 Create PDF formatting for test questions
    - Implement generatePDF function using PDF library (PDFKit, jsPDF, or Puppeteer)
    - Format questions in exam paper layout
    - Exclude answers from test PDF
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 9.2 Write property tests for PDF generation
    - **Property 15: PDF contains all test questions**
    - **Property 16: Test PDF excludes answers**
    - **Validates: Requirements 5.1, 5.3**
  
  - [~] 9.3 Create answer key PDF generation
    - Implement separate PDF generation for answer keys
    - Include correct answers with question references
    - _Requirements: 5.5_
  
  - [ ]* 9.4 Write property test for answer key PDF
    - **Property 17: Separate answer key PDF exists**
    - **Validates: Requirements 5.5**
  
  - [~] 9.5 Add PDF download endpoint
    - Create API endpoint to serve generated PDFs
    - Implement download link generation
    - _Requirements: 5.4_

- [ ] 10. Implement Test Execution Service
  - [~] 10.1 Create test session management
    - Implement startTest function to create test sessions
    - Add session state tracking (InProgress, Submitted)
    - _Requirements: 6.1_
  
  - [~] 10.2 Implement answer submission during test
    - Create submitAnswer function to save user responses with timestamps
    - Add navigation support between questions
    - _Requirements: 6.2, 6.3, 6.5_
  
  - [ ]* 10.3 Write property tests for test execution
    - **Property 19: Test response persistence**
    - **Property 20: Response timestamps**
    - **Validates: Requirements 6.5, 7.1**
  
  - [~] 10.4 Implement test submission
    - Create submitTest function to finalize test session
    - Mark session as submitted and prevent further modifications
    - _Requirements: 7.1, 7.4_
  
  - [ ]* 10.5 Write property tests for submission controls
    - **Property 22: Response immutability after submission**
    - **Validates: Requirements 7.4**
  
  - [~] 10.6 Implement answer key access control
    - Add logic to prevent answer key access during active tests
    - Enable answer key access after submission
    - Display user answers alongside correct answers
    - _Requirements: 6.4, 7.2, 7.3, 7.5, 15.1, 15.3, 15.5_
  
  - [ ]* 10.7 Write property tests for access control
    - **Property 18: Answer key access control during active test**
    - **Property 21: Answer key access after submission**
    - **Property 48: No assistance during active test**
    - **Validates: Requirements 6.4, 7.2, 15.1, 15.3, 15.5**

- [ ] 11. Implement Evaluator Service
  - [~] 11.1 Create answer comparison logic
    - Implement compareAnswers function for different question types
    - Handle multiple choice, short answer, and numerical comparisons
    - Add fuzzy matching for short answers (case-insensitive, whitespace-tolerant)
    - _Requirements: 8.1_
  
  - [~] 11.2 Implement test evaluation
    - Create evaluateTest function to compare all responses against answer key
    - Calculate overall score as percentage
    - Calculate per-topic scores
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 11.3 Write property tests for evaluation
    - **Property 23: Score calculation accuracy**
    - **Property 24: Per-topic score calculation**
    - **Validates: Requirements 8.2, 8.3**
  
  - [~] 11.4 Implement weak topic identification
    - Add logic to identify topics with accuracy < 60%
    - Create weak topic data structures with attempt counts
    - _Requirements: 8.4_
  
  - [ ]* 11.5 Write property test for weak topic identification
    - **Property 25: Weak topic identification threshold**
    - **Validates: Requirements 8.4**
  
  - [~] 11.6 Persist evaluation results
    - Save evaluation results to database
    - Associate evaluations with test sessions
    - _Requirements: 8.5_
  
  - [ ]* 11.7 Write property test for evaluation persistence
    - **Property 26: Performance report generation**
    - **Validates: Requirements 8.5**

- [~] 12. Checkpoint - Ensure evaluation works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement Feedback Engine
  - [~] 13.1 Create performance report generation
    - Implement generatePerformanceReport function
    - Include overall score, per-topic scores, and weak topics
    - Rank topics from weakest to strongest
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ]* 13.2 Write property tests for performance reports
    - **Property 27: Performance report completeness**
    - **Property 28: Topic ranking by performance**
    - **Property 29: Weak topic data completeness**
    - **Validates: Requirements 9.1, 9.2, 9.3**
  
  - [~] 13.3 Implement improvement suggestion generation
    - Create generateImprovementSuggestions function
    - Reference syllabus sections and concepts for each weak topic
    - Add retry test option for weak topics
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 13.4 Write property tests for improvement suggestions
    - **Property 32: Improvement suggestions for all weak topics**
    - **Property 33: Suggestions contain syllabus references**
    - **Property 34: Retry test option availability**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
  
  - [~] 13.5 Implement report access control
    - Prevent report access before test submission
    - Enable report access after submission
    - _Requirements: 9.4_
  
  - [ ]* 13.6 Write property test for report access timing
    - **Property 30: Report access control timing**
    - **Validates: Requirements 9.4**
  
  - [~] 13.7 Persist performance reports
    - Save reports to database with timestamps
    - Associate reports with evaluations and tests
    - _Requirements: 9.5_
  
  - [ ]* 13.8 Write property test for report persistence
    - **Property 31: Performance report persistence round-trip**
    - **Validates: Requirements 9.5**

- [ ] 14. Implement retry test functionality
  - [~] 14.1 Create retry test configuration
    - Allow users to configure retry tests with same or different topics
    - Support weak topic focus in retry tests
    - _Requirements: 10.5_
  
  - [ ]* 14.2 Write property test for retry flexibility
    - **Property 35: Retry test topic flexibility**
    - **Validates: Requirements 10.5**
  
  - [~] 14.2 Implement question tracking per user
    - Track which questions each user has seen
    - Prioritize unseen questions in retry tests
    - _Requirements: 14.3, 14.4_
  
  - [ ]* 14.3 Write property tests for question tracking
    - **Property 46: Question tracking per user**
    - **Property 47: Retry test prioritizes unseen questions**
    - **Validates: Requirements 14.3, 14.4**

- [ ] 15. Implement Performance History Service
  - [~] 15.1 Create test history retrieval
    - Implement getTestHistory function with reverse chronological ordering
    - Include test date, subject, topics, and overall score in entries
    - _Requirements: 11.2, 11.3_
  
  - [ ]* 15.2 Write property tests for history retrieval
    - **Property 37: History chronological ordering**
    - **Property 38: History entry completeness**
    - **Validates: Requirements 11.2, 11.3**
  
  - [~] 15.3 Implement historical report retrieval
    - Create getPerformanceReport function for historical tests
    - Return complete original reports with all questions and answers
    - _Requirements: 11.4_
  
  - [ ]* 15.4 Write property test for historical report completeness
    - **Property 39: Historical report completeness**
    - **Validates: Requirements 11.4**
  
  - [~] 15.5 Implement performance trend calculation
    - Create getPerformanceTrends function for subjects and topics
    - Calculate trend data points over time
    - Prepare data for visualization
    - _Requirements: 11.5_
  
  - [~] 15.6 Persist all test and report data
    - Ensure all completed tests and reports are stored
    - Implement efficient queries for history retrieval
    - _Requirements: 11.1_
  
  - [ ]* 15.7 Write property test for test and report storage
    - **Property 36: Test and report storage**
    - **Validates: Requirements 11.1**

- [ ] 16. Implement data persistence and session management
  - [~] 16.1 Add comprehensive data persistence
    - Ensure all user data persists across sessions
    - Implement logout and login with data restoration
    - _Requirements: 12.1, 12.2_
  
  - [ ]* 16.2 Write property test for session persistence
    - **Property 40: Data persistence across sessions**
    - **Validates: Requirements 12.1, 12.2**
  
  - [~] 16.3 Add timestamps to all significant events
    - Include timestamps for test creation, submission, evaluation
    - Add timestamps to all user actions
    - _Requirements: 12.4_
  
  - [ ]* 16.4 Write property test for event timestamps
    - **Property 41: Event timestamps**
    - **Validates: Requirements 12.4**
  
  - [~] 16.5 Implement concurrent access safety
    - Use database transactions for multi-step operations
    - Add optimistic locking for concurrent updates
    - Ensure data integrity under concurrent access
    - _Requirements: 12.5_
  
  - [ ]* 16.6 Write property test for concurrent access
    - **Property 42: Concurrent access safety**
    - **Validates: Requirements 12.5**

- [~] 17. Checkpoint - Ensure all core functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Implement API endpoints and routing
  - [~] 18.1 Create authentication endpoints
    - POST /api/auth/register - User registration
    - POST /api/auth/login - User login
    - GET /api/auth/profile - Get user profile
    - PUT /api/auth/profile - Update user profile
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [~] 18.2 Create syllabus endpoints
    - GET /api/syllabus/topics - Get topics for curriculum/grade/subject
    - POST /api/syllabus/validate - Validate topic selection
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [~] 18.3 Create test generation endpoints
    - POST /api/tests/generate - Generate mock tests
    - GET /api/tests/:testId - Get test details
    - GET /api/tests/:testId/pdf - Download test PDF
    - GET /api/tests/:testId/answer-key-pdf - Download answer key PDF
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [~] 18.4 Create test execution endpoints
    - POST /api/tests/:testId/start - Start test session
    - POST /api/tests/:testId/answer - Submit answer for question
    - POST /api/tests/:testId/submit - Submit completed test
    - GET /api/tests/:testId/answer-key - Get answer key (after submission)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [~] 18.5 Create evaluation and feedback endpoints
    - GET /api/tests/:testId/evaluation - Get evaluation results
    - GET /api/tests/:testId/report - Get performance report
    - POST /api/tests/retry - Generate retry test for weak topics
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [~] 18.6 Create history endpoints
    - GET /api/history - Get test history for user
    - GET /api/history/:testId - Get historical test details
    - GET /api/history/trends - Get performance trends
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 19. Implement error handling and validation middleware
  - [~] 19.1 Create validation middleware
    - Add request validation for all endpoints
    - Return descriptive error messages for validation failures
    - _Requirements: 1.2, 3.2, 3.3, 3.4_
  
  - [~] 19.2 Create error handling middleware
    - Implement global error handler
    - Format error responses consistently
    - Log errors for monitoring
    - _Requirements: All error handling requirements_
  
  - [~] 19.3 Add authentication middleware
    - Verify session tokens on protected endpoints
    - Return 401 for unauthenticated requests
    - _Requirements: 1.5_

- [ ]* 20. Write integration tests
  - Test complete user workflows end-to-end
  - Test registration → test generation → test taking → evaluation → feedback
  - Test multi-test generation with uniqueness
  - Test concurrent user access
  - Test RAG retrieval and LLM generation pipeline
  - _Requirements: All requirements_

- [~] 21. Final checkpoint - Complete system validation
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all 48 correctness properties are tested
  - Confirm all requirements are covered by implementation

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check with minimum 100 iterations
- Each property test is tagged with: `Feature: mockprep, Property {N}: {property text}`
- Integration tests validate end-to-end workflows
- The implementation uses TypeScript throughout
- RAG layer requires vector database setup (Pinecone, Weaviate, or pgvector)
- LLM integration requires API keys for OpenAI or Anthropic
