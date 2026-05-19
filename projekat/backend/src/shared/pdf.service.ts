/* eslint-disable @typescript-eslint/no-var-requires */
import { existsSync } from 'node:fs';

export interface InterventionPdfRow {
  name: string;
  priority: string;
  status: string;
  location: string;
  servicers: string;
  createdAt: string | null;
  startedAt: string | null;
  dueAt: string | null;
}

type PdfFontNames = {
  regular: string;
  bold: string;
};

function resolveFontPath(candidates: Array<string | undefined>): string | null {
  return candidates.find((candidate): candidate is string => Boolean(candidate && existsSync(candidate))) ?? null;
}

export function normalizePdfText(value: string): string {
  if (!/[ÃÄÅâ]/.test(value)) {
    return value;
  }

  const decoded = Buffer.from(value, 'latin1').toString('utf8');
  if (decoded.includes('\uFFFD')) {
    return value;
  }

  return /[čćšžđČĆŠŽĐ–—]/.test(decoded) ? decoded : value;
}

export function sanitizePdfText(value: string): string {
  return value
    .replaceAll('\u00c4\u008d', '\u010d')
    .replaceAll('\u00c4\u0087', '\u0107')
    .replaceAll('\u00c5\u00a1', '\u0161')
    .replaceAll('\u00c5\u00be', '\u017e')
    .replaceAll('\u00c4\u0091', '\u0111')
    .replaceAll('\u00c4\u008c', '\u010c')
    .replaceAll('\u00c4\u0086', '\u0106')
    .replaceAll('\u00c5\u00a0', '\u0160')
    .replaceAll('\u00c5\u00bd', '\u017d')
    .replaceAll('\u00c4\u0090', '\u0110')
    .replaceAll('\u00e2\u0080\u0093', '-')
    .replaceAll('\u00e2\u0080\u0094', '-')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '');
}

function configurePdfFonts(doc: any): PdfFontNames {
  const regularFontPath = resolveFontPath([
    process.env.PDF_FONT_PATH,
    'C:\\Windows\\Fonts\\arial.ttf',
    'C:\\Windows\\Fonts\\segoeui.ttf',
    'C:\\Windows\\Fonts\\calibri.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
  ]);
  const boldFontPath = resolveFontPath([
    process.env.PDF_BOLD_FONT_PATH,
    'C:\\Windows\\Fonts\\arialbd.ttf',
    'C:\\Windows\\Fonts\\segoeuib.ttf',
    'C:\\Windows\\Fonts\\calibrib.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf',
  ]);

  if (!regularFontPath) {
    return { regular: 'Helvetica', bold: 'Helvetica-Bold' };
  }

  doc.registerFont('AppRegular', regularFontPath);
  if (boldFontPath) {
    doc.registerFont('AppBold', boldFontPath);
  }

  return { regular: 'AppRegular', bold: boldFontPath ? 'AppBold' : 'AppRegular' };
}

