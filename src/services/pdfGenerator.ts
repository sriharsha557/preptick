// PDF Generation Service for MockPrep
// Generates formatted PDFs for test questions and answer keys

import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import {
  MockTest,
  PDFDocument as PDFDocumentType,
  PDFError,
  Result,
  Ok,
  Err,
  StudentMetadata,
} from '../types';

// Logo path for watermark - try multiple locations for dev/prod
function getLogoPath(): string {
  const possiblePaths = [
    path.join(__dirname, '../../assets/logo.png'),       // Development
    path.join(__dirname, '../../public/logo.png'),       // Alternative dev
    path.join(__dirname, '../assets/logo.png'),          // Production (dist)
    path.join(process.cwd(), 'assets/logo.png'),         // CWD assets
    path.join(process.cwd(), 'public/logo.png'),         // CWD public
    path.join(process.cwd(), 'dist/logo.png'),           // CWD dist
  ];

  for (const logoPath of possiblePaths) {
    if (fs.existsSync(logoPath)) {
      return logoPath;
    }
  }

  // Return first path as default (will log warning if not found)
  return possiblePaths[0];
}

/**
 * PDF spacing configuration constants
 * Requirements: 1.1, 1.2, 1.3
 */
const PDF_SPACING = {
  questionGap: 20,        // pixels between questions (Requirement 1.1)
  optionGap: 8,           // pixels between options (Requirement 1.5)
  solutionGap: 15,        // pixels between answer and solution (Requirement 1.4)
  separatorPadding: 10,   // pixels around separator line (Requirement 1.6)
  headerGap: 30,          // pixels between header and content
  margins: {
    top: 40,              // top margin (Requirement 1.2)
    bottom: 40,           // bottom margin (Requirement 1.2)
    left: 50,             // left margin (Requirement 1.3)
    right: 50             // right margin (Requirement 1.3)
  }
};

/**
 * Header font configuration
 */
const HEADER_FONTS = {
  studentName: { size: 14, font: 'Helvetica-Bold' },
  metadata: { size: 10, font: 'Helvetica' }
};

/**
 * Strip option prefix from LLM-generated options
 * Removes prefixes like "A)", "B)", "1.", "a)", etc.
 * This prevents double prefixes when the PDF adds its own A. B. labels
 */
function stripOptionPrefix(option: string): string {
  // Match patterns like: A), B), a), b), 1), 2), A., B., 1., A:, A-, etc.
  return option.replace(/^[A-Da-d1-4][\)\.\:\-]\s*/, '').trim();
}

/**
 * Safely parse solution steps from various input formats
 * Handles string (JSON), array, and null/undefined inputs
 * Requirements: 3.4
 * 
 * @param steps - Solution steps in various formats (string, array, null, undefined)
 * @returns Array of solution step strings, or undefined for invalid inputs
 */
function parseSolutionSteps(steps: any): string[] | undefined {
  // Handle null or undefined
  if (steps === null || steps === undefined) {
    return undefined;
  }

  // Handle array input (already parsed)
  if (Array.isArray(steps)) {
    // Validate that all elements are strings
    if (steps.every(step => typeof step === 'string')) {
      return steps.length > 0 ? steps : undefined;
    }
    return undefined;
  }

  // Handle string input (JSON)
  if (typeof steps === 'string') {
    try {
      const parsed = JSON.parse(steps);
      // Recursively validate the parsed result
      if (Array.isArray(parsed) && parsed.every(step => typeof step === 'string')) {
        return parsed.length > 0 ? parsed : undefined;
      }
      return undefined;
    } catch {
      // Malformed JSON - return undefined
      return undefined;
    }
  }

  // Invalid input type
  return undefined;
}

/**
 * Add logo watermark to the current page
 * Renders a semi-transparent logo in the center of the page
 */
