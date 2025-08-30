import { UnlockMethod, UnlockOptions } from '../types/lnc';

/**
 * Pure encryption service interface - no storage dependencies
 */
export interface EncryptionService {
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
     * Check if the encryption service is currently unlocked
     */
    isUnlocked(): boolean;

    /**
     * Lock the encryption service (clear sensitive data)
     */
    lock(): void;

    /**
     * Get the method this encryption service handles
     */
    getMethod(): UnlockMethod;

    /**
     * Check if this service can handle the given unlock method
     */
    canHandle(method: UnlockMethod): boolean;

    /**
     * Check if this service has stored credentials/data available
     */
    hasStoredData(): Promise<boolean>;
}
