// Script to index syllabus documents into the database

import { PrismaClient } from '@prisma/client';
import path from 'path';
import { processDocumentsDirectory, createTopicsFromDocuments } from '../src/services/documentProcessor';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting document indexing...\n');
  
  // Path to documents folder
  const documentsPath = path.join(process.cwd(), 'documents');
  
  // Process all PDFs
  console.log('Processing PDF documents...');
  const documents = await processDocumentsDirectory(documentsPath);
  
  if (documents.length === 0) {
    console.log('No documents found to process.');
    return;
  }
  
  console.log(`\nProcessed ${documents.length} documents:`);
  documents.forEach(doc => {
    console.log(`  - ${doc.curriculum} Grade ${doc.grade} ${doc.subject} (${doc.sections.length} sections)`);
  });
  
  // Ask user if they want to add to database
  console.log('\nCreating topics in database...');
  
  try {
    await createTopicsFromDocuments(documents, prisma);
    console.log('\n✅ Successfully indexed all documents!');
  } catch (error) {
    console.error('\n❌ Error creating topics:', error);
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
