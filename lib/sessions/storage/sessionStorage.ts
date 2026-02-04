import { log } from '../../util/log';
import { SessionData } from '../types';

const STORAGE_PREFIX = 'lnc-session:';

const isValidWrappedKey = (key: unknown): boolean => {
  if (!key || typeof key !== 'object') return false;
  const k = key as Record<string, unknown>;
  return typeof k.keyB64 === 'string' && typeof k.ivB64 === 'string';
};

const isValidSessionData = (data: SessionData): boolean => {
  if (
    !data ||
    typeof data.sessionId !== 'string' ||
    typeof data.deviceFingerprint !== 'string' ||
    typeof data.createdAt !== 'number' ||
    typeof data.expiresAt !== 'number' ||
    typeof data.refreshCount !== 'number' ||
    typeof data.encryptedCredentials !== 'string' ||
    typeof data.credentialsIV !== 'string'
  ) {
    return false;
  }

  return isValidWrappedKey(data.device) && isValidWrappedKey(data.origin);
};

/**
 * Handles session data persistence in sessionStorage.
 */
export class SessionStorage {
  constructor(private namespace: string) {}

  save(sessionData: SessionData): void {
    if (typeof sessionStorage === 'undefined') return;

    try {
      const storageKey = `${STORAGE_PREFIX}${this.namespace}`;
      sessionStorage.setItem(storageKey, JSON.stringify(sessionData));
      log.info('[SessionStorage] Session saved to sessionStorage', {
        namespace: this.namespace,
        sessionId: sessionData.sessionId,
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt,
        refreshCount: sessionData.refreshCount
      });
    } catch (error) {
      log.error('[SessionStorage] Failed to save session data', {
        namespace: this.namespace,
        error
      });
    }
  }

  load(): SessionData | undefined {
    if (typeof sessionStorage === 'undefined') return undefined;

    try {
      const storageKey = `${STORAGE_PREFIX}${this.namespace}`;
      const stored = sessionStorage.getItem(storageKey);

      if (!stored) {
        return undefined;
      }

      const parsed: unknown = JSON.parse(stored);

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !isValidSessionData(parsed as SessionData)
      ) {
        log.error('[SessionStorage] Invalid session data', {
          namespace: this.namespace
        });
        return undefined;
      }

      const sessionData = parsed as SessionData;
      log.info('[SessionStorage] Session loaded from sessionStorage', {
        namespace: this.namespace,
        sessionId: sessionData.sessionId,
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt,
        refreshCount: sessionData.refreshCount
      });

      return sessionData;
    } catch (error) {
      log.error('[SessionStorage] Failed to load session data', {
        namespace: this.namespace,
        error
      });
      return undefined;
    }
  }

  clear(): void {
    if (typeof sessionStorage === 'undefined') return;

    try {
      const storageKey = `${STORAGE_PREFIX}${this.namespace}`;
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      log.error('[SessionStorage] Failed to clear session data', {
        namespace: this.namespace,
        error
      });
    }
  }

  hasData(): boolean {
    if (typeof sessionStorage === 'undefined') return false;

    try {
      const storageKey = `${STORAGE_PREFIX}${this.namespace}`;
      return sessionStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  }
}
