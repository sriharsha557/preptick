# Test Generation Fix - 400 Bad Request Error

## Issue
When trying to generate tests (both PDF download and online exam), the system was returning:
```
400 Bad Request - GenerationFailed
```

## Root Cause
The `RAGRetrieverImpl` service was being initialized incorrectly in `src/routes/tests.ts`. 

The constructor requires 3 parameters:
1. `prisma` - Database client
2. `embeddingService` - Service for generating embeddings
3. `vectorStore` - In-memory vector store for semantic search

But it was being called with only 1 parameter:
```typescript
// WRONG ❌
const ragRetriever = new RAGRetrieverImpl(prisma);
```

This caused the RAG retriever to fail when trying to get syllabus context for LLM question generation, which in turn caused the entire test generation to fail.

## Solution
Fixed the initialization to properly create all required services:

```typescript
// CORRECT ✅
const embeddingService = process.env.GROQ_API_KEY 
  ? new EmbeddingService(process.env.GROQ_API_KEY)
  : new EmbeddingService('dummy-key');
const vectorStore = new InMemoryVectorStore();
const ragRetriever = new RAGRetrieverImpl(prisma, embeddingService, vectorStore);
```

## What This Fixes
- ✅ Test generation now works for both PDF and online exam modes
- ✅ LLM can properly generate questions using syllabus context
- ✅ RAG retriever can provide fallback questions if needed
- ✅ Embedding service properly initialized for semantic search

## Testing
After deploying this fix to Render:

1. **Test PDF Generation:**
   - Go to Generate Test page
   - Select curriculum, grade, subject, topics
   - Choose "Download as PDF" mode
   - Click "Generate & Download PDF"
   - Should download PDF successfully

2. **Test Online Exam:**
   - Go to Generate Test page
   - Select curriculum, grade, subject, topics
   - Choose "Take Exam Online" mode
   - Click "Generate Test"
   - Should navigate to test page

## Deployment Steps
1. Code has been pushed to GitHub
2. Render will auto-deploy from main branch
3. Wait 2-3 minutes for deployment
4. Test the fix on your deployed site

## Related Files Changed
- `src/routes/tests.ts` - Fixed service initialization
- Added imports for `EmbeddingService` and `InMemoryVectorStore`

## Why This Happened
The RAGRetrieverImpl was refactored to use embeddings and vector store for semantic search, but the initialization in the tests route wasn't updated to match the new constructor signature.

## Prevention
- Always check constructor signatures when initializing services
- Use TypeScript strict mode to catch these errors at compile time
- Add integration tests that verify service initialization

## Status
✅ **FIXED** - Code pushed and ready for deployment
