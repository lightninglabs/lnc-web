import { UnlockMethod, UnlockOptions } from '../types/lnc';
import {
  createTestCipher,
  decrypt,
  encrypt,
  generateSalt,
  verifyTestCipher,
} from '../util/encryption';
import { EncryptionService } from './encryptionService';

/**
 * Pure password-based encryption service.
 * No storage dependencies - just crypto operations.
 */
export class PasswordEncryptionService implements EncryptionService {
    private password?: string;
    private salt?: string;
    private isUnlockedState: boolean = false;

    constructor(password?: string) {
        if (password) {
            this.password = password;
            this.salt = generateSalt();
            this.isUnlockedState = true;
        }
    }

    async encrypt(data: string): Promise<string> {
        if (!this.isUnlocked() || !this.password || !this.salt) {
            throw new Error(
                'Encryption service is locked. Call unlock() first.'
            );
        }
        return encrypt(data, this.password, this.salt);
    }

    async decrypt(data: string): Promise<string> {
        if (!this.isUnlocked() || !this.password || !this.salt) {
            throw new Error(
                'Encryption service is locked. Call unlock() first.'
            );
        }
        return decrypt(data, this.password, this.salt);
    }

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
                    if (
                        !verifyTestCipher(
                            options.cipher,
                            this.password,
                            this.salt
                        )
                    ) {
                        throw new Error('Invalid password');
                    }
                } catch (error) {
                    throw new Error('Invalid password');
                }
            }
        } else {
            // New user - generate new salt
            this.salt = generateSalt();
        }

        this.isUnlockedState = true;
    }

    isUnlocked(): boolean {
        return this.isUnlockedState && !!this.password && !!this.salt;
    }

    lock(): void {
        this.password = undefined;
        this.salt = undefined;
        this.isUnlockedState = false;
    }

    getMethod(): UnlockMethod {
        return 'password';
    }

    canHandle(method: UnlockMethod): boolean {
        return method === 'password';
    }

    async hasStoredData(): Promise<boolean> {
        // Password encryption itself doesn't store data
        // The repository layer will check for stored salt/cipher
        return false;
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
