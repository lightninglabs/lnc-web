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
   * Get the session refresh manager
   */
  getRefreshManager(): SessionRefreshManager | undefined {
    return this.refreshManager;
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
   * Try to automatically restore the session
   */
  async tryAutoRestore(): Promise<boolean> {
    if (!this.sessionManager) {
      return false;
    }

    try {
      const credentials = await this.sessionManager.restoreSession();
      const success = !!credentials;

      if (success) {
        this.startRefreshManager();
      }

      return success;
    } catch (error) {
      log.error('[SessionCoordinator] Session auto-restoration error:', error);
      return false;
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

  async refreshSession(): Promise<boolean> {
    if (!this.sessionManager) {
      return false;
    }

    try {
      return await this.sessionManager.refreshSession();
    } catch (error) {
      log.error('[SessionCoordinator] Session refresh error:', error);
      return false;
    }
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
   * Start the automatic session refresh manager
   */
  private startRefreshManager(): void {
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
