import {
  PasswordEncryptionService,
} from '../encryption/passwordEncryptionService';
import {
  PasswordCredentialRepository,
} from '../repositories/passwordCredentialRepository';
import { UnlockOptions } from '../types/lnc';
import { AuthStrategy } from './authStrategy';

/**
 * Password-based authentication strategy.
 * Handles password encryption/decryption and localStorage persistence.
 */
export class PasswordStrategy implements AuthStrategy {
    readonly method = 'password' as const;
    private repository: PasswordCredentialRepository;

    constructor(namespace: string) {
        const encryption = new PasswordEncryptionService();
        this.repository = new PasswordCredentialRepository(
            namespace,
            encryption
        );
    }

    isSupported(): boolean {
        return true; // Password auth is always supported
    }

    isUnlocked(): boolean {
        return this.repository.isUnlocked();
    }

    async unlock(options: UnlockOptions): Promise<boolean> {
        if (options.method !== 'password') {
            return false;
        }

        if (!options.password) {
            console.error('[PasswordStrategy] Password required for unlock');
            return false;
        }

        try {
            await this.repository.unlock(options);
            return true;
        } catch (error) {
            console.error('[PasswordStrategy] Unlock failed:', error);
            return false;
        }
    }

    hasAnyCredentials(): boolean {
        return this.repository.hasAnyCredentials();
    }

    async getCredential(key: string): Promise<string | undefined> {
        if (!this.isUnlocked()) {
            console.warn(
                '[PasswordStrategy] Cannot get credential - not unlocked'
            );
            return undefined;
        }

        try {
            return await this.repository.getCredential(key);
        } catch (error) {
            console.error(
                `[PasswordStrategy] Failed to get credential ${key}:`,
                error
            );
            return undefined;
        }
    }

    async setCredential(key: string, value: string): Promise<void> {
        if (!this.isUnlocked()) {
            console.warn(
                '[PasswordStrategy] Cannot set credential - not unlocked'
            );
            return;
        }

        try {
            await this.repository.setCredential(key, value);
        } catch (error) {
            console.error(
                `[PasswordStrategy] Failed to set credential ${key}:`,
                error
            );
            throw error;
        }
    }

    clear(): void {
        this.repository.clear();
    }
}
