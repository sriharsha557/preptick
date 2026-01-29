// Document Processor - Reads and processes syllabus PDFs for RAG

import fs from 'fs/promises';
import path from 'path';

export interface SyllabusDocument {
  filename: string;
  curriculum: string;
  grade: number;
  subject: string;
  content: string;
  sections: string[];
}

/**
 * Extract curriculum, grade, and subject from filename
 * Example: "CBSE Class 3 Maths Syllabus 2025-26.pdf"
 */
function parseFilename(filename: string): { curriculum: string; grade: number; subject: string } | null {
  // Remove .pdf extension
  const name = filename.replace('.pdf', '');
  
  // Try to match patterns like "CBSE Class 3 Maths" or "Class 4 English"
  const cbseMatch = name.match(/CBSE\s+Class\s+(\d+)\s+(\w+)/i);
  const cambridgeMatch = name.match(/Cambridge\s+(?:Grade|Class)\s+(\d+)\s+(\w+)/i);
  const classMatch = name.match(/Class\s+(\d+)\s+(\w+)/i);
  
  if (cbseMatch) {
    return {
      curriculum: 'CBSE',
      grade: parseInt(cbseMatch[1]),
      subject: cbseMatch[2],
    };
  } else if (cambridgeMatch) {
    return {
      curriculum: 'Cambridge',
      grade: parseInt(cambridgeMatch[1]),
      subject: cambridgeMatch[2],
    };
  } else if (classMatch) {
    // Default to CBSE if curriculum not specified
    return {
      curriculum: 'CBSE',
      grade: parseInt(classMatch[1]),
      subject: classMatch[2],
    };
  }
  
  return null;
}

/**
 * Extract sections from syllabus content
 * Looks for chapter headings, unit titles, etc.
 */
function extractSections(content: string): string[] {
  const sections: string[] = [];
  
  // Look for common section patterns
  const patterns = [
    /Chapter\s+\d+[:\s]+([^\n]+)/gi,
    /Unit\s+\d+[:\s]+([^\n]+)/gi,
    /Topic\s+\d+[:\s]+([^\n]+)/gi,
    /\d+\.\s+([A-Z][^\n]+)/g,
  ];
  
  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].trim().length > 3) {
        sections.push(match[1].trim());
      }
    }
  }
  
  return [...new Set(sections)]; // Remove duplicates
}

/**
 * Read and parse a single PDF file
 */
export async function processPDF(filePath: string): Promise<SyllabusDocument | null> {
  try {
    const filename = path.basename(filePath);
    const metadata = parseFilename(filename);
    
    if (!metadata) {
      console.warn(`Could not parse filename: ${filename}`);
      return null;
    }
    
    // Read PDF file using pdf-parse
    const { PDFParse, VerbosityLevel } = eval('require')('pdf-parse');
    const parser = new PDFParse({ verbosity: VerbosityLevel.ERRORS });
    await parser.load({ url: filePath });
    const content = await parser.getText();
    const sections = extractSections(content);
    
    return {
      filename,
      curriculum: metadata.curriculum,
      grade: metadata.grade,
      subject: metadata.subject,
      content,
      sections,
    };
  } catch (error) {
    console.error(`Error processing PDF ${filePath}:`, error);
    return null;
  }
}

/**
 * Process all PDFs in the documents directory
 */
export async function processDocumentsDirectory(dirPath: string): Promise<SyllabusDocument[]> {
  try {
    const files = await fs.readdir(dirPath);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    
    console.log(`Found ${pdfFiles.length} PDF files in ${dirPath}`);
    
    const documents: SyllabusDocument[] = [];
    
    for (const file of pdfFiles) {
      const filePath = path.join(dirPath, file);
      const doc = await processPDF(filePath);
      
      if (doc) {
        documents.push(doc);
        console.log(`Processed: ${doc.curriculum} Grade ${doc.grade} ${doc.subject}`);
      }
    }
    
    return documents;
  } catch (error) {
    console.error(`Error reading documents directory:`, error);
    return [];
  }
}

/**
 * Create syllabus topics from processed documents
 */
export async function createTopicsFromDocuments(
  documents: SyllabusDocument[],
  prisma: any
): Promise<void> {
  for (const doc of documents) {
    // Create a main topic for the subject
    const mainTopic = await prisma.syllabusTopic.create({
      data: {
        curriculum: doc.curriculum,
        grade: doc.grade,
        subject: doc.subject,
        topicName: `${doc.subject} - Complete Syllabus`,
        syllabusSection: 'Full Syllabus',
        officialContent: doc.content.substring(0, 5000), // Store first 5000 chars
        learningObjectives: JSON.stringify(doc.sections.slice(0, 10)),
      },
    });
    
    console.log(`Created main topic: ${mainTopic.topicName}`);
    
    // Create sub-topics for each section
    for (let i = 0; i < Math.min(doc.sections.length, 20); i++) {
      const section = doc.sections[i];
      
      await prisma.syllabusTopic.create({
        data: {
          curriculum: doc.curriculum,
          grade: doc.grade,
          subject: doc.subject,
          topicName: section,
          syllabusSection: `Section ${i + 1}`,
          officialContent: `Topic from ${doc.filename}: ${section}`,
          learningObjectives: JSON.stringify([section]),
          parentTopicId: mainTopic.id,
        },
      });
    }
    
    console.log(`Created ${Math.min(doc.sections.length, 20)} sub-topics`);
  }
}
