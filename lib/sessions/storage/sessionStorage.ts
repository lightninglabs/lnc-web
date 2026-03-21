import { createLogger } from '../../util/log';
import { SessionData } from '../types';

const log = createLogger('SessionStorage');

const STORAGE_PREFIX = 'lnc-session:';

const isValidWrappedKey = (key: unknown): boolean => {
  if (!key || typeof key !== 'object') return false;
  const wrappedKey = key as Record<string, unknown>;
  return (
    typeof wrappedKey.keyB64 === 'string' &&
    typeof wrappedKey.ivB64 === 'string'
  );
};

const isValidSessionData = (data: SessionData): boolean => {
  if (
    !data ||
    typeof data.sessionId !== 'string' ||
    typeof data.createdAt !== 'number' ||
    typeof data.expiresAt !== 'number' ||
    typeof data.refreshCount !== 'number' ||
    typeof data.encryptedCredentials !== 'string' ||
    typeof data.credentialsIV !== 'string'
  ) {
    return false;
  }

  // Validate semantic constraints to guard against corrupt or tampered storage.
  if (
    !Number.isFinite(data.createdAt) ||
    !Number.isFinite(data.expiresAt) ||
    data.createdAt <= 0 ||
    data.expiresAt <= 0 ||
    data.createdAt > data.expiresAt ||
    !Number.isInteger(data.refreshCount) ||
    data.refreshCount < 0 ||
    data.sessionId.length === 0
  ) {
    return false;
  }

  return isValidWrappedKey(data.device) && isValidWrappedKey(data.origin);
};

/**
 * Handles session data persistence in sessionStorage with a lazy in-memory
 * cache.
 */
export class SessionStorage {
  /**
   * The cache eliminates redundant reads during session restore and
   * credential access flows. It uses a write-through strategy: save() and
   * clear() update both sessionStorage and the cache atomically.
   *
   * Cache states:
   *   undefined — not yet loaded (cold; triggers a read on first access).
   *   null     — loaded but empty (no data in sessionStorage).
   *   SessionData — loaded and valid.
   */
  private _cache: SessionData | null | undefined = undefined;
  private _namespace: string;

  constructor(namespace: string) {
    this._namespace = namespace;
  }

  save(sessionData: SessionData): void {
    if (typeof sessionStorage === 'undefined') return;

    try {
      const storageKey = `${STORAGE_PREFIX}${this._namespace}`;
      sessionStorage.setItem(storageKey, JSON.stringify(sessionData));
      this._cache = sessionData;
      log.info('Session saved to sessionStorage', {
        namespace: this._namespace,
        sessionId: sessionData.sessionId,
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt,
        refreshCount: sessionData.refreshCount
      });
    } catch (error) {
      log.error('Failed to save session data', {
        namespace: this._namespace,
        error
      });
      throw error;
    }
  }

  load(): SessionData | undefined {
    if (typeof sessionStorage === 'undefined') return undefined;

    // Return cached result if the cache has been populated.
    if (this._cache !== undefined) {
      return this._cache ?? undefined;
    }

    try {
      const storageKey = `${STORAGE_PREFIX}${this._namespace}`;
      const stored = sessionStorage.getItem(storageKey);

      if (!stored) {
        this._cache = null;
        return undefined;
      }

      const parsed: unknown = JSON.parse(stored);

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !isValidSessionData(parsed as SessionData)
      ) {
        log.error('Invalid session data', {
          namespace: this._namespace
        });
        sessionStorage.removeItem(storageKey);
        this._cache = null;
        return undefined;
      }

      const sessionData = parsed as SessionData;
      this._cache = sessionData;
      log.info('Session loaded from sessionStorage', {
        namespace: this._namespace,
        sessionId: sessionData.sessionId,
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt,
        refreshCount: sessionData.refreshCount
      });

      return sessionData;
    } catch (error) {
      log.error('Failed to load session data', {
        namespace: this._namespace,
        error
      });
      try {
        const storageKey = `${STORAGE_PREFIX}${this._namespace}`;
        sessionStorage.removeItem(storageKey);
      } catch (cleanupError) {
        log.warn('Cleanup failed during error recovery', {
          namespace: this._namespace,
          cleanupError
        });
      }
      this._cache = null;
      return undefined;
    }
  }

  clear(): void {
    if (typeof sessionStorage === 'undefined') return;

    try {
      const storageKey = `${STORAGE_PREFIX}${this._namespace}`;
      sessionStorage.removeItem(storageKey);
      this._cache = null;
    } catch (error) {
      log.error('Failed to clear session data', {
        namespace: this._namespace,
        error
      });
    }
  }

  hasData(): boolean {
    if (typeof sessionStorage === 'undefined') return false;

    // Delegate to load() so the cache is populated for subsequent calls.
    if (this._cache === undefined) {
      this.load();
    }

    return this._cache != null;
  }
}
