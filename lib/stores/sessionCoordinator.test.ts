import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SessionRefreshManager from '../sessions/sessionRefreshManager';
import { SessionCredentials } from '../sessions/types';
import { log } from '../util/log';
import { SessionCoordinator } from './sessionCoordinator';

// Mock SessionManager
const mockSessionManager = {
  restoreSession: vi.fn(),
  _hasActiveSession: false,
  get hasActiveSession() {
    return mockSessionManager._hasActiveSession;
  },
  _canAutoRestore: false,
  get canAutoRestore() {
    return mockSessionManager._canAutoRestore;
  },
  hasValidSession: vi.fn(),
  createSession: vi.fn(),
  refreshSession: vi.fn(),
  _sessionTimeRemaining: 0,
  get sessionTimeRemaining() {
    return mockSessionManager._sessionTimeRemaining;
  },
  clearSession: vi.fn()
};

// Mock SessionRefreshManager
const mockRefreshManager = {
  start: vi.fn(),
  stop: vi.fn(),
  isActive: vi.fn()
};

// Mock constructors
vi.mock('../sessions/sessionManager', () => ({
  default: vi.fn().mockImplementation(() => mockSessionManager)
}));

vi.mock('../sessions/sessionRefreshManager', () => ({
  default: vi.fn().mockImplementation(() => mockRefreshManager)
}));

// Mock log methods
vi.spyOn(log, 'info').mockImplementation(() => {});
vi.spyOn(log, 'warn').mockImplementation(() => {});
vi.spyOn(log, 'error').mockImplementation(() => {});

