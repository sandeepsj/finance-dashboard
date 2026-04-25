// Google Drive REST client scoped to drive.file.
//
// Files we manage:
//   spaces=drive folder named "finance-dashboard"
//     ├─ data.json                           — versioned AppState snapshot
//     ├─ documents/<sha256>.<ext>            — raw uploaded statements
//     └─ parse-cache/<sha256>.json           — cached ParseResults (future)
//
// drive.file scope means we can only see files this app created in the user's
// Drive. Each Google account is naturally isolated.

import { authStore } from './google';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const APP_FOLDER = 'finance-dashboard';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

async function bearer(): Promise<string> {
  const s = authStore.getSnapshot();
  if (s.kind === 'signed-in' && s.token.expiresAt > Date.now() + 5_000) return s.token.value;
  // Try to silently refresh; refuse if that fails.
  const refreshed = await authStore.refresh();
  if (!refreshed) throw new Error('Not signed in');
  return refreshed.value;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await bearer();
  const r = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  if (!r.ok) throw new Error(`drive ${r.status}: ${await r.text().catch(() => '')}`);
  if (r.status === 204) return undefined as T;
  return (await r.json()) as T;
}

let folderIdCache: string | null = null;

/** Find or create the app folder. Cached for the session. */
async function getAppFolderId(): Promise<string> {
  if (folderIdCache) return folderIdCache;

  const q = encodeURIComponent(`name='${APP_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const list = await api<{ files: DriveFile[] }>(`/files?q=${q}&fields=files(id,name)`);
  if (list.files.length > 0) {
    folderIdCache = list.files[0].id;
    return folderIdCache;
  }
  const created = await api<DriveFile>('/files?fields=id,name', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: APP_FOLDER, mimeType: 'application/vnd.google-apps.folder' }),
  });
  folderIdCache = created.id;
  return folderIdCache;
}

async function findFile(name: string, parentId: string): Promise<DriveFile | null> {
  const q = encodeURIComponent(`name='${name}' and '${parentId}' in parents and trashed=false`);
  const r = await api<{ files: DriveFile[] }>(`/files?q=${q}&fields=files(id,name,mimeType,modifiedTime,size)`);
  return r.files[0] ?? null;
}

/**
 * Read `data.json` if present.
 */
export async function readDataJson<T>(): Promise<T | null> {
  const folderId = await getAppFolderId();
  const file = await findFile('data.json', folderId);
  if (!file) return null;
  const token = await bearer();
  const r = await fetch(`${API}/files/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    if (r.status === 404) return null;
    throw new Error(`download ${r.status}`);
  }
  return (await r.json()) as T;
}

/** Create or overwrite `data.json`. Uses multipart upload to set metadata
 *  (folder parent, mime) and content in one request. */
export async function writeDataJson(content: unknown): Promise<void> {
  const folderId = await getAppFolderId();
  const existing = await findFile('data.json', folderId);
  const metadata = existing
    ? { name: 'data.json' }
    : { name: 'data.json', mimeType: 'application/json', parents: [folderId] };
  const body = buildMultipart(metadata, JSON.stringify(content), 'application/json');
  const token = await bearer();
  const url = existing
    ? `${UPLOAD}/files/${existing.id}?uploadType=multipart`
    : `${UPLOAD}/files?uploadType=multipart`;
  const r = await fetch(url, {
    method: existing ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary="${body.boundary}"`,
    },
    body: body.payload,
  });
  if (!r.ok) throw new Error(`upload ${r.status}: ${await r.text().catch(() => '')}`);
}

/** Upload a raw file to documents/<name>. */
export async function uploadDocument(name: string, blob: Blob, mimeType: string): Promise<{ id: string }> {
  const folderId = await getAppFolderId();
  let docsFolderId = await findOrCreateSubfolder(folderId, 'documents');
  const existing = await findFile(name, docsFolderId);
  if (existing) return { id: existing.id };
  const metadata = { name, mimeType, parents: [docsFolderId] };
  const body = buildMultipart(metadata, blob, mimeType);
  const token = await bearer();
  const r = await fetch(`${UPLOAD}/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary="${body.boundary}"`,
    },
    body: body.payload,
  });
  if (!r.ok) throw new Error(`upload ${r.status}: ${await r.text().catch(() => '')}`);
  return (await r.json()) as { id: string };
}

async function findOrCreateSubfolder(parent: string, name: string): Promise<string> {
  const q = encodeURIComponent(`name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parent}' in parents and trashed=false`);
  const list = await api<{ files: DriveFile[] }>(`/files?q=${q}&fields=files(id,name)`);
  if (list.files[0]) return list.files[0].id;
  const created = await api<DriveFile>('/files?fields=id,name', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parent] }),
  });
  return created.id;
}

interface MultipartPayload {
  boundary: string;
  payload: Blob;
}

function buildMultipart(metadata: object, body: string | Blob, mimeType: string): MultipartPayload {
  const boundary = `boundary-${Math.random().toString(36).slice(2)}`;
  const parts: BlobPart[] = [
    `--${boundary}\r\n`,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\n`,
    `Content-Type: ${mimeType}\r\n\r\n`,
  ];
  if (typeof body === 'string') parts.push(body);
  else parts.push(body);
  parts.push(`\r\n--${boundary}--`);
  return { boundary, payload: new Blob(parts) };
}

/** Forget the cached folder id (call on sign-out). */
export function resetDriveCache(): void {
  folderIdCache = null;
}
