import { PasskeyEncryptionService } from '../encryption/passkeyEncryptionService';
import { PasskeyCredentialRepository } from '../repositories/passkeyCredentialRepository';
import { UnlockOptions } from '../types/lnc';
import { log } from '../util/log';
import { AuthStrategy } from './authStrategy';

/**
 * Passkey-based authentication strategy.
 * Handles WebAuthn passkey encryption/decryption and IndexedDB persistence.
 */
export class PasskeyStrategy implements AuthStrategy {
  readonly method = 'passkey' as const;
  private repository: PasskeyCredentialRepository;

  constructor(namespace: string, displayName: string) {
    const encryption = new PasskeyEncryptionService(namespace, displayName);
    this.repository = new PasskeyCredentialRepository(namespace, encryption);
  }

  /**
   * Return true if this strategy can be used in the current environment,
   * i.e. when WebAuthn platform authenticators are available.
   */
  get isSupported(): boolean {
    // Check if WebAuthn is supported
    return (
      typeof window !== 'undefined' &&
      !!(
        window.PublicKeyCredential &&
        window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
      )
    );
  }

  /**
   * Returns true when the underlying repository is unlocked.
   */
  get isUnlocked(): boolean {
    return this.repository.isUnlocked;
  }

  /**
   * Attempt to unlock this strategy using a passkey credential.
   * Returns false if the method is not `passkey` or unlock fails.
   */
  async unlock(options: UnlockOptions): Promise<boolean> {
    if (options.method !== 'passkey') {
      return false;
    }

    try {
      await this.repository.unlock(options);
      return true;
    } catch (error) {
      log.error('[PasskeyStrategy] Unlock failed:', error);
      return false;
    }
  }

  /**
   * Return true if this strategy has any stored credentials in its backing store.
   */
  get hasAnyCredentials(): boolean {
    return this.repository.hasAnyCredentials;
  }

  /**
   * Return true if this strategy has stored authentication data (credential ID)
   * and can likely perform a passkey-based unlock.
   */
  hasStoredAuthData(): boolean {
    return this.repository.hasStoredAuthData;
  }

  /**
   * Get a decrypted credential value by key from the backing store,
   * or undefined if the strategy is not unlocked or the value is missing.
   */
  async getCredential(key: string): Promise<string | undefined> {
    if (!this.isUnlocked) {
      log.warn('[PasskeyStrategy] Cannot get credential - not unlocked');
      return undefined;
    }

    try {
      return await this.repository.getCredential(key);
    } catch (error) {
      log.error(`[PasskeyStrategy] Failed to get credential ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Encrypt and persist a credential value in the backing store.
   * Logs and returns without throwing if the strategy is not unlocked.
   */
  async setCredential(key: string, value: string): Promise<void> {
    if (!this.isUnlocked) {
      log.warn('[PasskeyStrategy] Cannot set credential - not unlocked');
      return;
    }

    try {
      await this.repository.setCredential(key, value);
    } catch (error) {
      log.error(`[PasskeyStrategy] Failed to set credential ${key}:`, error);
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
