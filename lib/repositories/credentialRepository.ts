import { UnlockOptions } from '../types/lnc';

/**
 * Interface for credential repositories that manage encrypted storage
 */
export interface CredentialRepository {
    /**
     * Get a decrypted credential value
     */
    getCredential(key: string): Promise<string | undefined>;

    /**
     * Set an encrypted credential value
     */
    setCredential(key: string, value: string): Promise<void>;

    /**
     * Remove a credential
     */
    removeCredential(key: string): Promise<void>;

    /**
     * Check if a credential exists
     */
    hasCredential(key: string): boolean;

    /**
     * Unlock the repository for encryption/decryption
     */
    unlock(options: UnlockOptions): Promise<void>;

    /**
     * Check if the repository is unlocked
     */
    isUnlocked(): boolean;

    /**
     * Lock the repository (clear sensitive data)
     */
    lock(): void;

    /**
     * Clear all stored credentials
     */
    clear(): void;

    /**
     * Check if any credentials are stored
     */
    hasAnyCredentials(): boolean;
}

const STORAGE_PREFIX = 'lnc-web:';

/**
 * Base class for credential repositories with common localStorage functionality
 */
export abstract class BaseCredentialRepository implements CredentialRepository {
    /**
     * The credentials stored in memory for quick access after loading from storage
     */
    private credentials: Map<string, string> = new Map();

    constructor(protected namespace: string) {}

    abstract getCredential(key: string): Promise<string | undefined>;
    abstract setCredential(key: string, value: string): Promise<void>;
    abstract removeCredential(key: string): Promise<void>;
    abstract unlock(options: UnlockOptions): Promise<void>;
    abstract isUnlocked(): boolean;
    abstract lock(): void;

    private get storageKey() {
        return `${STORAGE_PREFIX}${this.namespace}`;
    }

    /**
     * Get the credentials, loading it from storage if it's not already loaded
     */
    private get loadedCredentials() {
        if (this.credentials.size === 0) this.load();
        return this.credentials;
    }

    /**
     * Get a credential by key
     */
    protected get(key: string): string | undefined {
        return this.loadedCredentials.get(key) ?? undefined;
    }

    /**
     * Set a credential by key
     */
    protected set(key: string, value: string): void {
        this.credentials.set(key, value);
        this.save();
    }

    /**
     * Remove a credential by key
     */
    protected remove(key: string): void {
        this.credentials.delete(key);
        this.save();
    }

    /**
     * Check if a credential exists by key
     */
    hasCredential(key: string): boolean {
        return this.loadedCredentials.has(key);
    }

    /**
     * Check if any credentials are stored
     */
    hasAnyCredentials(): boolean {
        return this.loadedCredentials.size > 0;
    }

    /**
     * Clear all credentials
     */
    clear(): void {
        this.credentials.clear();
        this.save();
    }

    /**
     * Save all credentials to storage as a JSON string under a single key
     */
    private save() {
        // do nothing if localStorage is not available on the backend
        if (typeof localStorage === 'undefined') return;

        if (this.credentials.size === 0) {
            localStorage.removeItem(this.storageKey);
            return;
        }

        const data = Object.fromEntries(this.credentials.entries());
        console.log(
            '[CredentialRepository] saving credentials to localStorage',
            data
        );
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    /**
     * Load all credentials from storage as a JSON string under a single key
     */
    private load() {
        // do nothing if localStorage is not available on the backend
        if (typeof localStorage === 'undefined') return;

        const cached = localStorage.getItem(this.storageKey);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                this.credentials = new Map(Object.entries(data));
                console.log(
                    '[CredentialRepository] loaded credentials from localStorage',
                    data
                );
            } catch (error) {
                console.error(
                    `Failed to parse cached credentials for ${this.namespace}:`,
                    error
                );
            }
        }
    }
}
