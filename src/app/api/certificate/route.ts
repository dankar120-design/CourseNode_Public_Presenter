import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { brandConfig } from '@/config/branding';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const certificateName = searchParams.get('name');

    if (!certificateName) {
      return new NextResponse('Missing name', { status: 400 });
    }

    const session = await getSession();
    if (!session || typeof session.enrollmentId !== 'string') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: session.enrollmentId },
      include: { course: true }
    });

    if (!enrollment || enrollment.status !== 'COMPLETED') {
      return new NextResponse('Course not completed', { status: 403 });
    }

    const isTestCode = enrollment.accessCodeId === 'TEST-1234-ABCD' && process.env.NODE_ENV !== 'production';

    if (!isTestCode && enrollment.certDownloads >= 3) {
      return new NextResponse('Max downloads reached', { status: 403 });
    }

    const safeName = certificateName.replace(/[^\x20-\xFF]/g, '').trim();
    if (!safeName) {
      return new NextResponse('Invalid name', { status: 400 });
    }

    // Generate Premium PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 Landscape
    const { width, height } = page.getSize();

    try {
      const bgImagePath = path.join(process.cwd(), 'public', 'images', 'cert-bg.png');
      const bgImageBytes = fs.readFileSync(bgImagePath);
      const bgImage = await pdfDoc.embedPng(bgImageBytes);
      page.drawImage(bgImage, { x: 0, y: 0, width, height });
    } catch (e) {
      console.error('Kunde inte ladda bakgrundsbild för certifikat:', e);
      page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.97, 0.98, 0.99) });
    }

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const drawCenteredText = (text: string, y: number, size: number, font: any, color: any = rgb(0.1, 0.15, 0.2)) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
    };

    const content = enrollment.course.content as any;
    const overrides = content?.certificateOverrides || {};
    const certTitle = overrides.title || brandConfig.certificate.title;
    const disclaimer = overrides.disclaimer || null;
    const validityYears = overrides.validityYears ? Number(overrides.validityYears) : null;

    drawCenteredText(certTitle, 420, 42, helveticaFont, rgb(0.05, 0.15, 0.25));
    drawCenteredText('Härmed intygas att', 340, 18, helveticaRegular);
    drawCenteredText(safeName, 280, 36, helveticaFont, rgb(0.05, 0.15, 0.25));
    drawCenteredText(`framgångsrikt har slutfört utbildningen: ${enrollment.course.title}`, 220, 16, helveticaRegular);
    
    // Dynamisk Y-layout för att förhindra textkollision (bättre andrum för texten)
    let currentY = 190;
    
    if (disclaimer) {
      drawCenteredText(disclaimer, currentY, 12, helveticaFont, rgb(0.8, 0.1, 0.1));
      currentY -= 25;
    } else {
      currentY -= 15;
    }
    
    const completionDate = enrollment.completedAt ? new Date(enrollment.completedAt) : new Date();
    drawCenteredText(`Datum: ${completionDate.toLocaleDateString('sv-SE')}`, currentY, 16, helveticaRegular);
    currentY -= 20;
    
    if (validityYears && !isNaN(validityYears)) {
      const validUntil = new Date(completionDate);
      validUntil.setFullYear(validUntil.getFullYear() + validityYears);
      // Fetstil (helveticaFont) är ett avsiktligt designval för att framhäva utgångsdatumet
      drawCenteredText(`Giltigt till: ${validUntil.toLocaleDateString('sv-SE')}`, currentY, 12, helveticaFont, rgb(0.3, 0.35, 0.4));
      currentY -= 25;
    } else {
      currentY -= 15;
    }

    drawCenteredText(`Utfärdat av: ${brandConfig.certificate.issuer}`, currentY, 14, helveticaFont, rgb(0.4, 0.45, 0.5));
    currentY -= 25;
    drawCenteredText(`Certifikat-ID (Pseudonym): ${enrollment.accessCodeId}`, currentY, 10, helveticaRegular, rgb(0.6, 0.6, 0.6));

    const pdfBytes = await pdfDoc.save();

    // Update download count
    await prisma.enrollment.updateMany({
      where: { 
        id: enrollment.id,
        ...(isTestCode ? {} : { certDownloads: { lt: 3 } })
      },
      data: { certDownloads: { increment: 1 } }
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${certTitle}-${enrollment.course.title}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Certificate API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
