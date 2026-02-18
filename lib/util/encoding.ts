/**
 * Convert an ArrayBuffer to a base64-encoded string.
 * Uses btoa which is available in all modern browsers.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert a base64 or base64url-encoded string into an ArrayBuffer.
 * Handles both standard base64 and base64url (with - and _ characters).
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Normalize base64url to standard base64 if needed.
  const base64Standard = base64.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed.
  const padded = base64Standard.padEnd(
    base64Standard.length + ((4 - (base64Standard.length % 4)) % 4),
    '='
  );

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
