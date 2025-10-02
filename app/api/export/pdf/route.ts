import PDFDocument from 'pdfkit';

export async function POST(req: Request) {
  const { blueprint } = await req.json();
  const doc = new PDFDocument();
  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c as Buffer));
  doc.fontSize(18).text('StakeSmith Blueprint', { underline: true });
  doc.moveDown().fontSize(12).text(JSON.stringify(blueprint, null, 2));
  doc.end();
  await new Promise((r) => doc.on('end', r));
  return new Response(Buffer.concat(chunks), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'attachment; filename="blueprint.pdf"'
    }
  });
}
