# Requirements Document: MockPrep

## Introduction

MockPrep is an exam preparation platform designed for CBSE and Cambridge students in grades 1-10. The system enables students to practice with exam-realistic mock tests that align with their curriculum syllabus, receive post-test feedback, and track their performance over time. The platform uses a RAG + LLM architecture to ensure syllabus adherence and generate appropriate questions.

## Glossary

- **System**: The MockPrep platform
- **Student**: A registered user who takes mock tests
- **Curriculum**: Either CBSE or Cambridge educational framework
- **Mock_Test**: A collection of exam-realistic questions for assessment
- **Test_Configuration**: Parameters defining a mock test (subject, topics, question count, test count)
- **Test_Mode**: Either Printable_PDF or In_App_Exam
- **Answer_Key**: Correct answers for a completed mock test
- **Performance_Report**: Analysis of test results including scores and weak topics
- **Weak_Topic**: A topic where the student scored below proficiency threshold
- **Question_Bank**: RAG-indexed repository of syllabus-aligned questions
- **Syllabus**: Official curriculum content for a specific grade and subject

## Requirements

### Requirement 1: User Registration and Profile Management

**User Story:** As a student, I want to register with my curriculum, grade, and subjects, so that I receive appropriate exam content.

#### Acceptance Criteria

1. WHEN a new user registers, THE System SHALL collect curriculum type (CBSE or Cambridge), grade (1-10), and at least one subject
2. WHEN a user provides registration information, THE System SHALL validate that the grade is between 1 and 10 inclusive
3. WHEN a user selects subjects, THE System SHALL only present subjects available for their chosen curriculum and grade
4. THE System SHALL persist user profile information for future sessions
5. WHEN a registered user logs in, THE System SHALL restore their profile including curriculum, grade, and subject preferences

### Requirement 2: Syllabus-Aligned Topic Selection

**User Story:** As a student, I want to select specific topics from my syllabus, so that I can focus my practice on relevant content.

#### Acceptance Criteria

1. WHEN a user views available topics, THE System SHALL display only topics that belong to the user's curriculum, grade, and selected subject
2. THE System SHALL organize topics according to the official syllabus structure for the user's curriculum
3. WHEN a user selects topics for a mock test, THE System SHALL allow selection of one or more topics
4. THE System SHALL validate that all selected topics exist in the official syllabus for the user's curriculum and grade

### Requirement 3: Mock Test Configuration

**User Story:** As a student, I want to configure my mock test parameters, so that I can customize my practice session.

#### Acceptance Criteria

1. WHEN a user configures a mock test, THE System SHALL accept subject, topic selection, number of questions, and number of tests to generate
2. WHEN a user specifies number of questions, THE System SHALL validate that the value is a positive integer
3. WHEN a user specifies number of tests, THE System SHALL validate that the value is a positive integer
4. THE System SHALL validate that sufficient questions exist in the Question_Bank for the selected topics and requested quantity
5. WHEN configuration is complete, THE System SHALL store the Test_Configuration for test generation

### Requirement 4: Question Generation with Syllabus Adherence

**User Story:** As a student, I want exam-realistic questions that match my syllabus, so that my practice reflects actual assessment standards.

#### Acceptance Criteria

1. WHEN the System generates questions, THE System SHALL use the RAG architecture to retrieve syllabus-aligned content
2. WHEN the System generates questions, THE System SHALL ensure all questions match the selected topics from the official Syllabus
3. THE System SHALL generate questions at exam-realistic difficulty without allowing difficulty selection
4. WHEN generating multiple tests, THE System SHALL ensure each test contains unique questions
5. THE System SHALL include correct answers for each generated question in the Answer_Key

### Requirement 5: Printable PDF Test Mode

**User Story:** As a student, I want to download my mock test as a PDF, so that I can practice offline on paper.

#### Acceptance Criteria

1. WHEN a user selects Printable_PDF mode, THE System SHALL generate a formatted PDF document containing all test questions
2. THE System SHALL format the PDF to resemble standard exam paper layout
3. THE System SHALL exclude answers from the test PDF
4. WHEN the PDF is generated, THE System SHALL provide a download link to the user
5. THE System SHALL generate a separate Answer_Key PDF that can be accessed after test completion

### Requirement 6: In-App Exam Mode

**User Story:** As a student, I want to take tests directly in the application, so that I can practice in a digital exam environment.

#### Acceptance Criteria

1. WHEN a user selects In_App_Exam mode, THE System SHALL display questions one at a time or in a scrollable format
2. THE System SHALL provide input mechanisms appropriate for the question type (multiple choice, text input, etc.)
3. THE System SHALL allow users to navigate between questions during the test
4. THE System SHALL prevent access to hints or answers during the test
5. WHEN a user completes the test, THE System SHALL save all responses for evaluation

### Requirement 7: Test Submission and Answer Key Access

**User Story:** As a student, I want to submit my completed test and view the answer key, so that I can check my responses.

#### Acceptance Criteria

