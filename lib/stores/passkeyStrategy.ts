import {
  PasskeyEncryptionService,
} from '../encryption/passkeyEncryptionService';
import {
  PasskeyCredentialRepository,
} from '../repositories/passkeyCredentialRepository';
import { UnlockOptions } from '../types/lnc';
import { AuthStrategy } from './authStrategy';

/**
 * Passkey-based authentication strategy.
 * Handles WebAuthn passkey encryption/decryption and IndexedDB persistence.
 */
export class PasskeyStrategy implements AuthStrategy {
    readonly method = 'passkey' as const;
    private repository: PasskeyCredentialRepository;

    constructor(namespace: string) {
        const encryption = new PasskeyEncryptionService(namespace);
        this.repository = new PasskeyCredentialRepository(
            namespace,
            encryption
        );
    }

    isSupported(): boolean {
        // Check if WebAuthn is supported
        return (
            typeof window !== 'undefined' &&
            !!(
                window.PublicKeyCredential &&
                window.PublicKeyCredential
                    .isUserVerifyingPlatformAuthenticatorAvailable
            )
        );
    }

    isUnlocked(): boolean {
        return this.repository.isUnlocked();
    }

    async unlock(options: UnlockOptions): Promise<boolean> {
        if (options.method !== 'passkey') {
            return false;
        }

        try {
            await this.repository.unlock(options);
            return true;
        } catch (error) {
            console.error('[PasskeyStrategy] Unlock failed:', error);
            return false;
        }
    }

    hasAnyCredentials(): boolean {
        return this.repository.hasAnyCredentials();
    }

    hasStoredAuthData(): boolean {
        return this.repository.hasStoredAuthData();
    }

    async getCredential(key: string): Promise<string | undefined> {
        if (!this.isUnlocked()) {
            console.warn(
                '[PasskeyStrategy] Cannot get credential - not unlocked'
            );
            return undefined;
        }

        try {
            return await this.repository.getCredential(key);
        } catch (error) {
            console.error(
                `[PasskeyStrategy] Failed to get credential ${key}:`,
                error
            );
            return undefined;
        }
    }

    async setCredential(key: string, value: string): Promise<void> {
        if (!this.isUnlocked()) {
            console.warn(
                '[PasskeyStrategy] Cannot set credential - not unlocked'
            );
            return;
        }

        try {
            await this.repository.setCredential(key, value);
        } catch (error) {
            console.error(
                `[PasskeyStrategy] Failed to set credential ${key}:`,
                error
            );
            throw error;
        }
    }

    clear(): void {
        this.repository.clear();
    }
}
