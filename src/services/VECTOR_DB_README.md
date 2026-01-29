# Vector Database for Question Embeddings

This directory contains the implementation of the vector database system for MockPrep's question retrieval using RAG (Retrieval-Augmented Generation).

## Overview

The vector database system enables semantic search over the question bank, allowing the system to retrieve relevant questions based on syllabus context. It consists of three main components:

1. **Embedding Service**: Generates vector embeddings for questions and syllabus content
2. **Vector Store**: In-memory storage with cosine similarity search
3. **RAG Retriever**: Orchestrates question retrieval using embeddings and syllabus context

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     RAG Retriever                           │
│  - Orchestrates question retrieval                          │
│  - Manages syllabus context                                 │
│  - Filters by topics and exclusions                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────────┐
│ Embedding      │  │ Vector Store    │
│ Service        │  │ - In-memory     │
│ - GROQ API     │  │ - Cosine sim    │
│ - Simple hash  │  │ - Filtering     │
└────────────────┘  └─────────────────┘
```

## Components

### 1. Embedding Service (`embedding.ts`)

Generates vector embeddings for text content.

**Implementations:**
- `GroqEmbeddingService`: Uses GROQ API for high-quality embeddings
- `SimpleEmbeddingService`: Hash-based embeddings for testing/development

**Usage:**
```typescript
import { GroqEmbeddingService } from './embedding';

const service = new GroqEmbeddingService(apiKey);
const embedding = await service.generateTextEmbedding('Sample text');
```

### 2. Vector Store (`vectorStore.ts`)

In-memory vector database with cosine similarity search.

**Features:**
- Add/remove vector entries
- Semantic search with similarity scoring
- Filtering by metadata
- Topic-based retrieval

**Usage:**
```typescript
import { InMemoryVectorStore } from './vectorStore';

const store = new InMemoryVectorStore();
await store.add({
  id: 'q1',
  embedding: [0.1, 0.2, ...],
  metadata: { questionId: 'q1', topicId: 't1' }
});

const results = await store.search(queryEmbedding, {
  topK: 10,
  minSimilarity: 0.5
});
```

### 3. RAG Retriever (`ragRetriever.ts`)

High-level interface for question retrieval.

**Features:**
- Retrieve questions by topics
- Exclude previously used questions
- Syllabus context integration
- Question indexing

**Usage:**
```typescript
import { RAGRetrieverImpl } from './ragRetriever';

const retriever = new RAGRetrieverImpl(prisma, embeddingService, vectorStore);

// Retrieve questions
const result = await retriever.retrieveQuestions(
  ['topic1', 'topic2'],  // Topics
  10,                     // Count
  ['q1', 'q2']           // Exclude IDs
);
```

## Initialization

### With GROQ API (Production)

```typescript
import { createVectorDbWithGroq } from './vectorDb';

const { embeddingService, vectorStore, ragRetriever } = 
  await createVectorDbWithGroq(prisma, groqApiKey);
```

### With Simple Embeddings (Testing)

```typescript
import { createVectorDbSimple } from './vectorDb';

const { embeddingService, vectorStore, ragRetriever } = 
  await createVectorDbSimple(prisma);
```

## Configuration

### Environment Variables

```bash
# GROQ API Key (optional - uses simple embeddings if not provided)
GROQ_API_KEY=gsk_your_api_key_here
```

### Embedding Dimensions

- GROQ/OpenAI: 1536 dimensions (text-embedding-ada-002)
- Simple: 384 dimensions (configurable)

## Cosine Similarity

The vector store uses cosine similarity to measure the semantic similarity between vectors:

```
similarity = (A · B) / (||A|| × ||B||)
```

Where:
- A · B is the dot product
- ||A|| and ||B|| are the magnitudes

**Similarity Range:**
- 1.0: Identical vectors
- 0.0: Orthogonal (unrelated)
- -1.0: Opposite vectors

## Question Indexing

Questions are automatically indexed when the vector database is initialized. To index new questions:

```typescript
const question: Question = {
  questionId: 'q1',
  topicId: 't1',
  questionText: 'What is 2 + 2?',
  questionType: 'Numerical',
  correctAnswer: '4',
  syllabusReference: 'Basic Addition',
  difficulty: 'ExamRealistic',
  createdAt: new Date(),
};

await ragRetriever.indexQuestion(question);
```

## Retrieval Strategy

The RAG retriever uses the following strategy:

1. **Get Syllabus Context**: Retrieve syllabus content for requested topics
2. **Generate Query Embedding**: Create embeddings for syllabus contexts and average them
3. **Semantic Search**: Find questions with similar embeddings
4. **Filter**: Apply topic and exclusion filters
5. **Rank**: Sort by similarity score
6. **Return**: Return top K questions

## Performance Considerations

### In-Memory Storage
- Fast retrieval (O(n) for search, where n = number of questions)
- Limited by available RAM
- Suitable for MVP with moderate question banks (<100k questions)

### Future Improvements
- Persistent vector database (Pinecone, Weaviate, pgvector)
- Approximate nearest neighbor search (HNSW, IVF)
- Batch indexing for large question banks
- Caching of frequently used embeddings

## Testing

### Unit Tests
```bash
npm test -- src/services/vectorStore.test.ts
npm test -- src/services/embedding.test.ts
```

### Integration Tests
```bash
npm test -- src/services/ragRetriever.test.ts
```

### Test Coverage
- Cosine similarity calculations
- Vector store operations (add, search, filter)
- Embedding generation (deterministic and API-based)
- Question retrieval with various filters
- Syllabus context integration

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 13.1**: RAG-indexed Question Bank with syllabus-aligned questions
- **Requirement 13.2**: RAG retrieval for semantic alignment with selected topics
- **Requirement 13.5**: Question prioritization by syllabus relevance scores

## API Reference

See `vectorDb.example.ts` for comprehensive usage examples.

## Troubleshooting

### GROQ API Errors
- Verify API key is correct
- Check API rate limits
- Fallback to simple embeddings if API is unavailable

### Low Similarity Scores
- Adjust `minSimilarity` threshold in search options
- Verify question and syllabus content quality
- Consider using GROQ embeddings instead of simple embeddings

### Insufficient Questions
- Add more questions to the question bank
- Reduce the number of requested questions
- Expand topic selection

## Future Enhancements

1. **Persistent Storage**: Migrate to pgvector or external vector DB
2. **Hybrid Search**: Combine semantic and keyword search
3. **Question Clustering**: Group similar questions for better coverage
4. **Adaptive Retrieval**: Learn from user interactions to improve relevance
5. **Multi-modal Embeddings**: Support images and diagrams in questions
