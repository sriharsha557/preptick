// PDF Generation Service for MockPrep
// Generates formatted PDFs for test questions and answer keys

import PDFDocument from 'pdfkit';
import {
  MockTest,
  PDFDocument as PDFDocumentType,
  PDFError,
  Result,
  Ok,
  Err,
} from '../types';

/**
 * Metadata for PDF generation
 */
interface PDFMetadata {
  title: string;
  subject: string;
  topics: string[];
  grade?: string;
  difficulty?: string;
}

/**
 * Add header to PDF with title, topics, and metadata
 * Requirements: 2.1, 2.2, 2.5
 */
function addHeader(
  doc: PDFKit.PDFDocument,
  metadata: PDFMetadata
): void {
  // Title
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(metadata.title, { align: 'center' });

  doc.moveDown(0.5);

  // Subject
  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Subject: ${metadata.subject}`, { align: 'center' });

  // Topics - format based on count
  // Requirement 2.2: Format as "Topic: X" for single or "Topics: X, Y, Z" for multiple
  // Requirement 2.5: Display in selection order
  const topicsLabel = metadata.topics.length === 1 ? 'Topic' : 'Topics';
  const topicsText = `${topicsLabel}: ${metadata.topics.join(', ')}`;
  doc.text(topicsText, { align: 'center' });

  // Additional metadata if provided
  if (metadata.grade || metadata.difficulty) {
    const metaInfo: string[] = [];
    if (metadata.grade) metaInfo.push(`Grade: ${metadata.grade}`);
    if (metadata.difficulty) metaInfo.push(`Difficulty: ${metadata.difficulty}`);
    doc.text(metaInfo.join(' | '), { align: 'center' });
  }

  doc.moveDown(0.5);
}

/**
 * Add solution steps to PDF
 * Requirements: 4.4, 4.5, 4.6
 */
function addSolutionSteps(
  doc: PDFKit.PDFDocument,
  solutionSteps?: string[]
): void {
  // Handle empty or missing solution steps gracefully (Requirement 4.6)
  if (!solutionSteps || solutionSteps.length === 0) {
    return;
  }

  doc.moveDown(0.3);

  // Solution label
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#2c5282')
    .text('Solution:', { indent: 20 });

  doc.fillColor('black');
  doc.moveDown(0.3);

  // Solution steps with proper numbering and indentation (Requirement 4.5)
  solutionSteps.forEach((step, index) => {
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(`${index + 1}. ${step}`, {
        indent: 40,
        paragraphGap: 5,
      });
    doc.moveDown(0.2);
  });

  doc.moveDown(0.5);
}

/**
 * Generate question paper PDF (without answers)
 * Requirements: 3.1, 3.2
 */
export async function generateQuestionPaper(
  test: MockTest,
  topics: string[]
): Promise<Result<PDFDocumentType, PDFError>> {
  try {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });

    // Collect PDF data in chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Create a promise that resolves when PDF is finished
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Add header with topics
    addHeader(doc, {
      title: 'MOCK EXAMINATION',
      subject: test.configuration.subject,
      topics: topics,
    });

    // Instructions
    doc
      .fontSize(10)
      .font('Helvetica-Oblique')
      .text('Instructions:', { underline: true });

    doc
      .font('Helvetica')
      .text('1. Answer all questions in the space provided or on separate sheets.');

    doc.text('2. Show all working where applicable.');

    doc.text('3. Write clearly and legibly.');

    doc.moveDown(1);

    // Horizontal line
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();

    doc.moveDown(1);

    // Questions WITHOUT answers (Requirement 3.2)
    test.questions.forEach((question, index) => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
      }

      // Question number
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Question ${index + 1}:`, { continued: false });

      doc.moveDown(0.3);

      // Question text
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(question.questionText, {
          align: 'left',
          indent: 20,
        });

      doc.moveDown(0.5);

      // Options for multiple choice questions
      if (question.questionType === 'MultipleChoice' && question.options) {
        question.options.forEach((option, optIndex) => {
          const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D...
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(`${optionLabel}. ${option}`, {
              indent: 40,
            });
          doc.moveDown(0.2);
        });
      }

      // Answer space (NO correct answer shown)
      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .font('Helvetica-Oblique')
        .text('Answer:', { indent: 20 });

      // Draw lines for answer space
      const answerLines = question.questionType === 'ShortAnswer' ? 3 : 1;
      for (let i = 0; i < answerLines; i++) {
        doc.moveDown(0.5);
        const lineY = doc.y;
        doc
          .moveTo(70, lineY)
          .lineTo(545, lineY)
          .stroke();
      }

      doc.moveDown(1.5);
    });

    // Finalize the PDF
    doc.end();

    // Wait for PDF generation to complete
    const buffer = await pdfPromise;

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `mockprep-questions-${test.testId}-${timestamp}.pdf`;

    return Ok({
      buffer,
      filename,
    });
  } catch (error) {
    return Err({
      type: 'PDFGenerationFailed',
      reason: error instanceof Error ? error.message : 'Unknown error during PDF generation',
    });
  }
}

