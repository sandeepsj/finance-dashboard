// Drives a single browser File through detection → password prompt → parse →
// store ingestion. Used by the Upload page; the per-file UI subscribes to
// status updates via the onEvent callback.

import { authStore } from '@/auth/google';
import { uploadDocument } from '@/auth/drive';
import {
  createDefaultPipeline,
  type ParseError,
  type Parser,
  type ParseResult,
  type PipelineEvent,
  type RawFile,
} from '@/parsers';
import { hashBytes } from '@/parsers/hash';
import { store } from '@/store/store';

export type UploadStage =
  | { kind: 'idle' }
  | { kind: 'reading' }
  | { kind: 'detected'; parser: Parser; passwordRequired: false }
  | { kind: 'password-required'; lastError?: string }
  | { kind: 'parsing'; parser: Parser }
  | { kind: 'no-parser-matched' }
  | { kind: 'parsed'; result: ParseResult; parser: Parser }
  | { kind: 'failed'; reason: string };

const pipeline = createDefaultPipeline();

export function listRegisteredParsers(): readonly Parser[] {
  return pipeline.parsers.list();
}

export async function fileToRawFile(file: File): Promise<RawFile> {
  const isText = file.type === 'text/csv' || file.type === 'text/plain' || /\.(csv|txt|log)$/i.test(file.name);
  const data = isText ? await file.text() : await file.arrayBuffer();
  return {
    name: file.name,
    mimeType: file.type || guessMime(file.name),
    size: file.size,
    data,
  };
}

function guessMime(name: string): string {
  if (/\.pdf$/i.test(name)) return 'application/pdf';
  if (/\.xlsx$/i.test(name)) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (/\.csv$/i.test(name)) return 'text/csv';
  return 'application/octet-stream';
}

/**
 * Run a file all the way through the pipeline, registering it as a Document
 * and (on success) ingesting the ParseResult into the store.
 */
export async function processFile(
  file: File,
  opts: { password?: string; onEvent?: (e: PipelineEvent) => void } = {},
): Promise<UploadStage> {
  const raw = await fileToRawFile(file);
  const fileHash = await hashBytes(typeof raw.data === 'string' ? new TextEncoder().encode(raw.data) : raw.data);

  store.registerDocument({
    id: `doc_${fileHash.slice(0, 12)}`,
    name: raw.name,
    mimeType: raw.mimeType,
    sizeBytes: raw.size,
    fileHash,
    parseStatus: 'pending',
  });

  const result = await pipeline.pipeline.run(raw, {
    readOptions: { password: opts.password },
    onEvent: opts.onEvent,
  });

  if (!result.ok) {
    if (result.error.code === 'password-required') {
      return { kind: 'password-required' };
    }
    if (result.error.code === 'no-parser-matched') {
      store.markDocumentFailed(fileHash, 'no parser matched');
      return { kind: 'no-parser-matched' };
    }
    console.error('[upload] pipeline failed:', result.error);
    const reason = describeError(result.error);
    store.markDocumentFailed(fileHash, reason);
    return { kind: 'failed', reason };
  }

  const parser = pipeline.parsers.byId(result.value.source.parserId)!;
  store.ingestParseResult(result.value);

  // Best-effort: when signed in, upload the raw file to Drive too. Failure
  // is non-fatal — the parsed records are already in the store.
  if (authStore.getSnapshot().kind === 'signed-in') {
    try {
      const ext = (raw.name.match(/\.[^.]+$/)?.[0] ?? '').toLowerCase();
      const driveName = `${fileHash}${ext}`;
      const blob = typeof raw.data === 'string' ? new Blob([raw.data], { type: raw.mimeType }) : new Blob([raw.data], { type: raw.mimeType });
      await uploadDocument(driveName, blob, raw.mimeType);
    } catch (e) {
      console.warn('[upload] raw file Drive upload failed', e);
    }
  }

  return { kind: 'parsed', result: result.value, parser };
}

function describeError(error: ParseError): string {
  switch (error.code) {
    case 'reader-failed':
      return `Could not read the file: ${error.cause}`;
    case 'parser-failed':
      return `Parser ${error.parserId} threw: ${error.cause}`;
    case 'no-reader-for-mime':
      return `No reader registered for MIME type "${error.mimeType}".`;
    case 'no-parser-matched':
      return 'No parser recognized this file.';
    case 'password-required':
      return 'PDF is password-protected.';
    default:
      // Should be unreachable; lets TypeScript catch missing branches.
      return JSON.stringify(error);
  }
}