1. WHEN a user submits a completed test, THE System SHALL save all user responses with timestamps
2. WHEN a test is submitted, THE System SHALL make the Answer_Key available to the user
3. THE System SHALL display both the user's answers and correct answers side by side
4. THE System SHALL prevent modification of responses after submission
5. WHEN displaying the Answer_Key, THE System SHALL clearly indicate which answers were correct and incorrect

### Requirement 8: Automated Test Evaluation

**User Story:** As a student, I want my test to be automatically evaluated, so that I receive immediate scoring.

#### Acceptance Criteria

1. WHEN a test is submitted, THE System SHALL compare user responses against the Answer_Key
2. THE System SHALL calculate the total score as a percentage of correct answers
3. THE System SHALL calculate per-topic scores for each topic included in the test
4. THE System SHALL identify Weak_Topics where the user scored below 60% accuracy
5. WHEN evaluation is complete, THE System SHALL generate a Performance_Report

### Requirement 9: Performance Feedback and Weak Topic Identification

**User Story:** As a student, I want detailed feedback on my performance, so that I understand my strengths and weaknesses.

#### Acceptance Criteria

1. WHEN a Performance_Report is generated, THE System SHALL display overall score, per-topic scores, and identified Weak_Topics
2. THE System SHALL rank topics by performance from weakest to strongest
3. WHEN displaying Weak_Topics, THE System SHALL show the number of questions attempted and percentage correct for each topic
4. THE System SHALL provide the Performance_Report only after test submission, not during the test
5. THE System SHALL persist Performance_Reports for historical tracking

### Requirement 10: Targeted Improvement Suggestions

**User Story:** As a student, I want specific improvement suggestions for my weak topics, so that I know how to improve.

#### Acceptance Criteria

1. WHEN Weak_Topics are identified, THE System SHALL generate targeted improvement suggestions for each weak topic
2. THE System SHALL suggest specific syllabus sections or concepts to review for each Weak_Topic
3. THE System SHALL offer the option to generate a new mock test focused on Weak_Topics
4. WHEN generating improvement suggestions, THE System SHALL reference official syllabus content
5. THE System SHALL allow users to create retry tests with the same or different topic combinations

### Requirement 11: Performance History Tracking

**User Story:** As a student, I want to view my historical performance, so that I can track my improvement over time.

#### Acceptance Criteria

1. THE System SHALL store all completed tests and their Performance_Reports
2. WHEN a user views performance history, THE System SHALL display tests in reverse chronological order
3. THE System SHALL show test date, subject, topics covered, and overall score for each historical test
4. WHEN a user selects a historical test, THE System SHALL display the complete Performance_Report including all questions and answers
5. THE System SHALL provide visualizations showing performance trends over time for each subject and topic

### Requirement 12: Data Persistence and Session Management

**User Story:** As a student, I want my data to be saved reliably, so that I don't lose my progress or history.

#### Acceptance Criteria

1. THE System SHALL persist user profiles, test configurations, completed tests, and performance reports
2. WHEN a user logs out and logs back in, THE System SHALL restore all user data
3. THE System SHALL ensure data integrity when storing and retrieving test results
4. WHEN the System stores test data, THE System SHALL include timestamps for all significant events
5. THE System SHALL handle concurrent access to user data without data corruption

### Requirement 13: Syllabus Content Management via RAG

**User Story:** As a system administrator, I want the system to maintain accurate syllabus content, so that questions remain aligned with official curricula.

#### Acceptance Criteria

1. THE System SHALL maintain a RAG-indexed Question_Bank containing syllabus-aligned questions for both CBSE and Cambridge curricula
2. WHEN retrieving questions, THE System SHALL use RAG to ensure semantic alignment with selected topics
3. THE System SHALL validate that all questions in the Question_Bank reference specific syllabus sections
4. THE System SHALL support updates to the Question_Bank when syllabi are revised
5. WHEN generating questions, THE System SHALL prioritize questions with the highest syllabus relevance scores

### Requirement 14: Question Uniqueness and Test Variety

**User Story:** As a student, I want each mock test to have different questions, so that I can practice with varied content.

#### Acceptance Criteria

1. WHEN generating multiple tests with the same configuration, THE System SHALL ensure no question appears in more than one test
2. WHEN insufficient unique questions exist, THE System SHALL notify the user and suggest reducing the number of tests or questions
3. THE System SHALL track which questions have been presented to each user
4. WHEN a user requests a retry test, THE System SHALL prioritize questions the user has not seen before
5. THE System SHALL maintain question variety across tests while ensuring syllabus coverage

### Requirement 15: No In-Test Assistance

**User Story:** As a student, I want an exam-realistic environment without hints, so that I can assess my true knowledge.

#### Acceptance Criteria

1. THE System SHALL NOT provide hints, explanations, or answer suggestions during an active test
2. THE System SHALL NOT allow access to external resources or reference materials during In_App_Exam mode
3. THE System SHALL prevent users from viewing the Answer_Key until after test submission
4. WHEN a user attempts to access help during a test, THE System SHALL display a message that assistance is available only after submission
5. THE System SHALL maintain exam integrity by preventing answer lookup during active tests
