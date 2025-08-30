import {
  PasswordEncryptionService,
} from '../encryption/passwordEncryptionService';
import { UnlockOptions } from '../types/lnc';
import { BaseCredentialRepository } from './credentialRepository';

/**
 * Password-based credential repository.
 * Uses localStorage directly for storage and PasswordEncryptionService for encryption.
 */
export class PasswordCredentialRepository extends BaseCredentialRepository {
    constructor(
        namespace: string,
        private encryption: PasswordEncryptionService
    ) {
        super(namespace);
    }

    async unlock(options: UnlockOptions): Promise<void> {
        if (options.method !== 'password') {
            throw new Error(
                'Password repository requires password unlock method'
            );
        }

        // Load salt and cipher from localStorage directly
        const salt = this.get('salt');
        const cipher = this.get('cipher');

        await this.encryption.unlock({
            method: 'password',
            password: options.password!,
            salt,
            cipher
        });

        // If first time (no salt), store salt and test cipher
        if (!salt) {
            this.set('salt', this.encryption.getSalt());
            this.set('cipher', this.encryption.createTestCipher());
        }
    }

    async getCredential(key: string): Promise<string | undefined> {
        const encrypted = this.get(key);
        if (!encrypted) {
            return undefined;
        }

        try {
            return await this.encryption.decrypt(encrypted);
        } catch (error) {
            console.error(`Failed to decrypt credential ${key}:`, error);
            return undefined;
        }
    }

    async setCredential(key: string, value: string): Promise<void> {
        if (!this.encryption.isUnlocked()) {
            throw new Error('Repository is locked. Call unlock() first.');
        }

        const encrypted = await this.encryption.encrypt(value);
        this.set(key, encrypted);
    }

    isUnlocked(): boolean {
        return this.encryption.isUnlocked();
    }

    lock(): void {
        this.encryption.lock();
    }

    /**
     * Check if this repository has stored authentication data (salt/cipher)
     */
    hasStoredAuthData(): boolean {
        return this.hasCredential('salt') && this.hasCredential('cipher');
    }
}
