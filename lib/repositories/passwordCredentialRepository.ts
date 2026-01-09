import { PasswordEncryptionService } from '../encryption/passwordEncryptionService';
import { UnlockOptions } from '../types/lnc';
import { log } from '../util/log';
import { BaseCredentialRepository } from './credentialRepository';

/**
 * Password-based credential repository.
 * Uses localStorage for storage and PasswordEncryptionService for encryption.
 */
export class PasswordCredentialRepository extends BaseCredentialRepository {
  constructor(
    namespace: string,
    private encryption: PasswordEncryptionService
  ) {
    super(namespace);
  }

  /**
   * Returns true when the underlying encryption service is unlocked.
   */
  get isUnlocked(): boolean {
    return this.encryption.isUnlocked;
  }

  /**
   * Check if this repository has stored authentication data (salt/cipher)
   */
  get hasStoredAuthData(): boolean {
    return this.hasCredential('salt') && this.hasCredential('cipher');
  }

  /**
   * Unlock the underlying encryption service using the provided password,
   * loading any stored salt/cipher from localStorage.
   */
  async unlock(options: UnlockOptions): Promise<void> {
    if (options.method !== 'password') {
      throw new Error('Password repository requires password unlock method');
    }

    // Load salt and cipher from localStorage directly
    const salt = this.get('salt');
    const cipher = this.get('cipher');

    await this.encryption.unlock({
      method: 'password',
      password: options.password,
      salt,
      cipher
    });

    // If first time (no salt), store salt and test cipher
    if (!salt) {
      this.set('salt', this.encryption.getSalt());
      this.set('cipher', this.encryption.createTestCipher());
    }
  }

  /**
   * Load and decrypt a credential value by key, or return undefined
   * if no value is stored or decryption fails.
   */
  async getCredential(key: string): Promise<string | undefined> {
    const encrypted = this.get(key);
    if (!encrypted) {
      log.debug(
        `No encrypted credential found for ${key} in ${this.namespace}`
      );
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
   * Lock the underlying encryption service and clear in-memory key material.
   */
  lock(): void {
    this.encryption.lock();
  }
}
