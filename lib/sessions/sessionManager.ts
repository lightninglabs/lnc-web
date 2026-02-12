import { SessionConfig } from '../types/lnc';
import { log } from '../util/log';
import { SessionStorage } from './storage/sessionStorage';
import { SessionCredentials, SessionData } from './types';

const DEFAULT_CONFIG: Required<SessionConfig> = {
  sessionDuration: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * Session manager handles creation, restoration, and management of passwordless sessions.
 * Basic implementation that stores session credentials in sessionStorage.
 */
export default class SessionManager {
  private storage: SessionStorage;
  private namespace: string;

  config: Required<SessionConfig>;

  constructor(namespace: string, config?: SessionConfig) {
    this.namespace = namespace;
    this.storage = new SessionStorage(namespace);
    this.config = Object.assign({}, DEFAULT_CONFIG, config);
  }

  /**
   * Check if auto-restore is available
   */
  get canAutoRestore(): boolean {
    return this.storage.hasData();
  }

  /**
   * Get time until session expiry in milliseconds
   */
  get sessionTimeRemaining(): number {
    const sessionData = this.storage.load();
    if (!sessionData) {
      return 0;
    }

    return Math.max(0, sessionData.expiresAt - Date.now());
  }

  /**
   * Check if there's an active session
   */
  get hasActiveSession(): boolean {
    const sessionData = this.storage.load();
    return sessionData != null && Date.now() < sessionData.expiresAt;
  }

  /**
   * Get the namespace for this session manager
   */
  getNamespace(): string {
    return this.namespace;
  }

  /**
   * Clear the current session
   */
  clearSession(): void {
    this.storage.clear();
  }

  /**
   * Create a new password-less session
   */
  async createSession(credentials: SessionCredentials): Promise<void> {
    const sessionId = this.generateSecureSessionId();
    const createdAt = Date.now();
    const expiresAt = createdAt + this.config.sessionDuration;

    const sessionData: SessionData = {
      sessionId,
      createdAt,
      expiresAt,
      refreshCount: 0,
      credentials
    };

    this.storage.save(sessionData);
    log.info('[SessionManager] Session created successfully');
  }

  /**
   * Restore a session without password
   */
  async restoreSession(): Promise<SessionCredentials | undefined> {
    log.info('[SessionManager] Starting session restoration...');
    try {
      const sessionData = this.storage.load();
      if (!sessionData) {
        log.info('[SessionManager] No session data found');
        return undefined;
      }

      if (Date.now() > sessionData.expiresAt) {
        log.info('[SessionManager] Session expired');
        this.storage.clear();
        return undefined;
      }

      log.info('[SessionManager] Session restoration successful!');
      return sessionData.credentials;
    } catch (error) {
      log.error('[SessionManager] Session restoration failed:', error);
      this.storage.clear();
      // don't throw an error here, just return undefined to indicate that the session
      // could not be restored.
      return undefined;
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<boolean> {
    try {
      const sessionData = this.storage.load();
      if (!sessionData) {
        return false;
      }

      const expiresAt = Date.now() + this.config.sessionDuration;
      sessionData.expiresAt = expiresAt;
      sessionData.refreshCount += 1;

      this.storage.save(sessionData);
      return true;
    } catch (error) {
      log.error('[SessionManager] Session refresh failed:', error);
      return false;
    }
  }

  /**
   * Check if there's a valid session by attempting to restore it
   */
  async hasValidSession(): Promise<boolean> {
    if (!this.hasActiveSession) {
      return false;
    }

    try {
      const credentials = await this.restoreSession();
      return !!credentials;
    } catch (error) {
      log.error('[SessionManager] Failed to check for valid session', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Generate a cryptographically secure session ID
   */
  private generateSecureSessionId(): string {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }

    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  }
}