describe('SessionCoordinator', () => {
  let sessionCoordinator: SessionCoordinator;
  let mockCredentials: SessionCredentials;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCredentials = {
      localKey: 'test-local-key',
      remoteKey: 'test-remote-key',
      pairingPhrase: 'test-pairing-phrase',
      serverHost: 'test-server:443'
    };

    // Reset mock defaults
    mockSessionManager.restoreSession.mockResolvedValue(null);
    mockSessionManager._hasActiveSession = false;
    mockSessionManager._canAutoRestore = false;
    mockSessionManager.hasValidSession.mockResolvedValue(false);
    mockSessionManager.createSession.mockResolvedValue(undefined);
    mockSessionManager.refreshSession.mockResolvedValue(false);
    mockSessionManager._sessionTimeRemaining = 0;
    mockSessionManager.clearSession.mockReturnValue(undefined);

    mockRefreshManager.start.mockReturnValue(undefined);
    mockRefreshManager.stop.mockReturnValue(undefined);
    mockRefreshManager.isActive.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance without session manager', () => {
      sessionCoordinator = new SessionCoordinator();

      expect(sessionCoordinator).toBeInstanceOf(SessionCoordinator);
      expect(sessionCoordinator.isSessionAvailable).toBe(false);
    });

    it('should create instance with session manager and initialize refresh manager', () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);

      expect(sessionCoordinator).toBeInstanceOf(SessionCoordinator);
      expect(sessionCoordinator.isSessionAvailable).toBe(true);
      expect(SessionRefreshManager).toHaveBeenCalledWith(mockSessionManager);
    });
  });

  describe('canAutoRestore()', () => {
    it('should return false when no session manager', async () => {
      sessionCoordinator = new SessionCoordinator();

      const result = await sessionCoordinator.canAutoRestore();

      expect(result).toBe(false);
      expect(mockSessionManager.hasValidSession).not.toHaveBeenCalled();
    });

    it('should return false when auto-restore is not supported', async () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockSessionManager._canAutoRestore = false;

      const result = await sessionCoordinator.canAutoRestore();

      expect(result).toBe(false);
      expect(mockSessionManager.hasValidSession).not.toHaveBeenCalled();
    });

    it('should return true when session manager reports valid session', async () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockSessionManager._canAutoRestore = true;
      mockSessionManager.hasValidSession.mockResolvedValue(true);

      const result = await sessionCoordinator.canAutoRestore();

      expect(result).toBe(true);
      expect(mockSessionManager.hasValidSession).toHaveBeenCalled();
    });

    it('should return false when session manager reports invalid session', async () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockSessionManager._canAutoRestore = true;
      mockSessionManager.hasValidSession.mockResolvedValue(false);

      const result = await sessionCoordinator.canAutoRestore();

      expect(result).toBe(false);
      expect(mockSessionManager.hasValidSession).toHaveBeenCalled();
    });
  });

  describe('sessionExpiry', () => {
    it('should return undefined when no session manager', () => {
      sessionCoordinator = new SessionCoordinator();

      expect(sessionCoordinator.sessionExpiry).toBeUndefined();
    });

    it('should return expiry date when session has time remaining', () => {
      vi.useFakeTimers();
      try {
        const now = new Date('2020-01-01T00:00:00.000Z');
        vi.setSystemTime(now);

        sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
        mockSessionManager._sessionTimeRemaining = 1800000; // 30 minutes

        expect(sessionCoordinator.sessionExpiry).toBeInstanceOf(Date);
        expect(sessionCoordinator.sessionExpiry!.getTime()).toBe(
          now.getTime() + 1800000
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it('should return undefined when session has no time remaining', () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockSessionManager._sessionTimeRemaining = 0;

      expect(sessionCoordinator.sessionExpiry).toBeUndefined();
    });
  });

  describe('tryAutoRestore()', () => {
    it('should return false when no session manager', async () => {
      sessionCoordinator = new SessionCoordinator();

      const result = await sessionCoordinator.tryAutoRestore();

      expect(result).toBe(false);
      expect(mockSessionManager.restoreSession).not.toHaveBeenCalled();
    });

    it('should return true and start refresh manager when auto-restore succeeds', async () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockSessionManager.restoreSession.mockResolvedValue(mockCredentials);
      const spy = vi.spyOn(log, 'info');

      const result = await sessionCoordinator.tryAutoRestore();

      expect(result).toBe(true);
      expect(mockSessionManager.restoreSession).toHaveBeenCalled();
      expect(mockRefreshManager.start).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        '[SessionCoordinator] Session auto-restoration successful'
      );
    });

    it('should return false and log failure when no valid session', async () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockSessionManager.restoreSession.mockResolvedValue(null);
      const spy = vi.spyOn(log, 'info');

      const result = await sessionCoordinator.tryAutoRestore();

      expect(result).toBe(false);
      expect(mockSessionManager.restoreSession).toHaveBeenCalled();
      expect(mockRefreshManager.start).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        '[SessionCoordinator] Session auto-restoration failed - no valid session'
      );
    });

    it('should return false and log error when auto-restore throws', async () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      const error = new Error('Auto-restore failed');
      mockSessionManager.restoreSession.mockRejectedValue(error);
      const spy = vi.spyOn(log, 'error');

      const result = await sessionCoordinator.tryAutoRestore();

      expect(result).toBe(false);
      expect(mockSessionManager.restoreSession).toHaveBeenCalled();
      expect(mockRefreshManager.start).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        '[SessionCoordinator] Session auto-restoration error:',
        error
      );
    });
  });

  describe('createSession()', () => {
    it('should warn and return when no session manager', async () => {
      sessionCoordinator = new SessionCoordinator();
      const spy = vi.spyOn(log, 'warn');

      await sessionCoordinator.createSession(mockCredentials);

      expect(spy).toHaveBeenCalledWith(
        '[SessionCoordinator] No session manager available - skipping session creation'
      );
      expect(mockSessionManager.createSession).not.toHaveBeenCalled();
    });

    it('should create session and start refresh manager when successful', async () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      const spy = vi.spyOn(log, 'info');

      await sessionCoordinator.createSession(mockCredentials);

      expect(mockSessionManager.createSession).toHaveBeenCalledWith(
        mockCredentials
      );
      expect(mockRefreshManager.start).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        '[SessionCoordinator] Session created successfully'
      );
    });

    it('should propagate errors from session creation', async () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      const error = new Error('Session creation failed');
      mockSessionManager.createSession.mockRejectedValue(error);
      const spy = vi.spyOn(log, 'error');

      await expect(
        sessionCoordinator.createSession(mockCredentials)
      ).rejects.toThrow('Session creation failed');

      expect(mockRefreshManager.start).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        '[SessionCoordinator] Failed to create session:',
        error
      );
    });
  });

  describe('refreshSession()', () => {
    it('should return false when no session manager', async () => {
      sessionCoordinator = new SessionCoordinator();

      const result = await sessionCoordinator.refreshSession();

      expect(result).toBe(false);
      expect(mockSessionManager.refreshSession).not.toHaveBeenCalled();
    });

    it('should return true and log success when refresh succeeds', async () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockSessionManager.refreshSession.mockResolvedValue(true);
      const spy = vi.spyOn(log, 'info');

      const result = await sessionCoordinator.refreshSession();

      expect(result).toBe(true);
      expect(mockSessionManager.refreshSession).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        '[SessionCoordinator] Session refreshed successfully'
      );
    });

    it('should return false and log failure when refresh fails', async () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockSessionManager.refreshSession.mockResolvedValue(false);
      const spy = vi.spyOn(log, 'info');

      const result = await sessionCoordinator.refreshSession();

      expect(result).toBe(false);
      expect(mockSessionManager.refreshSession).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        '[SessionCoordinator] Session refresh failed'
      );
    });

    it('should return false and log error when refresh throws', async () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      const error = new Error('Refresh failed');
      mockSessionManager.refreshSession.mockRejectedValue(error);
      const spy = vi.spyOn(log, 'error');

      const result = await sessionCoordinator.refreshSession();

      expect(result).toBe(false);
      expect(mockSessionManager.refreshSession).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        '[SessionCoordinator] Session refresh error:',
        error
      );
    });
  });

  describe('hasActiveSession', () => {
    it('should return false when no session manager', () => {
      sessionCoordinator = new SessionCoordinator();

      expect(sessionCoordinator.hasActiveSession).toBe(false);
    });

    it('should return session manager active session status', () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockSessionManager._hasActiveSession = true;

      expect(sessionCoordinator.hasActiveSession).toBe(true);

      mockSessionManager._hasActiveSession = false;

      expect(sessionCoordinator.hasActiveSession).toBe(false);
    });
  });

  describe('getTimeRemaining()', () => {
    it('should return 0 when no session manager', async () => {
      sessionCoordinator = new SessionCoordinator();

      const result = await sessionCoordinator.getTimeRemaining();

      expect(result).toBe(0);
    });

    it('should return session manager time remaining', async () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockSessionManager._sessionTimeRemaining = 1800000; // 30 minutes

      const result = await sessionCoordinator.getTimeRemaining();

      expect(result).toBe(1800000);
    });
  });

  describe('clearSession()', () => {
    it('should do nothing when no session manager', () => {
      sessionCoordinator = new SessionCoordinator();

      expect(() => sessionCoordinator.clearSession()).not.toThrow();
      expect(mockSessionManager.clearSession).not.toHaveBeenCalled();
    });

    it('should stop refresh manager and clear session', () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockRefreshManager.isActive.mockReturnValue(true);
      const spy = vi.spyOn(log, 'info');

      sessionCoordinator.clearSession();

      expect(mockRefreshManager.stop).toHaveBeenCalled();
      expect(mockSessionManager.clearSession).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith('[SessionCoordinator] Session cleared');
    });

    it('should not stop refresh manager if not active', () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockRefreshManager.isActive.mockReturnValue(false);

      sessionCoordinator.clearSession();

      expect(mockRefreshManager.stop).not.toHaveBeenCalled();
      expect(mockSessionManager.clearSession).toHaveBeenCalled();
    });
  });

  describe('getSessionManager()', () => {
    it('should return session manager when available', () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);

      expect(sessionCoordinator.getSessionManager()).toBe(mockSessionManager);
    });

    it('should return undefined when no session manager', () => {
      sessionCoordinator = new SessionCoordinator();

      expect(sessionCoordinator.getSessionManager()).toBeUndefined();
    });
  });

  describe('isSessionAvailable', () => {
    it('should return true when session manager is available', () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);

      expect(sessionCoordinator.isSessionAvailable).toBe(true);
    });

    it('should return false when no session manager', () => {
      sessionCoordinator = new SessionCoordinator();

      expect(sessionCoordinator.isSessionAvailable).toBe(false);
    });
  });

  describe('getSessionExpiry()', () => {
    it('should return undefined when no session manager', () => {
      sessionCoordinator = new SessionCoordinator();

      expect(sessionCoordinator.getSessionExpiry()).toBeUndefined();
    });

    it('should return expiry date when session has time remaining', () => {
      vi.useFakeTimers();
      try {
        const now = new Date('2020-01-01T00:00:00.000Z');
        vi.setSystemTime(now);

        sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
        const timeRemaining = 1800000; // 30 minutes
        mockSessionManager._sessionTimeRemaining = timeRemaining;

        const result = sessionCoordinator.getSessionExpiry();

        expect(result).toBeInstanceOf(Date);
        expect(result!.getTime()).toBe(now.getTime() + timeRemaining);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should return undefined when session has no time remaining', () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockSessionManager._sessionTimeRemaining = 0;

      const result = sessionCoordinator.getSessionExpiry();

      expect(result).toBeUndefined();
    });
  });

  describe('getRefreshManager()', () => {
    it('should return refresh manager when available', () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);

      expect(sessionCoordinator.getRefreshManager()).toBe(mockRefreshManager);
    });

    it('should return undefined when no session manager', () => {
      sessionCoordinator = new SessionCoordinator();

      expect(sessionCoordinator.getRefreshManager()).toBeUndefined();
    });
  });

  describe('isAutoRefreshActive', () => {
    it('should return true when refresh manager is active', () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockRefreshManager.isActive.mockReturnValue(true);

      expect(sessionCoordinator.isAutoRefreshActive).toBe(true);
    });

    it('should return false when refresh manager is not active', () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
      mockRefreshManager.isActive.mockReturnValue(false);

      expect(sessionCoordinator.isAutoRefreshActive).toBe(false);
    });

    it('should return false when no refresh manager', () => {
      sessionCoordinator = new SessionCoordinator();

      expect(sessionCoordinator.isAutoRefreshActive).toBe(false);
    });
  });

  describe('Private methods', () => {
    describe('startRefreshManager()', () => {
      it('should start refresh manager if not active', () => {
        sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
        mockRefreshManager.isActive.mockReturnValue(false);
        const spy = vi.spyOn(log, 'info');

        // Access private method through type assertion
        (sessionCoordinator as any).startRefreshManager();

        expect(mockRefreshManager.start).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(
          '[SessionCoordinator] Automatic session refresh started'
        );
      });

      it('should not start refresh manager if already active', () => {
        sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
        mockRefreshManager.isActive.mockReturnValue(true);

        (sessionCoordinator as any).startRefreshManager();

        expect(mockRefreshManager.start).not.toHaveBeenCalled();
      });

      it('should not start refresh manager when no refresh manager', () => {
        sessionCoordinator = new SessionCoordinator();

        expect(() =>
          (sessionCoordinator as any).startRefreshManager()
        ).not.toThrow();
      });
    });

    describe('stopRefreshManager()', () => {
      it('should stop refresh manager if active', () => {
        sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
        mockRefreshManager.isActive.mockReturnValue(true);
        const spy = vi.spyOn(log, 'info');

        (sessionCoordinator as any).stopRefreshManager();

        expect(mockRefreshManager.stop).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(
          '[SessionCoordinator] Automatic session refresh stopped'
        );
      });

      it('should not stop refresh manager if not active', () => {
        sessionCoordinator = new SessionCoordinator(mockSessionManager as any);
        mockRefreshManager.isActive.mockReturnValue(false);

        (sessionCoordinator as any).stopRefreshManager();

        expect(mockRefreshManager.stop).not.toHaveBeenCalled();
      });

      it('should not stop refresh manager when no refresh manager', () => {
        sessionCoordinator = new SessionCoordinator();

        expect(() =>
          (sessionCoordinator as any).stopRefreshManager()
        ).not.toThrow();
      });
    });
  });

  describe('Integration tests', () => {
    it('should handle full session lifecycle', async () => {
      sessionCoordinator = new SessionCoordinator(mockSessionManager as any);

      // Initially no session
      expect(sessionCoordinator.hasActiveSession).toBe(false);
      expect(sessionCoordinator.isAutoRefreshActive).toBe(false);

      // Create session
      await sessionCoordinator.createSession(mockCredentials);
      expect(mockSessionManager.createSession).toHaveBeenCalledWith(
        mockCredentials
      );
      expect(mockRefreshManager.start).toHaveBeenCalled();

      // Simulate active session and refresh manager
      mockRefreshManager.isActive.mockReturnValue(true);
      mockSessionManager._hasActiveSession = true;
      expect(sessionCoordinator.hasActiveSession).toBe(true);
      expect(sessionCoordinator.isAutoRefreshActive).toBe(true);

      // Auto-restore
      mockSessionManager.restoreSession.mockResolvedValue(mockCredentials);
      const autoRestoreResult = await sessionCoordinator.tryAutoRestore();
      expect(autoRestoreResult).toBe(true);

      // Refresh session
      mockSessionManager.refreshSession.mockResolvedValue(true);
      const refreshResult = await sessionCoordinator.refreshSession();
      expect(refreshResult).toBe(true);

      // Clear session
      sessionCoordinator.clearSession();
      expect(mockRefreshManager.stop).toHaveBeenCalled();
      expect(mockSessionManager.clearSession).toHaveBeenCalled();
    });

    it('should handle coordinator without session manager', async () => {
      sessionCoordinator = new SessionCoordinator();

      expect(sessionCoordinator.isSessionAvailable).toBe(false);
      expect(sessionCoordinator.hasActiveSession).toBe(false);
      expect(sessionCoordinator.isAutoRefreshActive).toBe(false);
      expect(await sessionCoordinator.canAutoRestore()).toBe(false);
      expect(await sessionCoordinator.tryAutoRestore()).toBe(false);
      expect(await sessionCoordinator.refreshSession()).toBe(false);
      expect(await sessionCoordinator.getTimeRemaining()).toBe(0);
      expect(sessionCoordinator.getSessionExpiry()).toBeUndefined();

      // Should not throw
      await sessionCoordinator.createSession(mockCredentials);
      sessionCoordinator.clearSession();
    });
  });
});
