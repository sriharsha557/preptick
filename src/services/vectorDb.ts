// Vector database initialization and configuration

import { PrismaClient } from '@prisma/client';
import { GroqEmbeddingService, SimpleEmbeddingService, EmbeddingService } from './embedding';
import { InMemoryVectorStore } from './vectorStore';
import { RAGRetrieverImpl } from './ragRetriever';

export interface VectorDbConfig {
  useGroq?: boolean;
  groqApiKey?: string;
}

/**
 * Initialize the vector database system
 */
export async function initializeVectorDb(
  prisma: PrismaClient,
  config: VectorDbConfig = {}
): Promise<{
  embeddingService: EmbeddingService;
  vectorStore: InMemoryVectorStore;
  ragRetriever: RAGRetrieverImpl;
}> {
  // Create embedding service
  let embeddingService: EmbeddingService;
  
  if (config.useGroq && config.groqApiKey) {
    console.log('Initializing GROQ embedding service...');
    embeddingService = new GroqEmbeddingService(config.groqApiKey);
  } else {
    console.log('Initializing simple embedding service (for testing)...');
    embeddingService = new SimpleEmbeddingService();
  }

  // Create vector store
  const vectorStore = new InMemoryVectorStore();

  // Create RAG retriever
  const ragRetriever = new RAGRetrieverImpl(prisma, embeddingService, vectorStore);

  // Index existing questions
  console.log('Indexing existing questions...');
  await ragRetriever.indexAllQuestions();
  console.log(`Indexed ${vectorStore.size()} questions`);

  return {
    embeddingService,
    vectorStore,
    ragRetriever,
  };
}

/**
 * Create a vector database instance with GROQ API
 */
export async function createVectorDbWithGroq(
  prisma: PrismaClient,
  groqApiKey: string
): Promise<{
  embeddingService: EmbeddingService;
  vectorStore: InMemoryVectorStore;
  ragRetriever: RAGRetrieverImpl;
}> {
  return initializeVectorDb(prisma, {
    useGroq: true,
    groqApiKey,
  });
}

/**
 * Create a vector database instance with simple embeddings (for testing)
 */
export async function createVectorDbSimple(
  prisma: PrismaClient
): Promise<{
  embeddingService: EmbeddingService;
  vectorStore: InMemoryVectorStore;
  ragRetriever: RAGRetrieverImpl;
}> {
  return initializeVectorDb(prisma, {
    useGroq: false,
  });
}
