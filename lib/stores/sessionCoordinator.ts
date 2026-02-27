import SessionManager from '../sessions/sessionManager';
import SessionRefreshManager from '../sessions/sessionRefreshManager';
import { SessionCredentials } from '../sessions/types';
import { log } from '../util/log';

/**
 * Coordinates session-related operations and lifecycle management.
 */
export class SessionCoordinator {
  private refreshManager?: SessionRefreshManager;
  private sessionManager?: SessionManager;

  constructor(sessionManager?: SessionManager) {
    if (sessionManager) {
      this.sessionManager = sessionManager;
      this.refreshManager = new SessionRefreshManager(sessionManager);
    }
  }

  /**
   * Check if there is an active session
   */
  get hasActiveSession(): boolean {
    return !!this.sessionManager && this.sessionManager.hasActiveSession;
  }

  /**
   * Check if the session manager is available
   */
  get isSessionAvailable(): boolean {
    return !!this.sessionManager;
  }

  /**
   * Get the session expiry
   */
  get sessionExpiry(): Date | undefined {
    if (!this.sessionManager) {
      return undefined;
    }

    const timeRemaining = this.sessionManager.sessionTimeRemaining;
    if (timeRemaining > 0) {
      return new Date(Date.now() + timeRemaining);
    }
    return undefined;
  }

  /**
   * Check if the automatic session refresh is active
   */
  get isAutoRefreshActive(): boolean {
    return this.refreshManager?.isActive() ?? false;
  }

  /**
   * Get the session manager
   */
  getSessionManager(): SessionManager | undefined {
    return this.sessionManager;
  }

  /**
   * Clear the current session
   */
  clearSession(): void {
    if (this.sessionManager) {
      this.stopRefreshManager();
      this.sessionManager.clearSession();
      log.info('[SessionCoordinator] Session cleared');
    }
  }

  /**
   * Check if the session can be automatically restored
   */
  async canAutoRestore(): Promise<boolean> {
    if (!this.sessionManager) {
      return false;
    }

    if (!this.sessionManager.canAutoRestore) {
      return false;
    }

    return this.sessionManager.hasValidSession();
  }

  /**
   * Try to automatically restore the session. Returns the restored
   * credentials on success or undefined on failure. Starts the refresh
   * manager automatically when restoration succeeds. Defensive try/catch
   * ensures callers always get a value, even if a future change introduces
   * a throwing path.
   */
  async tryAutoRestore(): Promise<SessionCredentials | undefined> {
    if (!this.sessionManager) {
      return undefined;
    }

    try {
      const credentials = await this.sessionManager.restoreSession();

      if (credentials) {
        this.startRefreshManager();
      }

      return credentials;
    } catch (error) {
      log.error('[SessionCoordinator] Session auto-restoration error:', error);
      return undefined;
    }
  }

  /**
   * Create a new session
   */
  async createSession(credentials: SessionCredentials): Promise<void> {
    if (!this.sessionManager) {
      log.warn(
        '[SessionCoordinator] No session manager available - skipping session creation'
      );
      return;
    }

    try {
      await this.sessionManager.createSession(credentials);
      this.startRefreshManager();
    } catch (error) {
      log.error('[SessionCoordinator] Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Refresh the current session. Infrastructure errors (crypto, storage)
   * propagate so that callers can distinguish them from a graceful refusal
   * (returned as false).
   */
  async refreshSession(): Promise<boolean> {
    if (!this.sessionManager) {
      return false;
    }

    return this.sessionManager.refreshSession();
  }

  /**
   * Get the time remaining until the session expires
   */
  async getTimeRemaining(): Promise<number> {
    if (!this.sessionManager) {
      return 0;
    }

    return this.sessionManager.sessionTimeRemaining;
  }

  /**
   * Start the automatic session refresh manager.
   */
  private startRefreshManager(): void {
    if (!this.sessionManager?.config.enableActivityRefresh) {
      return;
    }

    if (this.refreshManager && !this.refreshManager.isActive()) {
      this.refreshManager.start();
      log.info('[SessionCoordinator] Automatic session refresh started');
    }
  }

  /**
   * Stop the automatic session refresh manager
   */
  private stopRefreshManager(): void {
    if (this.refreshManager && this.refreshManager.isActive()) {
      this.refreshManager.stop();
      log.info('[SessionCoordinator] Automatic session refresh stopped');
    }
  }
}
