// PDF reader — pdfjs-dist text extraction. Per-page text is preserved so
// parsers can use page boundaries (statements often have one billing cycle
// per page or a dedicated summary page).
//
// Password-protected PDFs throw a typed `password-required` error that the
// pipeline surfaces; the UI then prompts for a password and retries.

import * as pdfjs from 'pdfjs-dist';
// `?worker` makes Vite emit a Worker constructor for this module, sidestepping
// the URL-resolution and MIME-type problems that plague `?url` deployments
// (especially on GitHub Pages, which serves `.mjs` with a non-module-friendly
// content type for module workers).
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

import type { ExtractedDocument, ExtractedPage, RawFile, ReadOptions, Reader } from '../types';
import { hashBytes } from '../hash';

pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();

interface PdfPositionedItem { str: string; transform: number[]; width: number }

/** Group text items into visual lines by y-coordinate, then sort each line by
 *  x-coordinate. Recreates column-aligned text from pdfjs's positional output;
 *  flat .map(str).join(' ') loses the layout and bleeds multi-line narrations
 *  into adjacent rows. */
function reconstructLines(items: PdfPositionedItem[]): string {
  const Y_TOLERANCE = 2;
  const lines: { y: number; items: PdfPositionedItem[] }[] = [];
  for (const it of items) {
    if (!it.str) continue;
    const y = it.transform[5];
    let line = lines.find(l => Math.abs(l.y - y) < Y_TOLERANCE);
    if (!line) {
      line = { y, items: [] };
      lines.push(line);
    }
    line.items.push(it);
  }
  lines.sort((a, b) => b.y - a.y);
  return lines
    .map(line => {
      line.items.sort((a, b) => a.transform[4] - b.transform[4]);
      let out = '';
      let lastEndX = -Infinity;
      for (const it of line.items) {
        const x = it.transform[4];
        if (out.length === 0) out = it.str;
        else if (x - lastEndX > 6) out += '   ' + it.str;
        else out += it.str;
        lastEndX = x + it.width;
      }
      return out;
    })
    .join('\n');
}

export class PasswordRequiredError extends Error {
  readonly code = 'password-required' as const;
  constructor(public sourceName: string) {
    super(`PDF '${sourceName}' is password-protected`);
  }
}

export class PdfReader implements Reader {
  readonly id = 'reader.pdf';

  canRead(file: RawFile): boolean {
    return file.mimeType === 'application/pdf' || /\.pdf$/i.test(file.name);
  }

  async read(file: RawFile, opts: ReadOptions = {}): Promise<ExtractedDocument> {
    if (typeof file.data === 'string') {
      throw new Error('PdfReader expected ArrayBuffer; got string');
    }

    // Hash before pdfjs takes ownership: when the worker is active, pdfjs
    // transfers the underlying ArrayBuffer via postMessage, leaving file.data
    // detached. Subsequent constructs against it throw
    // "Cannot perform Construct on a detached ArrayBuffer".
    const hash = await hashBytes(file.data);
    const data = new Uint8Array(file.data);
    let pdf: pdfjs.PDFDocumentProxy;
    try {
      pdf = await pdfjs.getDocument({ data, password: opts.password }).promise;
    } catch (e) {
      const name = (e as { name?: string }).name;
      if (name === 'PasswordException') {
        throw new PasswordRequiredError(file.name);
      }
      throw e;
    }

    const pages: ExtractedPage[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const items: PdfPositionedItem[] = [];
      for (const it of content.items) {
        if ('str' in it && 'transform' in it) {
          items.push({ str: it.str, transform: it.transform, width: it.width });
        }
      }
      pages.push({ pageNumber: i, text: reconstructLines(items) });
    }

    return {
      sourceFile: { name: file.name, mimeType: file.mimeType, hash },
      text: pages.map(p => p.text).join('\n'),
      pages,
      metadata: { pageCount: pdf.numPages },
    };
  }
}
