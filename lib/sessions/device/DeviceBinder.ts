import { arrayBufferToHex } from '../../util/encoding';

/**
 * Handles device fingerprinting and per-session device key derivation.
 *
 * **Fragility note:** The fingerprint is derived from screen resolution, color
 * depth, timezone, and canvas rendering output. Any of these changing will
 * invalidate existing sessions — for example, connecting an external monitor,
 * changing display scaling, or traveling to a different timezone. This is an
 * intentional trade-off: the fingerprint serves as a defense-in-depth layer
 * (preventing casual session replay on a different device) rather than a strong
 * authentication factor.
 */
export class DeviceBinder {
  /**
   * Build a stable device identifier so sessions can only be restored on the
   * same browser/device profile that created them.
   */
  async generateFingerprint(): Promise<string> {
    if (!globalThis.screen?.width || !globalThis.screen?.height) {
      throw new Error(
        'Device fingerprinting requires a browser environment with screen access'
      );
    }

    // We intentionally combine independent signals so one minor environment
    // change does not dominate identity while still preventing casual replay.
    const screen = `${globalThis.screen.width}x${globalThis.screen.height}x${globalThis.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const canvas = await this.generateCanvasFingerprint();

    return this.hashFingerprint(`${screen}|${timezone}|${canvas}`);
  }

  /**
   * Derive a session-specific wrapping key from the device fingerprint.
   *
   * Why HKDF: it turns fingerprint text into cryptographic key material in a
   * repeatable way without storing raw key bytes anywhere.
   */
  async deriveSessionKey(
    fingerprint: string,
    sessionId: string
  ): Promise<CryptoKey> {
    // Import the fingerprint as input keying material for HKDF derivation.
    const ikm = new TextEncoder().encode(fingerprint);
    const baseKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, [
      'deriveKey'
    ]);

    // `sessionId` is used as salt so each session gets a distinct key even on
    // the same device fingerprint.
    return crypto.subtle.deriveKey(
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
   * Add a rendering-dependent signal. This makes replay from another browser
   * profile/device harder, even when basic environment values look similar.
   */
  private async generateCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      // Fixed text + styling keeps output deterministic for a given runtime.
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint test', 2, 2);

      const dataUrl = canvas.toDataURL();
      const hash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(dataUrl)
      );

      return arrayBufferToHex(hash);
    } catch {
      // Fail closed so we do not silently create sessions without device binding.
      throw new Error('Canvas fingerprinting required for session security');
    }
  }

  /**
   * Normalize variable-length fingerprint input into a fixed-size identifier so
   * downstream key derivation behaves consistently.
   */
  private async hashFingerprint(fingerprint: string): Promise<string> {
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(fingerprint)
    );
    return arrayBufferToHex(hash);
  }
}
