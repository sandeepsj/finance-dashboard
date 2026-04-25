// SHA-256 of file bytes — used as the idempotency key. Re-uploading the same
// statement produces the same hash, so dedupe is trivial.

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashBytes(data: ArrayBuffer | Uint8Array): Promise<string> {
  const view =
    data instanceof Uint8Array
      ? data
      : new Uint8Array(data);
  // Copy into a fresh ArrayBuffer to satisfy `BufferSource` (excludes SharedArrayBuffer).
  const fresh = new Uint8Array(view.byteLength);
  fresh.set(view);
  return toHex(await crypto.subtle.digest('SHA-256', fresh));
}

export async function hashString(s: string): Promise<string> {
  return hashBytes(new TextEncoder().encode(s));
}
