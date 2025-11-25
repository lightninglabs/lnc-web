import { UnlockMethod, UnlockOptions } from '../types/lnc';

/**
 * Pure encryption service interface - no storage dependencies
 */
export interface EncryptionService {
  /**
   * Get the method this encryption service handles
   */
  get method(): UnlockMethod;

  /**
   * Check if the encryption service is currently unlocked
   */
  get isUnlocked(): boolean;

  /**
   * Encrypt data using the current encryption key
   */
  encrypt(data: string): Promise<string>;

  /**
   * Decrypt data using the current encryption key
   */
  decrypt(data: string): Promise<string>;

  /**
   * Unlock the encryption service with the provided options
   */
  unlock(options: UnlockOptions): Promise<void>;

  /**
   * Lock the encryption service (clear sensitive data)
   */
  lock(): void;

  /**
   * Check if this service can handle the given unlock method
   */
  canHandle(method: UnlockMethod): boolean;
}