/**
 * Generate answer key PDF (with answers and solutions)
 * Requirements: 3.1, 3.3
 */
export async function generateAnswerKey(
  test: MockTest,
  topics: string[]
): Promise<Result<PDFDocumentType, PDFError>> {
  try {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });

    // Collect PDF data in chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Create a promise that resolves when PDF is finished
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Add header with topics
    addHeader(doc, {
      title: 'ANSWER KEY',
      subject: test.configuration.subject,
      topics: topics,
    });

    // Horizontal line
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();

    doc.moveDown(1);

    // Questions WITH answers and solutions (Requirement 3.3)
    test.questions.forEach((question, index) => {
      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      // Question number
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Question ${index + 1}:`, { continued: false });

      doc.moveDown(0.3);

      // Question text
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(question.questionText, {
          align: 'left',
          indent: 20,
        });

      doc.moveDown(0.5);

      // Options for multiple choice questions
      if (question.questionType === 'MultipleChoice' && question.options) {
        question.options.forEach((option, optIndex) => {
          const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D...
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(`${optionLabel}. ${option}`, {
              indent: 40,
            });
          doc.moveDown(0.2);
        });
      }

      doc.moveDown(0.3);

      // Correct answer
      const correctAnswer = test.answerKey.get(question.questionId);
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('green')
        .text(`Correct Answer: ${correctAnswer || 'N/A'}`, { indent: 20 });

      doc.fillColor('black');

      // Add solution steps (Requirement 4.4)
      // Parse solutionSteps from JSON string if needed
      let solutionSteps: string[] | undefined;
      if (question.solutionSteps) {
        if (typeof question.solutionSteps === 'string') {
          try {
            solutionSteps = JSON.parse(question.solutionSteps);
          } catch {
            solutionSteps = undefined;
          }
        } else if (Array.isArray(question.solutionSteps)) {
          solutionSteps = question.solutionSteps;
        }
      }
      addSolutionSteps(doc, solutionSteps);

      // Syllabus reference
      doc
        .fontSize(8)
        .font('Helvetica-Oblique')
        .fillColor('gray')
        .text(`Reference: ${question.syllabusReference}`, { indent: 20 });

      doc.fillColor('black');
      doc.moveDown(1.5);
    });

    // Finalize the PDF
    doc.end();

    // Wait for PDF generation to complete
    const buffer = await pdfPromise;

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `mockprep-answers-${test.testId}-${timestamp}.pdf`;

    return Ok({
      buffer,
      filename,
    });
  } catch (error) {
    return Err({
      type: 'PDFGenerationFailed',
      reason: error instanceof Error ? error.message : 'Unknown error during PDF generation',
    });
  }
}

/**
 * Generate a PDF document for a mock test
 * @param test - The mock test to generate PDF for
 * @param includeAnswers - Whether to include answers in the PDF
 * @returns Result containing PDF buffer and filename, or error
 */
export async function generatePDF(
  test: MockTest,
  includeAnswers: boolean
): Promise<Result<PDFDocumentType, PDFError>> {
  try {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });

    // Collect PDF data in chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Create a promise that resolves when PDF is finished
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Generate PDF content
    if (includeAnswers) {
      generateAnswerKeyContent(doc, test);
    } else {
      generateTestContent(doc, test);
    }

    // Finalize the PDF
    doc.end();

    // Wait for PDF generation to complete
    const buffer = await pdfPromise;

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const type = includeAnswers ? 'answer-key' : 'test';
    const filename = `mockprep-${type}-${test.testId}-${timestamp}.pdf`;

    return Ok({
      buffer,
      filename,
    });
  } catch (error) {
    return Err({
      type: 'PDFGenerationFailed',
      reason: error instanceof Error ? error.message : 'Unknown error during PDF generation',
    });
  }
}

/**
 * Generate test content (without answers)
 */
function generateTestContent(doc: PDFKit.PDFDocument, test: MockTest): void {
  const { configuration, questions } = test;

  // Header
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('MOCK EXAMINATION', { align: 'center' });

  doc.moveDown(0.5);

  // Test information
  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Subject: ${configuration.subject}`, { align: 'center' });

  doc
    .text(`Topics: ${configuration.topics.join(', ')}`, { align: 'center' });

  doc.moveDown(0.5);

  // Instructions
  doc
    .fontSize(10)
    .font('Helvetica-Oblique')
    .text('Instructions:', { underline: true });

  doc
    .font('Helvetica')
    .text('1. Answer all questions in the space provided or on separate sheets.');

  doc.text('2. Show all working where applicable.');

  doc.text('3. Write clearly and legibly.');

  doc.moveDown(1);

  // Horizontal line
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc.moveDown(1);

  // Questions
  questions.forEach((question, index) => {
    // Check if we need a new page
    if (doc.y > 700) {
      doc.addPage();
    }

    // Question number
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(`Question ${index + 1}:`, { continued: false });

    doc.moveDown(0.3);

    // Question text
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(question.questionText, {
        align: 'left',
        indent: 20,
      });

    doc.moveDown(0.5);

    // Options for multiple choice questions
    if (question.questionType === 'MultipleChoice' && question.options) {
      question.options.forEach((option, optIndex) => {
        const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D...
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`${optionLabel}. ${option}`, {
            indent: 40,
          });
        doc.moveDown(0.2);
      });
    }

    // Answer space
    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .text('Answer:', { indent: 20 });

    // Draw lines for answer space
    const answerLines = question.questionType === 'ShortAnswer' ? 3 : 1;
    for (let i = 0; i < answerLines; i++) {
      doc.moveDown(0.5);
      const lineY = doc.y;
      doc
        .moveTo(70, lineY)
        .lineTo(545, lineY)
        .stroke();
    }

    doc.moveDown(1.5);
  });
}

