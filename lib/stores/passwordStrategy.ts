import { PasswordEncryptionService } from '../encryption/passwordEncryptionService';
import { PasswordCredentialRepository } from '../repositories/passwordCredentialRepository';
import { UnlockMethod, UnlockOptions } from '../types/lnc';
import { log } from '../util/log';
import { AuthStrategy } from './authStrategy';

/**
 * Password-based authentication strategy.
 * Handles password encryption/decryption and localStorage persistence.
 */
export class PasswordStrategy implements AuthStrategy {
  readonly method: UnlockMethod = 'password';
  private repository: PasswordCredentialRepository;

  constructor(namespace: string) {
    const encryption = new PasswordEncryptionService();
    this.repository = new PasswordCredentialRepository(namespace, encryption);
  }

  /**
   * Return true if this strategy can be used in the current environment.
   * Password auth is always supported.
   */
  get isSupported(): boolean {
    return true; // Password auth is always supported
  }

  /**
   * Returns true when the underlying repository is unlocked.
   */
  get isUnlocked(): boolean {
    return this.repository.isUnlocked;
  }

  /**
   * Return true if this strategy has any stored credentials in its backing store.
   */
  get hasAnyCredentials(): boolean {
    return this.repository.hasAnyCredentials;
  }

  /**
   * Attempt to unlock this strategy using the provided password.
   * Returns false if the method is not `password` or unlock fails.
   */
  async unlock(options: UnlockOptions): Promise<boolean> {
    if (options.method !== 'password') {
      return false;
    }

    if (!options.password) {
      log.error('[PasswordStrategy] Password required for unlock');
      return false;
    }

    try {
      await this.repository.unlock(options);
      return true;
    } catch (error) {
      log.error('[PasswordStrategy] Unlock failed:', error);
      return false;
    }
  }

  /**
   * Get a decrypted credential value by key from the backing store,
   * or undefined if the strategy is not unlocked or the value is missing.
   */
  async getCredential(key: string): Promise<string | undefined> {
    if (!this.isUnlocked) {
      log.warn('[PasswordStrategy] Cannot get credential - not unlocked');
      return undefined;
    }

    try {
      return await this.repository.getCredential(key);
    } catch (error) {
      log.error(`[PasswordStrategy] Failed to get credential ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Encrypt and persist a credential value in the backing store.
   * Logs and returns without throwing if the strategy is not unlocked.
   */
  async setCredential(key: string, value: string): Promise<void> {
    if (!this.isUnlocked) {
      log.warn('[PasswordStrategy] Cannot set credential - not unlocked');
      return;
    }

    try {
      await this.repository.setCredential(key, value);
    } catch (error) {
      log.error(`[PasswordStrategy] Failed to set credential ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all data managed by this strategy from its backing store.
   */
  clear(): void {
    this.repository.clear();
  }
}
