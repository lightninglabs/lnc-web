import { WrappedKey } from './types';

/**
 * Crypto service for session credential encryption and key wrapping operations.
 * Provides AES-GCM encryption and key wrapping functionality for session management.
 */
export default class CryptoService {
  /**
   * Generate a random credentials key for encrypting session data
   */
  async generateRandomCredentialsKey(): Promise<CryptoKey> {
    try {
      // This key must be extractable because wrapping/unwrapping is part of the flow.
      return await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true, // extractable - required for wrapKey operations
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      throw new Error(
        `Credentials key generation failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Encrypt credentials using the credentials key
   */
  async encryptCredentials(
    credentialsKey: CryptoKey,
    plaintext: string
  ): Promise<{ ciphertextB64: string; ivB64: string }> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      // AES-GCM provides confidentiality and integrity for the credentials payload.
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        credentialsKey,
        data
      );

      return {
        // Persist as base64 so values can be stored in JSON/sessionStorage safely.
        ciphertextB64: this.arrayBufferToBase64(ciphertext),
        ivB64: this.arrayBufferToBase64(iv.buffer)
      };
    } catch (error) {
      throw new Error(
        `Credential encryption failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Decrypt credentials using the credentials key
   */
  async decryptCredentials(
    credentialsKey: CryptoKey,
    ciphertextB64: string,
    ivB64: string
  ): Promise<string> {
    try {
      // Convert persisted values back into binary buffers expected by Web Crypto.
      const ciphertext = this.base64ToArrayBuffer(ciphertextB64);
      const iv = this.base64ToArrayBuffer(ivB64);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        credentialsKey,
        ciphertext
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error(
        `Credential decryption failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Wrap credentials key with device session key
   */
  async wrapWithDeviceKey(
    credentialsKey: CryptoKey,
    sessionKey: CryptoKey
  ): Promise<WrappedKey> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Wrap the DEK with a key-encryption key so raw key bytes are never persisted.
      const wrappedKey = await crypto.subtle.wrapKey(
        'raw',
        credentialsKey,
        sessionKey,
        { name: 'AES-GCM', iv }
      );

      return {
        keyB64: this.arrayBufferToBase64(wrappedKey),
        ivB64: this.arrayBufferToBase64(iv.buffer)
      };
    } catch (error) {
      throw new Error(
        `Device key wrapping failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Unwrap credentials key with device session key
   */
  async unwrapWithDeviceKey(
    sessionKey: CryptoKey,
    keyB64: string,
    ivB64: string
  ): Promise<CryptoKey> {
    try {
      // Reconstruct the wrapped bytes/IV exactly as they were persisted.
      const wrappedKey = this.base64ToArrayBuffer(keyB64);
      const iv = this.base64ToArrayBuffer(ivB64);

      const credentialsKey = await crypto.subtle.unwrapKey(
        'raw',
        wrappedKey,
        sessionKey,
        { name: 'AES-GCM', iv },
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      return credentialsKey;
    } catch (error) {
      throw new Error(
        `Device key unwrapping failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Wrap credentials key with origin key
   */
  async wrapWithOriginKey(
    credentialsKey: CryptoKey,
    originKey: CryptoKey
  ): Promise<WrappedKey> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Origin wrapping makes the credential key unusable outside this browser origin.
      const wrappedKey = await crypto.subtle.wrapKey(
        'raw',
        credentialsKey,
        originKey,
        { name: 'AES-GCM', iv }
      );

      return {
        keyB64: this.arrayBufferToBase64(wrappedKey),
        ivB64: this.arrayBufferToBase64(iv.buffer)
      };
    } catch (error) {
      throw new Error(
        `Origin key wrapping failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Unwrap credentials key with origin key
   */
  async unwrapWithOriginKey(
    originKey: CryptoKey,
    keyB64: string,
    ivB64: string
  ): Promise<CryptoKey> {
    try {
      // Decode persisted transport values back into raw wrapped material.
      const wrappedKey = this.base64ToArrayBuffer(keyB64);
      const iv = this.base64ToArrayBuffer(ivB64);

      const credentialsKey = await crypto.subtle.unwrapKey(
        'raw',
        wrappedKey,
        originKey,
        { name: 'AES-GCM', iv },
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      return credentialsKey;
    } catch (error) {
      throw new Error(
        `Origin key unwrapping failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    // btoa operates on a binary string, so bytes are converted one-by-one.
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    // atob returns a binary string that we map back into a typed byte array.
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