/**
 * Generate test with answer key on separate pages
 * First generates the test questions, then adds answer key on new page(s)
 */
function generateAnswerKeyContent(doc: PDFKit.PDFDocument, test: MockTest): void {
  const { configuration, questions, answerKey } = test;

  // First, generate the test content (questions without answers)
  // Header
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('MOCK EXAMINATION', { align: 'center' });

  doc.moveDown(0.5);

  // Test information
  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Subject: ${configuration.subject}`, { align: 'center' });

  doc
    .text(`Topics: ${configuration.topics.join(', ')}`, { align: 'center' });

  doc.moveDown(0.5);

  // Instructions
  doc
    .fontSize(10)
    .font('Helvetica-Oblique')
    .text('Instructions:', { underline: true });

  doc
    .font('Helvetica')
    .text('1. Answer all questions in the space provided or on separate sheets.');

  doc.text('2. Show all working where applicable.');

  doc.text('3. Write clearly and legibly.');

  doc.moveDown(1);

  // Horizontal line
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc.moveDown(1);

  // Questions (without answers)
  questions.forEach((question, index) => {
    // Check if we need a new page
    if (doc.y > 700) {
      doc.addPage();
    }

    // Question number
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(`Question ${index + 1}:`, { continued: false });

    doc.moveDown(0.3);

    // Question text
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(question.questionText, {
        align: 'left',
        indent: 20,
      });

    doc.moveDown(0.5);

    // Options for multiple choice questions
    if (question.questionType === 'MultipleChoice' && question.options) {
      question.options.forEach((option, optIndex) => {
        const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D...
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`${optionLabel}. ${option}`, {
            indent: 40,
          });
        doc.moveDown(0.2);
      });
    }

    // Answer space
    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .text('Answer:', { indent: 20 });

    // Draw lines for answer space
    const answerLines = question.questionType === 'ShortAnswer' ? 3 : 1;
    for (let i = 0; i < answerLines; i++) {
      doc.moveDown(0.5);
      const lineY = doc.y;
      doc
        .moveTo(70, lineY)
        .lineTo(545, lineY)
        .stroke();
    }

    doc.moveDown(1.5);
  });

  // Add new page for Answer Key
  doc.addPage();

  // Answer Key Header
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('ANSWER KEY', { align: 'center' });

  doc.moveDown(0.5);

  // Test information
  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Subject: ${configuration.subject}`, { align: 'center' });

  doc.moveDown(1);

  // Horizontal line
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc.moveDown(1);

  // Answer key entries (compact format)
  questions.forEach((question, index) => {
    // Check if we need a new page
    if (doc.y > 720) {
      doc.addPage();
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('ANSWER KEY (continued)', { align: 'center' });
      doc.moveDown(1);
    }

    const correctAnswer = answerKey.get(question.questionId);

    // Question number and answer on same line
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(`Q${index + 1}: `, { continued: true });

    doc
      .font('Helvetica')
      .fillColor('green')
      .text(correctAnswer || 'N/A', { continued: false });

    doc.fillColor('black'); // Reset color

    // Syllabus reference (smaller, on next line)
    doc
      .fontSize(8)
      .font('Helvetica-Oblique')
      .fillColor('gray')
      .text(`   Ref: ${question.syllabusReference}`, { indent: 30 });

    doc.fillColor('black'); // Reset color
    doc.moveDown(0.8);
  });
}
