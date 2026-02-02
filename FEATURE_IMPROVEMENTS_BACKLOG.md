# Feature Improvements & Bug Fixes Backlog

**Date:** February 1, 2026  
**Status:** Pending Implementation  
**Priority:** High

---

## Overview

This document tracks user-reported issues and feature requests for the PrepTick platform. Items are prioritized based on impact and complexity.

---

## 🔴 Critical Issues (Fix Immediately)

### 1. Submit Test API Error
**Issue:** Test submission fails due to API error  
**Impact:** Users cannot complete tests  
**Priority:** P0 - Critical

**Current Behavior:**
- API call fails when submitting test
- Error prevents test completion
- User loses progress

**Expected Behavior:**
- Test submission should succeed
- Results should be saved
- User should see evaluation

**Technical Details:**
- Likely related to database connection pool timeout
- May need to investigate `/api/tests/submit` endpoint
- Check Prisma connection handling

**Files to Check:**
- `src/routes/tests.ts` - Submit test endpoint
- `src/services/testExecution.ts` - Test submission logic
- `src/services/evaluator.ts` - Evaluation logic

**Estimated Effort:** 2-4 hours

---

## 🟡 High Priority Features

### 2. Grade Mismatch in Test Generation
**Issue:** Test generation doesn't default to user's profile grade  
**Impact:** Users must manually select grade each time  
**Priority:** P1 - High

**Current Behavior:**
- Grade defaults to a fixed value (likely 10)
- Ignores user profile grade

**Expected Behavior:**
- Should auto-populate from user profile
- User can override if needed

**Implementation:**
- Fetch user profile on GenerateTestPage load
- Pre-fill grade field with `profile.grade`
- Keep field editable

**Files to Modify:**
- `src/pages/GenerateTestPage.tsx` - Add profile fetch and default

**Estimated Effort:** 1-2 hours

---

### 3. PDF Topic Accuracy
**Issue:** Selected topics not accurately reflected in PDF heading  
**Impact:** Confusion about test content  
**Priority:** P1 - High

**Current Behavior:**
- PDF heading doesn't match selected topics
- May show generic heading or wrong topics

**Expected Behavior:**
- PDF heading should list all selected topics
- Format: "Topics: Algebra, Geometry, Trigonometry"

**Implementation:**
- Update PDF generation to include topic names
- Format topics list in header

**Files to Modify:**
- `src/services/pdfGenerator.ts` - Update header generation

**Estimated Effort:** 1-2 hours

---

### 4. Separate Answer Key PDF
**Issue:** Questions and answers in same PDF  
**Impact:** Students can see answers while taking test  
**Priority:** P1 - High

**Current Behavior:**
- Single PDF with questions and optional answers
- `includeAnswers` parameter controls visibility

**Expected Behavior:**
- Two separate PDFs:
  1. Question paper (for students)
  2. Answer key (for teachers/parents)
- Download both or choose one

**Implementation:**
- Modify PDF generation to create two documents
- Update API to return both PDFs
- Update UI to show two download buttons

**Files to Modify:**
- `src/services/pdfGenerator.ts` - Generate two PDFs
- `src/routes/tests.ts` - Return both PDFs
- `src/pages/GenerateTestPage.tsx` - Two download buttons

**Estimated Effort:** 4-6 hours

---

### 5. Solution Steps in Answer Key
**Issue:** Answer key only shows final answers  
**Impact:** Students can't learn from mistakes  
**Priority:** P1 - High

**Current Behavior:**
- Answer key shows: "Answer: 42"
- No explanation or steps

**Expected Behavior:**
- Answer key shows:
  - Correct answer
  - Step-by-step solution
  - Explanation of concept

**Implementation:**
- Add `solutionSteps` field to Question model
- LLM should generate solution steps
- Include in answer key PDF

**Database Changes:**
```prisma
model Question {
  // ... existing fields
  solutionSteps String? // Step-by-step solution
}
```

**Files to Modify:**
- `prisma/schema.prisma` - Add solutionSteps field
- `src/services/llmQuestionGenerator.ts` - Generate solutions
- `src/services/pdfGenerator.ts` - Include solutions in answer key

**Estimated Effort:** 6-8 hours

---

### 6. Balanced Question Distribution
**Issue:** Questions not evenly distributed across topics  
**Impact:** Some topics over-represented, others under-represented  
**Priority:** P1 - High

**Current Behavior:**
- If 3 topics selected with 15 questions
- Distribution might be: 10, 3, 2 (unbalanced)

**Expected Behavior:**
- Even distribution: 5, 5, 5
- Or proportional based on topic weight

**Implementation:**
- Calculate questions per topic: `totalQuestions / topicCount`
- Ensure each topic gets fair share
- Handle remainders (distribute extra questions)

**Files to Modify:**
- `src/services/testGenerator.ts` - Update question selection logic

**Estimated Effort:** 2-3 hours

---

### 7. Multiple Answer Selection
**Issue:** Cannot select multiple correct answers for questions  
**Impact:** Limits question types (e.g., "Select all that apply")  
**Priority:** P2 - Medium

**Current Behavior:**
- Only single-choice questions supported
- One correct answer per question

**Expected Behavior:**
- Support multiple-choice questions
- Multiple correct answers possible
- Partial credit for partial correctness

