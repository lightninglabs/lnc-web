/**
 * Handles device fingerprinting and session key derivation.
 * Single responsibility: device identification and key derivation.
 */
export class DeviceBinder {
  async generateFingerprint(): Promise<string> {
    const screen = `${globalThis.screen.width}x${globalThis.screen.height}x${globalThis.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const canvas = await this.generateCanvasFingerprint();

    return await this.hashFingerprint(`${screen}|${timezone}|${canvas}`);
  }

  async deriveSessionKey(
    fingerprint: string,
    sessionId: string
  ): Promise<CryptoKey> {
    const ikm = new TextEncoder().encode(fingerprint);
    const baseKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, [
      'deriveKey'
    ]);

    return await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new TextEncoder().encode(sessionId),
        info: new TextEncoder().encode('lnc-session-device-key')
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['wrapKey', 'unwrapKey']
    );
  }

  /**
   * Generate a canvas-based fingerprint string that contributes to the
   * overall device fingerprint. Throws if the Canvas API is unavailable.
   */
  private async generateCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      // Render test pattern
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint test', 2, 2);

      const dataUrl = canvas.toDataURL();
      const hash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(dataUrl)
      );

      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // Canvas API blocked or unavailable - fail securely
      throw new Error('Canvas fingerprinting required for session security');
    }
  }

  /**
   * Hash the raw fingerprint string into a fixed-length identifier
   * using SHA-256.
   */
  private async hashFingerprint(fingerprint: string): Promise<string> {
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(fingerprint)
    );
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
