import { PasskeyEncryptionService } from '../encryption/passkeyEncryptionService';
import { UnlockOptions } from '../types/lnc';
import { log } from '../util/log';
import { BaseCredentialRepository } from './credentialRepository';

/**
 * Passkey-based credential repository.
 * Uses localStorage directly for storage and PasskeyEncryptionService for encryption.
 */
export class PasskeyCredentialRepository extends BaseCredentialRepository {
  constructor(namespace: string, private encryption: PasskeyEncryptionService) {
    super(namespace);
  }

  /**
   * Unlock the underlying encryption service using an existing or newly
   * created passkey credential, persisting the credential ID if needed.
   */
  async unlock(options: UnlockOptions): Promise<void> {
    if (options.method !== 'passkey') {
      throw new Error('Passkey repository requires passkey unlock method');
    }

    // Load credential ID from localStorage directly (already in base64url format for WebAuthn)
    const credentialId = this.get('passkeyCredentialId');

    await this.encryption.unlock({
      method: 'passkey',
      credentialId,
      createIfMissing: options.createIfMissing ?? false
    });

    // If created new passkey, store credential ID
    if (
      (options.createIfMissing || !credentialId) &&
      this.encryption.isUnlocked
    ) {
      const rawCredentialId = this.encryption.getCredentialId();
      // WebAuthn credential IDs are base64url encoded - store as-is for localStorage
      this.set('passkeyCredentialId', rawCredentialId);
    }
  }

  /**
   * Load and decrypt a credential value by key, or return undefined
   * if no value is stored or decryption fails.
   */
  async getCredential(key: string): Promise<string | undefined> {
    const encrypted = this.get(key);
    if (!encrypted) {
      return undefined;
    }

    try {
      return await this.encryption.decrypt(encrypted);
    } catch (error) {
      log.error(`Failed to decrypt credential ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Encrypt and persist a credential value under the given key.
   * Throws if the repository has not been unlocked.
   */
  async setCredential(key: string, value: string): Promise<void> {
    if (!this.encryption.isUnlocked) {
      throw new Error('Repository is locked. Call unlock() first.');
    }

    const encrypted = await this.encryption.encrypt(value);
    this.set(key, encrypted);
  }

  /**
   * Returns true when the underlying encryption service is unlocked.
   */
  get isUnlocked(): boolean {
    return this.encryption.isUnlocked;
  }

  /**
   * Check if this repository has stored authentication data (credential ID)
   */
  get hasStoredAuthData(): boolean {
    return this.hasCredential('passkeyCredentialId');
  }

  /**
   * Lock the underlying encryption service and clear in-memory key material.
   */
  lock(): void {
    this.encryption.lock();
  }
}
