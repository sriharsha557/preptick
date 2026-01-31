# LLM Question Generator

## Overview

The LLM Question Generator is a service that uses the GROQ API (OpenAI-compatible) to generate exam-realistic questions when the RAG (Retrieval-Augmented Generation) system has insufficient questions in the question bank. This serves as a fallback mechanism to ensure test generation always succeeds.

## Key Features

- **Syllabus-Grounded Generation**: Uses syllabus context as grounding to ensure questions align with curriculum
- **Exam-Realistic Difficulty**: Automatically generates questions at appropriate exam difficulty without user selection
- **Duplication Avoidance**: Takes existing questions as input to avoid generating similar questions
- **Multiple Question Types**: Supports MultipleChoice, ShortAnswer, and Numerical question types
- **Alignment Validation**: Can validate generated questions against syllabus content
- **Error Handling**: Gracefully handles API errors and malformed responses

## Requirements Addressed

- **Requirement 4.3**: Generate questions at exam-realistic difficulty without user selection
- **Requirement 4.2**: Ensure all questions match selected topics from official syllabus
- **Requirement 13.4**: Support updates to question bank when syllabi are revised

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Generator                            │
│                                                              │
│  1. Try RAG Retrieval First                                 │
│     ├─ Success: Use retrieved questions                     │
│     └─ Insufficient: Fall back to LLM                       │
│                                                              │
│  2. LLM Question Generation (Fallback)                      │
│     ├─ Get syllabus context                                 │
│     ├─ Generate questions with GROQ API                     │
│     ├─ Validate syllabus alignment                          │
│     └─ Index new questions for future use                   │
└─────────────────────────────────────────────────────────────┘
```

## API Configuration

The service uses the GROQ API with the following configuration:

- **Model**: `llama-3.3-70b-versatile`
- **Temperature**: 0.7 (for generation), 0.3 (for validation)
- **Max Tokens**: 4000
- **Response Format**: JSON object

API key is configured via environment variable:
```bash
GROQ_API_KEY=your_groq_api_key_here
```

## Usage

### Basic Usage

```typescript
import { LLMQuestionGeneratorService } from './services/llmQuestionGenerator';

// Initialize the service
const llmGenerator = new LLMQuestionGeneratorService(
  process.env.GROQ_API_KEY || ''
);

// Define syllabus context
const syllabusContext = {
  topicId: 'topic-math-addition',
  content: 'Addition: Basic arithmetic operation of combining two or more numbers',
  relatedConcepts: ['Single-digit addition', 'Two-digit addition', 'Carrying'],
};

// Generate questions
const result = await llmGenerator.generateQuestions(
  syllabusContext,
  5, // number of questions
  [] // existing questions to avoid duplication
);

if (result.ok) {
  console.log(`Generated ${result.value.length} questions`);
  result.value.forEach(q => {
    console.log(`- ${q.questionText}`);
  });
} else {
  console.error(`Generation failed: ${result.error.message}`);
}
```

### Validate Syllabus Alignment

```typescript
// Validate a question against syllabus
const question = {
  questionId: 'q1',
  topicId: 'topic-math-addition',
  questionText: 'What is 5 + 3?',
  questionType: 'MultipleChoice',
  options: ['6', '7', '8', '9'],
  correctAnswer: '8',
  syllabusReference: 'Single-digit addition',
  difficulty: 'ExamRealistic',
  createdAt: new Date(),
};

const alignmentResult = await llmGenerator.validateSyllabusAlignment(
  question,
  syllabusContext
);

if (alignmentResult.ok) {
  console.log(`Alignment score: ${alignmentResult.value.score}`);
  console.log(`Reasoning: ${alignmentResult.value.reasoning}`);
  console.log(`References: ${alignmentResult.value.syllabusReferences.join(', ')}`);
}
```

### Integration with Test Generator

See `llmQuestionGenerator.example.ts` for a complete example of integrating the LLM generator as a fallback in the test generation workflow.

## Question Generation Process

1. **Prompt Construction**:
   - Include syllabus content and related concepts
   - Specify number of questions needed
   - List existing questions to avoid duplication
   - Define question type requirements

2. **LLM Call**:
   - Send prompt to GROQ API
   - Request JSON-formatted response
   - Use appropriate temperature for creativity vs consistency

3. **Response Parsing**:
   - Parse JSON response
   - Validate response structure
   - Convert to Question objects

4. **Post-Processing**:
   - Assign unique question IDs
   - Set difficulty to 'ExamRealistic'
   - Add timestamps
   - Validate question count

## Question Types

### MultipleChoice
```json
{
  "questionText": "What is 5 + 3?",
  "questionType": "MultipleChoice",
  "options": ["6", "7", "8", "9"],
  "correctAnswer": "8",
  "syllabusReference": "Single-digit addition"
}
```

### ShortAnswer
```json
{
  "questionText": "Explain the concept of carrying in addition",
  "questionType": "ShortAnswer",
  "correctAnswer": "Carrying is when the sum of digits exceeds 9...",
  "syllabusReference": "Carrying in addition"
}
```

### Numerical
```json
{
  "questionText": "Calculate 12 + 15",
  "questionType": "Numerical",
  "correctAnswer": "27",
  "syllabusReference": "Two-digit addition"
}
```

## Error Handling

The service handles various error scenarios:

- **API Errors**: Network issues, rate limits, authentication failures
- **Empty Responses**: No content returned from LLM
- **Invalid JSON**: Malformed JSON in response
- **Malformed Structure**: Missing required fields in response
- **Insufficient Questions**: LLM generates fewer questions than requested

All errors are returned as `Result<T, GenerationError>` for type-safe error handling.

## Testing

The service includes comprehensive unit tests covering:

- Question generation with various configurations
- Syllabus context grounding
- Exam-realistic difficulty enforcement
- Duplication avoidance
- Different question types
- Error handling scenarios
- API parameter validation

Run tests:
```bash
npm test -- src/services/llmQuestionGenerator.test.ts
```

## Performance Considerations

- **API Latency**: LLM calls typically take 2-5 seconds
- **Rate Limits**: GROQ API has rate limits; implement retry logic if needed
- **Cost**: Each API call has a cost; use RAG retrieval as primary method
- **Caching**: Consider caching generated questions for reuse

## Best Practices

1. **Use as Fallback**: Always try RAG retrieval first, use LLM only when insufficient
2. **Validate Alignment**: Check alignment scores before accepting generated questions
3. **Index New Questions**: Save generated questions to database and vector store
4. **Monitor Quality**: Regularly review generated questions for quality
5. **Handle Errors**: Implement proper error handling and logging
6. **Batch Generation**: Generate multiple questions per API call to reduce latency

## Future Enhancements

- [ ] Support for more question types (True/False, Fill-in-the-blank)
- [ ] Fine-tuning on curriculum-specific data
- [ ] Difficulty level control (while maintaining exam-realistic default)
- [ ] Multi-language support for different curricula
- [ ] Question quality scoring and filtering
- [ ] Automatic question bank enrichment

## Related Files

- `src/services/llmQuestionGenerator.ts` - Main implementation
- `src/services/llmQuestionGenerator.test.ts` - Unit tests
- `src/services/llmQuestionGenerator.example.ts` - Integration example
- `src/services/interfaces.ts` - Service interfaces
- `src/types/index.ts` - Type definitions

## References

- [GROQ API Documentation](https://console.groq.com/docs)
- [Design Document](../../.kiro/specs/mockprep/design.md)
- [Requirements Document](../../.kiro/specs/mockprep/requirements.md)
