import { SessionCredentials } from '../sessions/types';
import { log } from '../util/log';

/**
 * Handles in-memory credential storage and access.
 * Provides fast access to credentials during the session lifecycle.
 */
export class CredentialCache {
  private cache = new Map<string, string>();

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get a credential value by key
   */
  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  /**
   * Set a credential value by key
   */
  set(key: string, value: string): void {
    this.cache.set(key, value);
  }

  /**
   * Check if a credential exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Check if any credentials are stored
   */
  hasAny(): boolean {
    return this.cache.size > 0;
  }

  /**
   * Clear all cached credentials
   */
  clear(): void {
    this.cache.clear();
    log.info('[CredentialCache] Cache cleared');
  }

  /**
   * Get all cached credentials as a Map
   */
  getAll(): Map<string, string> {
    return new Map(this.cache);
  }

  /**
   * Populate cache from a record of credentials
   */
  hydrate(credentials: Record<string, string>): void {
    for (const [key, value] of Object.entries(credentials)) {
      this.cache.set(key, value);
    }

    log.info('[CredentialCache] Hydrated with credentials:', {
      keys: Object.keys(credentials)
    });
  }

  /**
   * Populate cache from session credentials
   */
  hydrateFromSession(session: SessionCredentials): void {
    this.cache.set('localKey', session.localKey);
    this.cache.set('remoteKey', session.remoteKey);
    this.cache.set('pairingPhrase', session.pairingPhrase);
    this.cache.set('serverHost', session.serverHost);

    log.info('[CredentialCache] Hydrated from session:', {
      hasLocalKey: !!session.localKey,
      hasRemoteKey: !!session.remoteKey,
      hasPairingPhrase: !!session.pairingPhrase,
      serverHost: session.serverHost
    });
  }

  /**
   * Get credential keys for iteration
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get credential values for iteration
   */
  values(): string[] {
    return Array.from(this.cache.values());
  }

  /**
   * Get cache entries for iteration
   */
  entries(): [string, string][] {
    return Array.from(this.cache.entries());
  }

  /**
   * Create a snapshot of current cache state (for debugging)
   */
  snapshot(): Record<string, string> {
    return Object.fromEntries(this.cache.entries());
  }
}
