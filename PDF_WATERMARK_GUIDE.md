# PDF Watermark Implementation Guide

## Overview

This guide explains how to add the PrepTick logo watermark to all generated question papers (PDFs).

## Current Status

- ✅ Sample paper available: `PrepTick_Sample_Paper_Class6_Maths.docx`
- ✅ Sample paper page created: `/sample-paper`
- ✅ Logo file available: `public/logo.png`
- ⏳ PDF watermarking to be implemented

## Implementation Approach

### Option 1: Using PDFKit (Node.js)

When generating PDFs on the backend, add watermark using PDFKit:

```typescript
import PDFDocument from 'pdfkit';
import fs from 'fs';

function generatePDFWithWatermark(questions: Question[], outputPath: string) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(outputPath));

  // Add watermark to each page
  doc.on('pageAdded', () => {
    // Add logo watermark
    doc.image('public/logo.png', 
      doc.page.width - 150, // X position (top right)
      20,                    // Y position
      { 
        width: 120,
        opacity: 0.3         // Semi-transparent
      }
    );
    
    // Or add text watermark
    doc.fontSize(10)
       .fillColor('#999999')
       .opacity(0.5)
       .text('PrepTick - Exam Preparation', 
         doc.page.width / 2 - 100, 
         doc.page.height - 30,
         { align: 'center' }
       );
  });

  // Add content
  questions.forEach((question, index) => {
    if (index > 0) doc.addPage();
    
    doc.fontSize(12)
       .fillColor('#000000')
       .opacity(1)
       .text(`Q${index + 1}. ${question.questionText}`, 50, 100);
    
    // Add more question content...
  });

  doc.end();
}
```

### Option 2: Using pdf-lib (Browser or Node.js)

For client-side or server-side PDF manipulation:

```typescript
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';

async function addWatermarkToPDF(pdfPath: string, logoPath: string) {
  // Load existing PDF
  const existingPdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  // Load logo image
  const logoImageBytes = fs.readFileSync(logoPath);
  const logoImage = await pdfDoc.embedPng(logoImageBytes);
  
  // Get pages
  const pages = pdfDoc.getPages();
  
  // Add watermark to each page
  for (const page of pages) {
    const { width, height } = page.getSize();
    
    // Add logo in top right corner
    page.drawImage(logoImage, {
      x: width - 130,
      y: height - 60,
      width: 100,
      height: 40,
      opacity: 0.3,
    });
    
    // Add text watermark at bottom
    page.drawText('PrepTick - www.preptick.com', {
      x: width / 2 - 80,
      y: 20,
      size: 10,
      color: rgb(0.6, 0.6, 0.6),
      opacity: 0.5,
    });
  }
  
  // Save watermarked PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfPath, pdfBytes);
}
```

### Option 3: Using Puppeteer (HTML to PDF)

Generate PDF from HTML with watermark:

```typescript
import puppeteer from 'puppeteer';

async function generatePDFFromHTML(htmlContent: string, outputPath: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // HTML with watermark
  const htmlWithWatermark = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page {
          margin: 20mm;
        }
        .watermark {
          position: fixed;
          top: 10mm;
          right: 10mm;
          opacity: 0.3;
          z-index: 1000;
        }
        .watermark img {
          width: 100px;
          height: auto;
        }
        .footer-watermark {
          position: fixed;
          bottom: 5mm;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          color: #999;
          opacity: 0.5;
        }
      </style>
    </head>
    <body>
      <div class="watermark">
        <img src="file:///path/to/logo.png" alt="PrepTick">
      </div>
      <div class="footer-watermark">
        PrepTick - Exam Preparation Platform
      </div>
      ${htmlContent}
    </body>
    </html>
  `;
  
  await page.setContent(htmlWithWatermark);
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size: 10px; text-align: center; width: 100%; color: #999;">
        PrepTick - Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>
    `,
  });
  
  await browser.close();
}
```

## Watermark Specifications

### Logo Watermark
- **Position**: Top right corner
- **Size**: 100-120px width
- **Opacity**: 0.3 (30% transparent)
- **Margin**: 20px from top and right edges

### Text Watermark
- **Position**: Bottom center
- **Text**: "PrepTick - www.preptick.com"
- **Font Size**: 10px
- **Color**: Gray (#999999)
- **Opacity**: 0.5 (50% transparent)

### Page Numbers
- **Position**: Bottom center (below text watermark)
- **Format**: "Page X of Y"
- **Font Size**: 9px

## Implementation Steps

### 1. Install Required Packages

```bash
npm install pdfkit pdf-lib puppeteer
npm install --save-dev @types/pdfkit
```

### 2. Create Watermark Service

Create `src/services/pdfWatermark.ts`:

```typescript
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export class PDFWatermarkService {
  private logoPath: string;

  constructor() {
    this.logoPath = path.join(process.cwd(), 'public', 'logo.png');
  }

  async addWatermark(pdfPath: string): Promise<void> {
    // Implementation here
  }

  async generateWatermarkedPDF(
    questions: Question[],
    outputPath: string
  ): Promise<void> {
    // Implementation here
  }
}
```

### 3. Update PDF Generation Service

Modify `src/services/pdfGenerator.ts` (when created):

```typescript
import { PDFWatermarkService } from './pdfWatermark';

export class PDFGeneratorService {
  private watermarkService: PDFWatermarkService;

  constructor() {
    this.watermarkService = new PDFWatermarkService();
  }

  async generateTestPDF(test: Test): Promise<string> {
    const pdfPath = `./generated/${test.id}.pdf`;
    
    // Generate PDF content
    await this.createPDFContent(test, pdfPath);
    
    // Add watermark
    await this.watermarkService.addWatermark(pdfPath);
    
    return pdfPath;
  }
}
```

## Testing

### Test Watermark Visibility

1. Generate a test PDF
2. Verify logo appears on all pages
3. Check opacity is correct (visible but not intrusive)
4. Ensure text is readable despite watermark
5. Test printing - watermark should be visible

### Test Different Paper Sizes

- A4 (210 x 297 mm)
- Letter (8.5 x 11 inches)
- Legal (8.5 x 14 inches)

## Best Practices

1. **Opacity**: Keep watermark subtle (30-50% opacity)
2. **Position**: Top right or bottom center to avoid content overlap
3. **Size**: Logo should be visible but not dominate the page
4. **Consistency**: Same watermark on all pages
5. **Quality**: Use high-resolution logo (PNG with transparency)
6. **Performance**: Cache watermarked templates when possible

## Security Considerations

1. **Prevent Removal**: While watermarks can be removed, they deter casual copying
2. **Metadata**: Add PrepTick metadata to PDF properties
3. **Encryption**: Consider PDF encryption for premium content
4. **Digital Signatures**: Add digital signature for authenticity

## Future Enhancements

1. **Dynamic Watermarks**: Include user email or ID
2. **QR Codes**: Add QR code linking to PrepTick
3. **Timestamp**: Add generation date/time
4. **Custom Watermarks**: Allow schools to add their logo
5. **Watermark Removal Detection**: Track if watermark is removed

## Related Files

- Logo: `public/logo.png`
- Sample Paper: `documents/PrepTick_Sample_Paper_Class6_Maths.docx`
- Sample Paper Page: `src/pages/SamplePaperPage.tsx`

## References

- [PDFKit Documentation](http://pdfkit.org/)
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [Puppeteer PDF Options](https://pptr.dev/api/puppeteer.pdfoptions)

---

**Note**: This is a guide for future implementation. The actual PDF generation with watermarks will be implemented as part of task 9.1 in the spec.