export async function generateInterventionsPdf(
  rows: InterventionPdfRow[],
  options?: { title?: string },
): Promise<Buffer> {
  // Lazy-require pdfkit so tests can mock this module without installing pdfkit
  // and to avoid top-level require during import time.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const fonts = configurePdfFonts(doc);

  const chunks: Uint8Array[] = [];
  doc.on('data', (chunk: Uint8Array<ArrayBufferLike>) => chunks.push(chunk));

  const finished = new Promise<Buffer>((resolve) =>
    doc.on('end', () => resolve(Buffer.concat(chunks))),
  );

  // Polished layout: dynamic table rows, wrapped cells, readable date column and stable pagination.
  const leftMargin = 40;
  const rightMargin = 40;
  const pageWidth = doc.page.width;
  const usableWidth = pageWidth - leftMargin - rightMargin;
  const title = options?.title ?? 'SI Grupa7 - Interventions';
  const rowFontSize = 8;
  const rowPaddingY = 6;
  const rowGap = 6;
  const bottomContentY = doc.page.height - 70;

  const columns = [
    { key: 'name', header: 'Name', width: Math.floor(usableWidth * 0.23) },
    { key: 'priority', header: 'Priority', width: Math.floor(usableWidth * 0.12) },
    { key: 'status', header: 'Status', width: Math.floor(usableWidth * 0.11) },
    { key: 'location', header: 'Location', width: Math.floor(usableWidth * 0.15) },
    { key: 'servicers', header: 'Servicer(s)', width: Math.floor(usableWidth * 0.15) },
    {
      key: 'createdAt',
      header: 'Created',
      width: Math.floor(usableWidth * 0.12),
    },
    {
      key: 'dueAt',
      header: 'Due',
      width:
        usableWidth -
        (Math.floor(usableWidth * 0.23) +
          Math.floor(usableWidth * 0.12) +
          Math.floor(usableWidth * 0.11) +
          Math.floor(usableWidth * 0.15) +
          Math.floor(usableWidth * 0.19) +
          Math.floor(usableWidth * 0.10)),
    },
  ] as const;

  function formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  }

  function formatDateTime(value: Date): string {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year}. ${hours}:${minutes}`;
  }

  function getDateValues(row: InterventionPdfRow): [string, string] {
    return [formatDate(row.createdAt), formatDate(row.dueAt)];
  }

  function measureRowHeight(values: string[]): number {
    doc.font(fonts.regular).fontSize(rowFontSize);

    const heights = values.map((value, index) => {
      const width = columns[index].width - 8;
      return doc.heightOfString(value, {
        width,
        lineGap: 1,
      });
    });

    const tallest = Math.max(...heights, rowFontSize + 2);
    return tallest + rowPaddingY * 2;
  }

  let pageNumber = 0;
  function drawPageHeader() {
    pageNumber += 1;
    const generatedAt = formatDateTime(new Date());
    // Header title
    doc.fontSize(16).font(fonts.bold).fillColor('#333');
    doc.text(title, leftMargin, 40, { align: 'left' });
    doc.fontSize(9).font(fonts.regular).fillColor('#666');
    doc.text(`Generated: ${generatedAt}`, leftMargin, 40, { align: 'right' });

    // Thin divider
    doc.moveTo(leftMargin, 64).lineTo(pageWidth - rightMargin, 64).stroke('#CCCCCC');

    // Table header positions
    doc.fontSize(10).font(fonts.bold).fillColor('#000');

    let x = leftMargin;
    const headerY = 72;
    const headerHeight = 18;
    // background for header
    doc.rect(leftMargin, headerY - 4, usableWidth, headerHeight).fill('#F0F0F0');
    doc.fillColor('#000');
    for (const col of columns) {
      doc.text(col.header, x + 4, headerY, { width: col.width - 8, lineBreak: false, ellipsis: true });
      x += col.width;
    }

    // draw line under header
    doc.moveTo(leftMargin, headerY + headerHeight + 2).lineTo(pageWidth - rightMargin, headerY + headerHeight + 2).stroke('#CCCCCC');

    // set cursor after header
    doc.y = headerY + headerHeight + 8;
  }

  function drawFooter() {
    const footerY = doc.page.height - 52;
    doc.fontSize(9).fillColor('#666').font(fonts.regular);
    doc.text(`Page ${pageNumber}`, leftMargin, footerY, {
      width: usableWidth,
      align: 'right',
      lineBreak: false,
    });
  }

  // initialize first page
  drawPageHeader();

  let rowIndex = 0;

  for (const row of rows) {
    const values = [
      sanitizePdfText(row.name),
      sanitizePdfText(String(row.priority)),
      sanitizePdfText(String(row.status)),
      sanitizePdfText(String(row.location)),
      sanitizePdfText(String(row.servicers)),
      ...getDateValues(row),
    ];

    const rowHeight = measureRowHeight(values);

    // Paginate before drawing row when there is not enough space below.
    if (doc.y + rowHeight + rowGap > bottomContentY) {
      drawFooter();
      doc.addPage();
      drawPageHeader();
    }

    const xStart = leftMargin;
    const currentY = doc.y;

    // alternating background
    if (rowIndex % 2 === 0) {
      doc
        .save()
        .fillColor('#FAFAFA')
        .rect(xStart, currentY - 2, usableWidth, rowHeight + 2)
        .fill()
        .restore();
    }

    // write columns
    let xPos = xStart;

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      doc.fillColor('#000').fontSize(rowFontSize).font(fonts.regular);
      doc.text(values[i], xPos + 4, currentY + rowPaddingY, {
        width: col.width - 8,
        lineBreak: false,
        ellipsis: true,
        lineGap: 1,
      });
      xPos += col.width;
    }

    // row separator
    doc
      .moveTo(leftMargin, currentY + rowHeight + 2)
      .lineTo(pageWidth - rightMargin, currentY + rowHeight + 2)
      .stroke('#EEEEEE');

    doc.y = currentY + rowHeight + rowGap;
    rowIndex += 1;
  }

  // final footer
  drawFooter();

  doc.end();

  return finished;
}

export default generateInterventionsPdf;
