import SessionManager from '../sessions/sessionManager';
import SessionRefreshManager from '../sessions/sessionRefreshManager';
import { SessionCredentials } from '../sessions/types';
import { log } from '../util/log';

/**
 * Coordinates session-related operations and lifecycle management.
 * Acts as a bridge between the credential store and session manager.
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
        log.info('[SessionCoordinator] Session auto-restoration successful');
        // Start refresh manager after successful auto-restoration
        this.startRefreshManager();
      } else {
        log.info(
          '[SessionCoordinator] Session auto-restoration failed - no valid session'
        );
      }

      return success;
    } catch (error) {
      log.error('[SessionCoordinator] Session auto-restoration error:', error);
      return false;
    }
  }

  /**
   * Create a new session with credentials
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
      log.info('[SessionCoordinator] Session created successfully');

      // Start automatic refresh monitoring after successful session creation
      this.startRefreshManager();
    } catch (error) {
      log.error('[SessionCoordinator] Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<boolean> {
    if (!this.sessionManager) {
      return false;
    }

    try {
      const success = await this.sessionManager.refreshSession();
      if (success) {
        log.info('[SessionCoordinator] Session refreshed successfully');
      } else {
        log.info('[SessionCoordinator] Session refresh failed');
      }
      return success;
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
   * Get session expiry time (for coordination with other components)
   */
  getSessionExpiry(): Date | undefined {
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
