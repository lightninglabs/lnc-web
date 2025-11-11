/**
 * Crypto service for session credential encryption and key wrapping operations.
 * Provides AES-GCM encryption and key wrapping functionality for session management.
 */
export default class CryptoService {
  /**
   * Generate a random credentials key for encrypting session data
   */
  async generateRandomCredentialsKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true, // extractable - required for wrapKey operations
      ['encrypt', 'decrypt']
    );
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

      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        credentialsKey,
        data
      );

      return {
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
  ): Promise<{ keyB64: string; ivB64: string }> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));

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
  ): Promise<{ keyB64: string; ivB64: string }> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));

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
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
