import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { transactions } from '../../../drizzle/schema';
import { auth } from '@clerk/nextjs/server';
// Using pdf-lib for PDF generation (no external font files needed)
// pdf-lib CommonJS interop handling
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfLib = require('pdf-lib');
const { PDFDocument, StandardFonts, rgb } = pdfLib;
import { eq } from 'drizzle-orm';
import { createObjectCsvStringifier } from 'csv-writer';
import type { Transaction } from '../../../drizzle/schema';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { format } = await req.json();

  const data: Transaction[] = await db.select().from(transactions).where(eq(transactions.userId, userId));

  if (format === 'csv') {
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'type', title: 'Type' },
        { id: 'amount', title: 'Amount' },
        { id: 'currency', title: 'Currency' },
        { id: 'description', title: 'Description' },
        { id: 'recurrence', title: 'Recurrence' },
        { id: 'occurredAt', title: 'Occurred At' }
      ]
    });
    const header = csvStringifier.getHeaderString();
  const records = csvStringifier.stringifyRecords(data.map(t => ({ ...t })));
    return new NextResponse(header + records, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="transactions.csv"'
      }
    });
  }

  if (format === 'pdf') {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = page.getSize();
    const title = 'Transactions';
    page.drawText(title, { x: 50, y: height - 60, size: 20, font, color: rgb(0.1,0.1,0.1) });
    let y = height - 90;
    const lineHeight = 14;
    data.forEach(t => {
      if (y < 50) { // new page when space runs out
        const p = pdfDoc.addPage();
        y = p.getSize().height - 50;
      }
      const color = t.type === 'expense' ? rgb(0.72,0.11,0.11) : rgb(0.02,0.47,0.34);
      const line = `${t.type.toUpperCase()}  ${t.amount} ${t.currency}  ${t.description || ''}`;
      const currentPage = pdfDoc.getPages()[pdfDoc.getPages().length - 1];
      currentPage.drawText(line, { x: 50, y, size: 11, font, color });
      y -= lineHeight;
    });
    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes) as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="transactions.pdf"'
      }
    });
  }

  return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
}