**Implementation:**
- Add `allowMultipleAnswers` field to Question
- Update answer validation logic
- Update UI to show checkboxes instead of radio buttons

**Database Changes:**
```prisma
model Question {
  // ... existing fields
  allowMultipleAnswers Boolean @default(false)
  correctAnswers String[] // Array of correct answers
}
```

**Files to Modify:**
- `prisma/schema.prisma` - Add multiple answer support
- `src/services/evaluator.ts` - Update scoring logic
- `src/pages/TakeTestPage.tsx` - Update UI for multiple selection

**Estimated Effort:** 8-10 hours

---

### 8. Relevance of Math Questions
**Issue:** Math exams include open-ended/explanatory questions  
**Impact:** Not suitable for quantitative assessment  
**Priority:** P1 - High

**Current Behavior:**
- LLM generates mix of question types
- Includes "Explain why..." or "Describe..." questions

**Expected Behavior:**
- Math exams should focus on:
  - Numerical problems
  - Calculations
  - Problem-solving
  - Multiple choice with numerical answers

**Implementation:**
- Update LLM prompt for math subjects
- Specify question type requirements
- Filter out non-quantitative questions

**Files to Modify:**
- `src/services/llmQuestionGenerator.ts` - Update prompts for math

**Example Prompt Addition:**
```
For mathematics subjects, generate only:
- Numerical calculation problems
- Multiple choice with numerical answers
- Problem-solving questions requiring calculations
- NO explanatory or descriptive questions
```

**Estimated Effort:** 2-3 hours

---

## 🟢 Medium Priority Improvements

### 9. Line Spacing in Answer Key
**Issue:** Poor line spacing makes answer key hard to read/print  
**Impact:** Reduced readability  
**Priority:** P2 - Medium

**Current Behavior:**
- Tight line spacing
- Cramped appearance

**Expected Behavior:**
- Better line spacing (1.5x or 2x)
- Clear separation between questions
- Print-friendly format

**Implementation:**
- Adjust PDF line height
- Add spacing between questions
- Improve margins

**Files to Modify:**
- `src/services/pdfGenerator.ts` - Adjust spacing parameters

**Estimated Effort:** 1-2 hours

---

### 10. Student Personalization in PDF
**Issue:** PDFs are generic, not personalized  
**Impact:** Less engaging for students  
**Priority:** P2 - Medium

**Current Behavior:**
- PDF shows: "Mock Test - Mathematics"
- No student information

**Expected Behavior:**
- PDF header includes:
  - Student name
  - Grade/Class
  - Date
  - Test ID
- Example: "Mathematics Test - Class 10 - John Doe - Feb 1, 2026"

**Implementation:**
- Pass user profile to PDF generator
- Include in header
- Optional: Add footer with student ID

**Files to Modify:**
- `src/services/pdfGenerator.ts` - Add personalization
- `src/routes/tests.ts` - Pass user info to generator

**Estimated Effort:** 2-3 hours

---

## Implementation Priority

### Phase 1: Critical Fixes (Week 1)
1. ✅ Fix database connection pool (DONE)
2. Submit Test API Error
3. Grade Mismatch
4. PDF Topic Accuracy

### Phase 2: High Priority Features (Week 2-3)
5. Separate Answer Key PDF
6. Solution Steps in Answer Key
7. Balanced Question Distribution
8. Relevance of Math Questions

### Phase 3: Medium Priority (Week 4)
9. Line Spacing in Answer Key
10. Student Personalization in PDF

### Phase 4: Future Enhancements
11. Multiple Answer Selection (requires more work)

---

## Estimated Total Effort

- **Critical Issues:** 4-8 hours
- **High Priority:** 24-32 hours
- **Medium Priority:** 5-8 hours
- **Total:** 33-48 hours (approximately 1-2 weeks)

---

## Technical Debt to Address

While implementing these features, also address:

1. **Connection Pool Management**
   - Add proper connection pool configuration
   - Implement connection retry logic
   - Monitor connection usage

2. **Error Handling**
   - Better error messages for users
   - Proper error logging
   - Graceful degradation

3. **Testing**
   - Add tests for new features
   - Integration tests for PDF generation
   - E2E tests for test submission flow

4. **Performance**
   - Optimize PDF generation (currently synchronous)
   - Cache topic lists
   - Reduce database queries

---

## Notes

- All features should be backward compatible
- Maintain existing API contracts
- Add feature flags for gradual rollout
- Document all changes in CHANGELOG.md

---

## Next Steps

1. **Immediate:** Fix database connection pool issue
2. **This Week:** Implement Phase 1 fixes
3. **Next Week:** Start Phase 2 features
4. **Ongoing:** Monitor production for new issues

---

## Questions for Product Owner

1. **Answer Key Format:** Should solution steps be detailed or brief?
2. **Multiple Answers:** Should this be automatic or teacher-configurable?
3. **Personalization:** Should student name be optional (privacy)?
4. **Question Distribution:** Strict equal distribution or allow some variance?

---

## Success Metrics

Track these metrics after implementation:

- Test submission success rate (target: >99%)
- User satisfaction with PDF quality
- Time spent on test generation page
- Number of tests generated per user
- PDF download rate (questions vs answers)

---

**Last Updated:** February 1, 2026  
**Next Review:** February 8, 2026
