import { UnlockMethod, UnlockOptions } from '../types/lnc';

/**
 * Interface for authentication strategies used by UnifiedCredentialStore.
 * Each strategy handles a specific authentication method (password, passkey, etc.)
 * and provides a consistent interface for credential storage and retrieval.
 */
export interface AuthStrategy {
    /** The authentication method this strategy handles */
    readonly method: UnlockMethod;

    /** Check if this strategy is supported in the current environment */
    isSupported(): boolean;

    /** Check if this strategy is currently unlocked */
    isUnlocked(): boolean;

    /** Attempt to unlock this strategy with the provided options */
    unlock(options: UnlockOptions): Promise<boolean>;

    /** Check if this strategy has any stored credentials */
    hasAnyCredentials(): boolean;

    /** Get a credential value from this strategy's storage */
    getCredential(key: string): Promise<string | undefined>;

    /** Set a credential value in this strategy's storage */
    setCredential(key: string, value: string): Promise<void>;

    /** Clear the strategy's state */
    clear(): void;

    /** Strategy-specific methods that may be implemented */
    hasStoredAuthData?(): boolean; // For passkeys
    canAutoRestore?(): Promise<boolean>; // For sessions
}
