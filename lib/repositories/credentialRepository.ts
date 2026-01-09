import { UnlockOptions } from '../types/lnc';
import { log } from '../util/log';

/**
 * Interface for credential repositories that manage how encrypted credentials are stored
 * and retrieved. The base class handles localStorage operations (serializing all
 * credentials under a single namespaced key) while subclasses manage the unlock/lock
 * lifecycle specific to their encryption method.
 */
export interface CredentialRepository {
  /**
   * Check if the repository is unlocked
   */
  get isUnlocked(): boolean;

  /**
   * Check if any credentials exist (sync for performance)
   */
  get hasAnyCredentials(): boolean;

  /**
   * Get a decrypted credential value (async due to encryption/decryption)
   */
  getCredential(key: string): Promise<string | undefined>;

  /**
   * Set an encrypted credential value (async due to encryption)
   */
  setCredential(key: string, value: string): Promise<void>;

  /**
   * Remove a credential (async for consistency and future extensibility)
   * Default implementation provided in BaseCredentialRepository
   */
  removeCredential(key: string): Promise<void>;

  /**
   * Check if a credential exists (sync for performance)
   */
  hasCredential(key: string): boolean;

  /**
   * Unlock the repository for encryption/decryption
   */
  unlock(options: UnlockOptions): Promise<void>;

  /**
   * Lock the repository (clear sensitive data)
   */
  lock(): void;

  /**
   * Clear all stored credentials
   */
  clear(): void;
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

  //
  // Abstract methods that must be implemented by concrete repositories
  //

  abstract get isUnlocked(): boolean;

  abstract getCredential(key: string): Promise<string | undefined>;
  abstract setCredential(key: string, value: string): Promise<void>;
  abstract unlock(options: UnlockOptions): Promise<void>;
  abstract lock(): void;

  //
  // Public methods that can be overridden by concrete repositories
  //

  /**
   * Check if any credentials are stored
   */
  get hasAnyCredentials(): boolean {
    return this.loadedCredentials.size > 0;
  }

  /**
   * Remove a credential by key. This is async for consistency and future extensibility.
   */
  async removeCredential(key: string): Promise<void> {
    this.remove(key);
  }

  /**
   * Check if a credential exists by key
   */
  hasCredential(key: string): boolean {
    return this.loadedCredentials.has(key);
  }

  /**
   * Clear all credentials
   */
  clear(): void {
    this.credentials.clear();
    this.save();
  }

  //
  // Private methods
  //

  /**
   * Get the storage key for the repository
   */
  private get storageKey() {
    return `${STORAGE_PREFIX}${this.namespace}`;
  }

  /**
   * Get the credentials, loading them from storage if they are not already loaded
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
   * Save all credentials to storage as a JSON string under a single key
   */
  private save() {
    // do nothing if localStorage is not available on the backend
    if (typeof globalThis.localStorage === 'undefined') return;

    if (this.credentials.size === 0) {
      globalThis.localStorage.removeItem(this.storageKey);
      return;
    }

    const data = Object.fromEntries(this.credentials.entries());
    log.info('[CredentialRepository] saving credentials to localStorage');
    globalThis.localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  /**
   * Load all credentials from storage as a JSON string under a single key
   */
  private load() {
    // do nothing if localStorage is not available
    if (typeof globalThis.localStorage === 'undefined') return;

    const cached = globalThis.localStorage.getItem(this.storageKey);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        this.credentials = new Map(Object.entries(data));
        log.info('[CredentialRepository] loaded credentials from localStorage');
      } catch (error) {
        log.error(
          `Failed to parse cached credentials for ${this.namespace}:`,
          error
        );
      }
    }
  }
}
