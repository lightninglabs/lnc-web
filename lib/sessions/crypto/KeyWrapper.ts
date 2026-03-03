import CryptoService from '../cryptoService';
import { WrappedKey } from '../types';

export interface WrappedKeys {
  deviceWrap: WrappedKey;
  originWrap: WrappedKey;
}

/**
 * Wraps and unwraps credential keys with both device and origin key material.
 *
 * Why this exists: SessionManager should orchestrate flow, not contain crypto
 * verification details. This class centralizes "double-wrap + consistency check"
 * rules so they stay testable and hard to bypass accidentally.
 */
export class KeyWrapper {
  constructor(private cryptoService: CryptoService) {}

  /**
   * Store two independently wrapped copies of the same credentials key.
   *
   * Why double-wrap: the key must be recoverable only when both device-bound
   * and origin-bound protections are satisfied.
   */
  async wrapCredentialsKey(
    credentialsKey: CryptoKey,
    deviceKey: CryptoKey,
    originKey: CryptoKey
  ): Promise<WrappedKeys> {
    const deviceWrap = await this.cryptoService.wrapWithDeviceKey(
      credentialsKey,
      deviceKey
    );
    const originWrap = await this.cryptoService.wrapWithOriginKey(
      credentialsKey,
      originKey
    );
    return { deviceWrap, originWrap };
  }

  /**
   * Recover the credentials key from both wrapped forms and ensure both paths
   * resolve to the same underlying key material.
   */
  async unwrapCredentialsKey(
    wrappedKeys: WrappedKeys,
    deviceKey: CryptoKey,
    originKey: CryptoKey
  ): Promise<CryptoKey> {
    const fromDevice = await this.cryptoService.unwrapWithDeviceKey(
      deviceKey,
      wrappedKeys.deviceWrap.keyB64,
      wrappedKeys.deviceWrap.ivB64
    );
    const fromOrigin = await this.cryptoService.unwrapWithOriginKey(
      originKey,
      wrappedKeys.originWrap.keyB64,
      wrappedKeys.originWrap.ivB64
    );

    // We fail closed if the two unwrap paths disagree, because mismatch implies
    // tampering, corruption, or key-derivation drift.
    if (!(await this.keysMatch(fromDevice, fromOrigin))) {
      throw new Error('Key unwrapping mismatch');
    }

    return fromDevice;
  }

  /**
   * Compare keys by behavior rather than by extraction.
   *
   * Why behavioral comparison: WebCrypto keys are non-extractable in this flow,
   * so encrypting fixed data with fixed IV provides a practical equality check.
   */
  private async keysMatch(key1: CryptoKey, key2: CryptoKey): Promise<boolean> {
    try {
      const bytes = new TextEncoder().encode('verification');
      // Fixed IV is only used for deterministic key comparison, not data storage.
      const iv = new Uint8Array(12);

      const encrypted1 = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key1,
        bytes
      );
      const encrypted2 = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key2,
        bytes
      );

      return this.arraysEqual(
        new Uint8Array(encrypted1),
        new Uint8Array(encrypted2)
      );
    } catch {
      return false;
    }
  }

  /**
   * Constant-time byte comparison to avoid leaking which position differs.
   *
   * We deliberately avoid returning early on the first mismatch so the
   * execution time is the same regardless of where the arrays diverge.
   */
  private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let allEqual = true;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) allEqual = false;
      // No early return — always check every byte for constant-time behavior.
    }

    return allEqual;
  }
}
