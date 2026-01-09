import { UnlockMethod, UnlockOptions } from '../types/lnc';
import {
  createTestCipher,
  decrypt,
  encrypt,
  generateSalt,
  verifyTestCipher
} from '../util/encryption';
import { EncryptionService } from './encryptionService';

/**
 * Pure password-based encryption service.
 * No storage dependencies - just crypto operations.
 */
export class PasswordEncryptionService implements EncryptionService {
  private password?: string;
  private salt?: string;
  // Indicates that unlock() has been called and the password has been verified
  // against the test cipher.
  private isUnlockedState = false;

  /**
   * Get the unlock method handled by this service (`password`).
   */
  get method(): UnlockMethod {
    return 'password';
  }

  /**
   * Returns true when a password and salt are set and the service is unlocked.
   */
  get isUnlocked(): boolean {
    return this.isUnlockedState && !!this.password && !!this.salt;
  }

  /**
   * Encrypt a plaintext string using the currently unlocked password and salt.
   * Throws if the service has not been unlocked.
   */
  async encrypt(data: string): Promise<string> {
    if (!this.isUnlocked || !this.password || !this.salt) {
      throw new Error('Encryption service is locked. Call unlock() first.');
    }
    return encrypt(data, this.password, this.salt);
  }

  /**
   * Decrypt a ciphertext string using the currently unlocked password and salt.
   * Throws if the service has not been unlocked.
   */
  async decrypt(data: string): Promise<string> {
    if (!this.isUnlocked || !this.password || !this.salt) {
      throw new Error('Encryption service is locked. Call unlock() first.');
    }
    return decrypt(data, this.password, this.salt);
  }

  /**
   * Unlock the service with the given password (and optional salt/cipher).
   * For existing users, verifies the password using the stored test cipher.
   */
  async unlock(options: UnlockOptions): Promise<void> {
    if (options.method !== 'password') {
      throw new Error(
        'Password encryption service requires password unlock method'
      );
    }

    if (!options.password) {
      throw new Error('Password is required for password unlock');
    }

    this.password = options.password;

    // If salt is provided (existing user), use it
    if (options.salt) {
      this.salt = options.salt;

      // Verify password is correct by checking test cipher
      if (options.cipher) {
        try {
          if (!verifyTestCipher(options.cipher, this.password, this.salt)) {
            throw new Error('Invalid password');
          }
        } catch {
          throw new Error('Invalid password');
        }
      }
    } else {
      // New user - generate new salt
      this.salt = generateSalt();
    }

    this.isUnlockedState = true;
  }

  /**
   * Clear all in-memory password material and reset the unlocked state.
   */
  lock(): void {
    this.password = undefined;
    this.salt = undefined;
    this.isUnlockedState = false;
  }

  /**
   * Return true if this service can handle the provided unlock method.
   */
  canHandle(method: UnlockMethod): boolean {
    return method === 'password';
  }

  /**
   * Get the current salt (for storage by repository)
   */
  getSalt(): string {
    if (!this.salt) {
      throw new Error('No salt available - unlock first');
    }
    return this.salt;
  }

  /**
   * Generate a test cipher (for storage by repository)
   */
  createTestCipher(): string {
    if (!this.password || !this.salt) {
      throw new Error('No password/salt available - unlock first');
    }
    return createTestCipher(this.password, this.salt);
  }
}
