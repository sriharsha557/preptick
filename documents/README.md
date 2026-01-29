# Syllabus Documents

This folder contains syllabus PDF documents that are processed and indexed by the RAG system.

## Current Documents

- CBSE Class 3 English Syllabus 2025-26.pdf
- CBSE Class 3 Maths Syllabus 2025-26.pdf
- CBSE Class 4 Maths Syllabus 2025-26.pdf
- Class 4 English Syllabus 2025-26.pdf

## File Naming Convention

For automatic processing, name your PDF files using this format:

```
[Curriculum] Class [Grade] [Subject] Syllabus [Year].pdf
```

Examples:
- `CBSE Class 5 Mathematics Syllabus 2025-26.pdf`
- `Cambridge Grade 10 Science Syllabus 2025-26.pdf`
- `Class 7 English Syllabus 2025-26.pdf` (defaults to CBSE)

## Supported Curricula

- **CBSE** - Central Board of Secondary Education
- **Cambridge** - Cambridge International Examinations

## Supported Grades

- Grades 1-10

## Supported Subjects

- Mathematics / Maths
- Science
- English
- Social Studies
- Hindi
- Physics
- Chemistry
- Biology
- And more...

## How to Index Documents

After adding new PDF files to this folder, run:

```bash
npm run index:documents
```

This will:
1. Read all PDF files in the documents folder
2. Extract text content and sections
3. Parse curriculum, grade, and subject from filenames
4. Create topics in the database
5. Index content for RAG retrieval

## What Gets Indexed

For each PDF document, the system creates:

1. **Main Topic**: A parent topic representing the complete syllabus
   - Contains the full document content (first 5000 characters)
   - Includes all extracted sections as learning objectives

2. **Sub-Topics**: Individual topics for each section/chapter
   - Up to 20 sub-topics per document
   - Linked to the main topic as children
   - Each represents a chapter, unit, or major section

## Content Extraction

The system automatically extracts:

- **Chapters**: "Chapter 1: Introduction"
- **Units**: "Unit 2: Algebra"
- **Topics**: "Topic 3: Fractions"
- **Numbered Sections**: "1. Number Systems"

## RAG Integration

Once indexed, the documents are used for:

1. **Question Generation**: LLM uses syllabus content to generate exam-realistic questions
2. **Topic Validation**: Ensures questions align with official curriculum
3. **Semantic Search**: Find relevant syllabus sections for specific topics
4. **Context Enrichment**: Provide detailed syllabus context for test generation

## Adding More Documents

To expand the syllabus coverage:

1. Add PDF files to this folder
2. Follow the naming convention
3. Run `npm run index:documents`
4. Verify topics were created in the database

## Troubleshooting

**Document not processed?**
- Check the filename format
- Ensure the PDF is readable (not scanned images)
- Check console output for errors

**Topics not appearing?**
- Run `npm run db:seed` to see existing topics
- Check database for newly created topics
- Verify curriculum and grade match your user profile

**Content quality issues?**
- Some PDFs may have formatting issues
- Scanned PDFs require OCR (not currently supported)
- Consider using text-based PDFs for best results

## Future Enhancements

- OCR support for scanned PDFs
- Multi-language support
- Automatic curriculum detection
- Section hierarchy preservation
- Image and diagram extraction
