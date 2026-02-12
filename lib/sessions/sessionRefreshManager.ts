import SessionManager from './sessionManager';

/**
 * Stub session refresh manager. Full implementation added in a later PR.
 */
export default class SessionRefreshManager {
  private active = false;

  constructor(private sessionManager: SessionManager) {
    void this.sessionManager;
  }

  start(): void {
    this.active = true;
  }

  stop(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }
}