function addWatermark(doc: PDFKit.PDFDocument): void {
  try {
    const logoPath = getLogoPath();

    // Check if logo file exists
    if (!fs.existsSync(logoPath)) {
      console.warn('Logo file not found at:', logoPath);
      return;
    }

    // Save the current graphics state
    doc.save();

    // Set opacity for watermark effect
    doc.opacity(0.08);

    // A4 page dimensions: 595 x 842 points
    const pageWidth = 595;
    const pageHeight = 842;
    const watermarkSize = 200;

    // Center the watermark on the page
    const x = (pageWidth - watermarkSize) / 2;
    const y = (pageHeight - watermarkSize) / 2;

    // Add the logo image as watermark
    doc.image(logoPath, x, y, {
      width: watermarkSize,
      height: watermarkSize,
      fit: [watermarkSize, watermarkSize],
      align: 'center',
      valign: 'center',
    });

    // Restore the graphics state
    doc.restore();
  } catch (error) {
    console.warn('Failed to add watermark:', error);
  }
}

/**
 * Render student header with personalization metadata
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 *
 * @param doc - PDFKit document instance
 * @param metadata - Student metadata (name, grade, date)
 */
function renderStudentHeader(
  doc: PDFKit.PDFDocument,
  metadata?: StudentMetadata
): void {
  // If no metadata provided, use placeholders (Requirement 2.6)
  const studentName = metadata?.name || '[Not Provided]';
  const grade = metadata?.grade || '[Not Provided]';
  const date = metadata?.date || new Date().toISOString().split('T')[0];

  // Position header 20px from top margin (Requirement 2.4)
  // Note: The top margin is already set to 40px in PDF_SPACING.margins.top
  // So we position at the top of the content area
  doc.y = PDF_SPACING.margins.top;

  // Render student name in 14-point bold font (Requirement 2.2)
  doc
    .fontSize(HEADER_FONTS.studentName.size)
    .font(HEADER_FONTS.studentName.font)
    .text(`Student: ${studentName}`, {
      align: 'left',
    });

  doc.moveDown(0.3);

  // Render metadata fields in 10-point regular font (Requirement 2.3)
  doc
    .fontSize(HEADER_FONTS.metadata.size)
    .font(HEADER_FONTS.metadata.font)
    .text(`Grade: ${grade}`, { align: 'left' });

  doc.text(`Date: ${date}`, { align: 'left' });

  // Add 30px spacing between header and content (Requirement 2.5)
  doc.moveDown(PDF_SPACING.headerGap / 12); // Convert pixels to approximate line spacing
}

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
 * Requirements: 3.1, 3.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export async function generateQuestionPaper(
  test: MockTest,
  topics: string[],
  studentMetadata?: StudentMetadata
): Promise<Result<PDFDocumentType, PDFError>> {
  try {
    const doc = new PDFDocument({
      size: 'A4',
      margins: PDF_SPACING.margins,
    });

    // Collect PDF data in chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Create a promise that resolves when PDF is finished
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Add watermark to first page
    addWatermark(doc);

    // Add watermark to each new page
    doc.on('pageAdded', () => {
      addWatermark(doc);
    });

    // Render student header if metadata provided (Requirements 2.1-2.6)
    if (studentMetadata) {
      renderStudentHeader(doc, studentMetadata);
    }

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
      // P2 Requirement 4.4: Render checkboxes for multiple-answer questions
      if (question.questionType === 'MultipleChoice' && question.options) {
        const isMultipleAnswer = question.allowMultipleAnswers || false;
        const symbol = isMultipleAnswer ? '[ ]' : '( )'; // Checkbox for multi-answer, circle for single
        
        question.options.forEach((option, optIndex) => {
          const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D...
          const cleanOption = stripOptionPrefix(option); // Remove any existing prefix
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(`${symbol} ${optionLabel}. ${cleanOption}`, {
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
      margins: PDF_SPACING.margins,
    });

    // Collect PDF data in chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Create a promise that resolves when PDF is finished
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Add watermark to first page
    addWatermark(doc);

    // Add watermark to each new page
    doc.on('pageAdded', () => {
      addWatermark(doc);
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

      // Options for multiple choice questions with spacing (Requirement 1.5)
      // P2 Requirement 4.4: Render checkboxes for multiple-answer questions
      if (question.questionType === 'MultipleChoice' && question.options) {
        const isMultipleAnswer = question.allowMultipleAnswers || false;
        const symbol = isMultipleAnswer ? '[ ]' : '( )'; // Checkbox for multi-answer, circle for single
        
        question.options.forEach((option, optIndex) => {
          const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D...
          const cleanOption = stripOptionPrefix(option); // Remove any existing prefix
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(`${symbol} ${optionLabel}. ${cleanOption}`, {
              indent: 40,
            });
          // Add spacing between options (8px) - Requirement 1.5
          doc.moveDown(PDF_SPACING.optionGap / 12); // Convert pixels to approximate line spacing
        });
      }

      doc.moveDown(0.3);

      // Correct answer - P2 Requirement 4.5: Mark all correct answers for multi-answer questions
      const correctAnswer = test.answerKey.get(question.questionId);
      let correctAnswerText = 'N/A';
      
      if (correctAnswer) {
        // Try to parse as JSON array for multiple answers
        try {
          const parsedAnswer = JSON.parse(correctAnswer);
          if (Array.isArray(parsedAnswer)) {
            correctAnswerText = parsedAnswer.join(', ');
          } else {
            correctAnswerText = correctAnswer;
          }
        } catch {
          correctAnswerText = correctAnswer;
        }
      }
      
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('green')
        .text(`Correct Answer: ${correctAnswerText}`, { indent: 20 });

      doc.fillColor('black');

      // Add spacing between answer and solution (15px) - Requirement 1.4
      doc.moveDown(PDF_SPACING.solutionGap / 12); // Convert pixels to approximate line spacing

      // Add solution steps (Requirement 4.4)
      // Use parseSolutionSteps helper to safely parse solution steps
      const solutionSteps = parseSolutionSteps(question.solutionSteps);
      if (solutionSteps && solutionSteps.length > 0) {
        addSolutionSteps(doc, solutionSteps);
      } else {
        // Add note when solution steps are unavailable (Requirement 3.5)
        doc
          .fontSize(9)
          .font('Helvetica-Oblique')
          .fillColor('gray')
          .text('(Detailed solution steps not available)', { indent: 20 });
        doc.fillColor('black');
        doc.moveDown(0.5);
      }

      // Syllabus reference
      doc
        .fontSize(8)
        .font('Helvetica-Oblique')
        .fillColor('gray')
        .text(`Reference: ${question.syllabusReference}`, { indent: 20 });

      doc.fillColor('black');

      // Add separator line between questions with padding (Requirement 1.6)
      if (index < test.questions.length - 1) {
        // Add padding above separator (10px)
        doc.moveDown(PDF_SPACING.separatorPadding / 12);
        
        // Draw horizontal separator line
        const lineY = doc.y;
        doc
          .moveTo(50, lineY)
          .lineTo(545, lineY)
          .strokeColor('#cccccc')
          .lineWidth(0.5)
          .stroke();
        
        // Reset stroke color and width
        doc.strokeColor('black').lineWidth(1);
        
        // Add padding below separator (10px) + question gap (20px) - Requirement 1.1
        doc.moveDown((PDF_SPACING.separatorPadding + PDF_SPACING.questionGap) / 12);
      } else {
        // Last question, just add some space
        doc.moveDown(1);
      }
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
 * @param studentMetadata - Optional student metadata for personalization (Requirements 2.1-2.6)
 * @returns Result containing PDF buffer and filename, or error
 */
export async function generatePDF(
  test: MockTest,
  includeAnswers: boolean,
  studentMetadata?: StudentMetadata
): Promise<Result<PDFDocumentType, PDFError>> {
  try {
    const doc = new PDFDocument({
      size: 'A4',
      margins: PDF_SPACING.margins,
    });

    // Collect PDF data in chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Create a promise that resolves when PDF is finished
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Add watermark to first page
    addWatermark(doc);

    // Add watermark to each new page
    doc.on('pageAdded', () => {
      addWatermark(doc);
    });

    // Generate PDF content
    if (includeAnswers) {
      generateAnswerKeyContent(doc, test);
    } else {
      generateTestContent(doc, test, studentMetadata);
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
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
function generateTestContent(
  doc: PDFKit.PDFDocument,
  test: MockTest,
  studentMetadata?: StudentMetadata
): void {
  const { configuration, questions } = test;

  // Render student header if metadata provided (Requirements 2.1-2.6)
  if (studentMetadata) {
    renderStudentHeader(doc, studentMetadata);
  }

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
    // P2 Requirement 4.4: Render checkboxes for multiple-answer questions
    if (question.questionType === 'MultipleChoice' && question.options) {
      const isMultipleAnswer = question.allowMultipleAnswers || false;
      const symbol = isMultipleAnswer ? '[ ]' : '( )'; // Checkbox for multi-answer, circle for single
      
      question.options.forEach((option, optIndex) => {
        const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D...
        const cleanOption = stripOptionPrefix(option); // Remove any existing prefix
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`${symbol} ${optionLabel}. ${cleanOption}`, {
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
    // P2 Requirement 4.4: Render checkboxes for multiple-answer questions
    if (question.questionType === 'MultipleChoice' && question.options) {
      const isMultipleAnswer = question.allowMultipleAnswers || false;
      const symbol = isMultipleAnswer ? '[ ]' : '( )'; // Checkbox for multi-answer, circle for single
      
      question.options.forEach((option, optIndex) => {
        const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D...
        const cleanOption = stripOptionPrefix(option); // Remove any existing prefix
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`${symbol} ${optionLabel}. ${cleanOption}`, {
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

  // Answer key entries (with solution steps)
  questions.forEach((question, index) => {
    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('ANSWER KEY (continued)', { align: 'center' });
      doc.moveDown(1);
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

    doc.moveDown(0.3);

    const correctAnswer = answerKey.get(question.questionId);
    let correctAnswerText = 'N/A';
    
    if (correctAnswer) {
      // Try to parse as JSON array for multiple answers
      try {
        const parsedAnswer = JSON.parse(correctAnswer);
        if (Array.isArray(parsedAnswer)) {
          correctAnswerText = parsedAnswer.join(', ');
        } else {
          correctAnswerText = correctAnswer;
        }
      } catch {
        correctAnswerText = correctAnswer;
      }
    }

    // Correct answer
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('green')
      .text(`Correct Answer: ${correctAnswerText}`, { indent: 20 });

    doc.fillColor('black');

    // Add spacing between answer and solution
    doc.moveDown(PDF_SPACING.solutionGap / 12);

    // Add solution steps (consistent with generateAnswerKey)
    const solutionSteps = parseSolutionSteps(question.solutionSteps);
    if (solutionSteps && solutionSteps.length > 0) {
      addSolutionSteps(doc, solutionSteps);
    } else {
      // Add note when solution steps are unavailable
      doc
        .fontSize(9)
        .font('Helvetica-Oblique')
        .fillColor('gray')
        .text('(Detailed solution steps not available)', { indent: 20 });
      doc.fillColor('black');
      doc.moveDown(0.5);
    }

    // Syllabus reference
    doc
      .fontSize(8)
      .font('Helvetica-Oblique')
      .fillColor('gray')
      .text(`Reference: ${question.syllabusReference}`, { indent: 20 });

    doc.fillColor('black');

    // Add separator line between questions
    if (index < questions.length - 1) {
      doc.moveDown(PDF_SPACING.separatorPadding / 12);
      
      const lineY = doc.y;
      doc
        .moveTo(50, lineY)
        .lineTo(545, lineY)
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .stroke();
      
      doc.strokeColor('black').lineWidth(1);
      doc.moveDown((PDF_SPACING.separatorPadding + PDF_SPACING.questionGap) / 12);
    } else {
      doc.moveDown(1);
    }
  });
}
