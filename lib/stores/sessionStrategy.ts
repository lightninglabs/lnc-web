import SessionManager from '../sessions/sessionManager';
import { SessionCredentials } from '../sessions/types';
import { UnlockOptions } from '../types/lnc';
import { log } from '../util/log';
import { AuthStrategy } from './authStrategy';

/**
 * Session-based authentication strategy.
 * Handles session restoration and temporary credential access.
 */
export class SessionStrategy implements AuthStrategy {
  readonly method = 'session' as const;

  constructor(private sessionManager: SessionManager) {}

  get isSupported(): boolean {
    return true;
  }

  get isUnlocked(): boolean {
    return this.sessionManager.hasActiveSession;
  }

  get hasAnyCredentials(): boolean {
    return this.sessionManager.hasActiveSession;
  }

  /**
   * Clear the session strategy
   */
  clear(): void {
    this.sessionManager.clearSession();
  }

  /**
   * Unlock the session strategy
   */
  async unlock(options: UnlockOptions): Promise<boolean> {
    if (options.method !== 'session') {
      return false;
    }

    try {
      const session = await this.sessionManager.restoreSession();
      return !!session;
    } catch (error) {
      log.error('[SessionStrategy] Session restore failed:', error);
      return false;
    }
  }

  /**
   * Check if the session can be automatically restored
   */
  async canAutoRestore(): Promise<boolean> {
    if (!this.sessionManager.canAutoRestore) {
      return false;
    }

    return await this.sessionManager.hasValidSession();
  }

  /**
   * Get a credential from the session strategy
   */
  async getCredential(key: string): Promise<string | undefined> {
    if (!this.isUnlocked) {
      log.warn('[SessionStrategy] Cannot get credential - no active session');
      return undefined;
    }

    try {
      const session = await this.sessionManager.restoreSession();
      if (session && key in session) {
        return session[key as keyof SessionCredentials].toString();
      }
      return undefined;
    } catch (error) {
      log.error(`[SessionStrategy] Failed to get credential ${key}:`, error);
      // don't throw an error here, just return undefined to indicate that the credential
      // could not be retrieved.
      return undefined;
    }
  }

  /**
   * Set a credential in the session strategy
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async setCredential(key: string, value: string): Promise<void> {
    log.warn(
      `[SessionStrategy] setCredential(${key}) not supported - use createSession() instead`
    );
    throw new Error(
      'SessionStrategy does not support direct credential storage'
    );
  }
}
