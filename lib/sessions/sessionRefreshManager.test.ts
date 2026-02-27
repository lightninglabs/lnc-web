import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionConfig } from '../types/lnc';
import { log } from '../util/log';
import SessionRefreshManager from './sessionRefreshManager';

// Mock SessionManager dependency.
const mockSessionManager: {
  config: Required<SessionConfig>;
  _sessionTimeRemaining: number;
  readonly sessionTimeRemaining: number;
  refreshSession: ReturnType<typeof vi.fn>;
} = {
  config: {
    sessionDurationMs: 24 * 60 * 60 * 1000,
    enableActivityRefresh: true,
    maxRefreshes: 10,
    maxSessionAgeMs: 7 * 24 * 60 * 60 * 1000
  },
  _sessionTimeRemaining: 0,
  get sessionTimeRemaining() {
    return mockSessionManager._sessionTimeRemaining;
  },
  refreshSession: vi.fn()
};

const mockSetTimeout = vi.spyOn(globalThis, 'setTimeout');
const mockClearTimeout = vi.spyOn(globalThis, 'clearTimeout');

const mockDocument = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  hidden: false,
  visibilityState: 'visible'
};

Object.defineProperty(globalThis, 'document', {
  value: mockDocument,
  writable: true
});

vi.spyOn(log, 'info').mockImplementation(() => {});
vi.spyOn(log, 'warn').mockImplementation(() => {});
vi.spyOn(log, 'error').mockImplementation(() => {});

describe('SessionRefreshManager', () => {
  let refreshManager: SessionRefreshManager;

  const getEventHandler = (
    eventName: string
  ): ((...args: unknown[]) => void) => {
    const handlerEntry = mockDocument.addEventListener.mock.calls.find(
      (call) => call[0] === eventName
    );

    if (!handlerEntry) {
      throw new Error(`Expected ${eventName} listener to be registered`);
    }

    return handlerEntry[1] as (...args: unknown[]) => void;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSessionManager.config = {
      sessionDurationMs: 24 * 60 * 60 * 1000,
      enableActivityRefresh: true,
      maxRefreshes: 10,
      maxSessionAgeMs: 7 * 24 * 60 * 60 * 1000
    };
    mockDocument.hidden = false;
    mockDocument.visibilityState = 'visible';

    mockSessionManager._sessionTimeRemaining = 5 * 60 * 60 * 1000; // 5 hours
    mockSessionManager.refreshSession.mockResolvedValue(true);

    refreshManager = new SessionRefreshManager(mockSessionManager);
  });

  afterEach(() => {
    refreshManager.stop();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('start()', () => {
    it('should start monitoring when not already running', () => {
      refreshManager.start();

      expect(refreshManager.isActive()).toBe(true);
      expect(mockDocument.addEventListener).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });

    it('should not start if already running', () => {
      refreshManager.start();
      const firstCallCount = mockDocument.addEventListener.mock.calls.length;

      refreshManager.start();

      expect(mockDocument.addEventListener).toHaveBeenCalledTimes(
        firstCallCount
      );
    });

    it('should set up activity monitoring', () => {
      refreshManager.start();

      const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
      events.forEach((event) => {
        expect(mockDocument.addEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function),
          { passive: true }
        );
      });
    });

    it('should not start when enableActivityRefresh is false', () => {
      mockSessionManager.config.enableActivityRefresh = false;
      refreshManager = new SessionRefreshManager(mockSessionManager);

      refreshManager.start();

      expect(refreshManager.isActive()).toBe(false);
      expect(mockSetTimeout).not.toHaveBeenCalled();
    });

    it('should not start when document is undefined', () => {
      const savedDocument = globalThis.document;
      // Temporarily remove document to simulate a non-browser environment.
      (globalThis as Record<string, unknown>).document = undefined;

      try {
        refreshManager.start();

        expect(refreshManager.isActive()).toBe(false);
        expect(log.warn).toHaveBeenCalledWith(
          '[SessionRefreshManager] No document available; ' +
            'activity monitoring disabled'
        );
      } finally {
        (globalThis as Record<string, unknown>).document = savedDocument;
      }
    });

    it('should warn when session duration is too short for auto-refresh', () => {
      mockSessionManager.config.sessionDurationMs = 10 * 60 * 1000; // 10 minutes
      const shortManager = new SessionRefreshManager(mockSessionManager);

      shortManager.start();

      expect(shortManager.isActive()).toBe(true);
      expect(log.warn).toHaveBeenCalledWith(
        expect.stringContaining('less than the minimum recommended')
      );

      shortManager.stop();
    });

    it('should not warn when session duration meets minimum for auto-refresh', () => {
      mockSessionManager.config.sessionDurationMs = 20 * 60 * 1000; // 20 minutes
      const adequateManager = new SessionRefreshManager(mockSessionManager);

      adequateManager.start();

      expect(adequateManager.isActive()).toBe(true);
      expect(log.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('less than the minimum recommended')
      );

      adequateManager.stop();
    });

    it('should resume refresh timer', () => {
      refreshManager.start();

      expect(mockSetTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000
      );
    });
  });

  describe('stop()', () => {
    it('should stop monitoring and clean up', () => {
      refreshManager.start();
      refreshManager.stop();

      expect(refreshManager.isActive()).toBe(false);
      expect(mockClearTimeout).toHaveBeenCalled();
      expect(mockDocument.removeEventListener).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });

    it('should clean up activity listeners', () => {
      refreshManager.start();
      refreshManager.stop();

      const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
      events.forEach((event) => {
        expect(mockDocument.removeEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function)
        );
      });
    });

    it('should not stop if not running', () => {
      refreshManager.stop();

      expect(mockClearTimeout).not.toHaveBeenCalled();
    });

    it('should clean up active activity throttle timer on stop', () => {
      refreshManager.start();

      // Trigger a throttled activity event so the throttle timer is active.
      const activityHandler = getEventHandler('click');
      activityHandler();

      // Stop before the throttle timer expires — this exercises the
      // activityThrottleTimer cleanup branch in cleanupTimersAndListeners.
      refreshManager.stop();

      expect(mockClearTimeout).toHaveBeenCalled();
      expect(refreshManager.isActive()).toBe(false);
    });
  });

  describe('Activity monitoring', () => {
    it('should update last activity on events', () => {
      refreshManager.start();

      const activityHandler = getEventHandler('click');
      const initialActivity = refreshManager.getLastActivity();

      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      activityHandler();

      expect(refreshManager.getLastActivity()).toBeGreaterThan(initialActivity);
      vi.useRealTimers();
    });

    it('should throttle activity updates', () => {
      vi.useFakeTimers();
      refreshManager.start();

      const activityHandler = getEventHandler('click');

      const activity1 = refreshManager.getLastActivity();
      vi.advanceTimersByTime(1);
      activityHandler();
      const activity2 = refreshManager.getLastActivity();

      vi.advanceTimersByTime(1);
      activityHandler();
      const activity3 = refreshManager.getLastActivity();

      expect(activity2).toBeGreaterThan(activity1);
      expect(activity3).toBe(activity2);
      vi.useRealTimers();
    });

    it('should allow activity updates after throttle interval', () => {
      vi.useFakeTimers();
      refreshManager.start();

      const activityHandler = getEventHandler('click');

      activityHandler();
      const activity1 = refreshManager.getLastActivity();

      vi.advanceTimersByTime(30001);

      activityHandler();
      const activity2 = refreshManager.getLastActivity();

      expect(activity2).toBeGreaterThan(activity1);
      vi.useRealTimers();
    });
  });

  describe('Refresh checks', () => {
    it('should check and refresh session periodically', async () => {
      vi.useFakeTimers();
      mockSessionManager._sessionTimeRemaining = 3 * 60 * 60 * 1000;
      refreshManager.start();

      vi.advanceTimersByTime(5 * 60 * 1000);

      await vi.runOnlyPendingTimersAsync();

      expect(mockSessionManager.refreshSession).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should refresh session when conditions are met', async () => {
      refreshManager.start();
      mockSessionManager._sessionTimeRemaining = 3 * 60 * 60 * 1000;

      const result = await refreshManager.forceRefreshCheck();

      expect(result).toBe(true);
      expect(mockSessionManager.refreshSession).toHaveBeenCalled();
    });

    it('should not refresh session when user has not been active recently', async () => {
      refreshManager.start();
      refreshManager['lastActivity'] = Date.now() - 31 * 60 * 1000;

      await refreshManager.forceRefreshCheck();

      expect(mockSessionManager.refreshSession).not.toHaveBeenCalled();
    });

    it('should not refresh session when session has plenty of time remaining', async () => {
      refreshManager.start();
      mockSessionManager._sessionTimeRemaining = 6 * 60 * 60 * 1000;

      await refreshManager.forceRefreshCheck();

      expect(mockSessionManager.refreshSession).not.toHaveBeenCalled();
    });

    it('should not refresh session when session is expired', async () => {
      refreshManager.start();
      mockSessionManager._sessionTimeRemaining = 0;

      await refreshManager.forceRefreshCheck();

      expect(mockSessionManager.refreshSession).not.toHaveBeenCalled();
    });

    it('should not refresh when time remaining equals trigger threshold', async () => {
      // For 24h session: trigger = min(4h, 24h * 0.25) = min(4h, 6h) = 4h.
      refreshManager.start();
      mockSessionManager._sessionTimeRemaining = 4 * 60 * 60 * 1000;

      await refreshManager.forceRefreshCheck();

      expect(mockSessionManager.refreshSession).not.toHaveBeenCalled();
    });

    it('should refresh when time remaining is just below trigger threshold', async () => {
      refreshManager.start();
      mockSessionManager._sessionTimeRemaining = 4 * 60 * 60 * 1000 - 1;

      await refreshManager.forceRefreshCheck();

      expect(mockSessionManager.refreshSession).toHaveBeenCalled();
    });

    it('should cap refresh trigger at MAX_REFRESH_TRIGGER_MS for long sessions', async () => {
      // 30-day session: 0.25 * 30d = 7.5d, but cap is 4h.
      mockSessionManager.config = {
        ...mockSessionManager.config,
        sessionDurationMs: 30 * 24 * 60 * 60 * 1000
      };
      const longSessionManager = new SessionRefreshManager(mockSessionManager);
      longSessionManager.start();

      mockSessionManager._sessionTimeRemaining = 4 * 60 * 60 * 1000 + 1;
      await longSessionManager.forceRefreshCheck();
      expect(mockSessionManager.refreshSession).not.toHaveBeenCalled();

      mockSessionManager._sessionTimeRemaining = 3 * 60 * 60 * 1000;
      await longSessionManager.forceRefreshCheck();
      expect(mockSessionManager.refreshSession).toHaveBeenCalled();

      longSessionManager.stop();
    });

    it('should use fractional trigger for short sessions instead of the cap', async () => {
      // 1-hour session: 0.25 * 1h = 15 min trigger (not 4h cap).
      mockSessionManager.config = {
        ...mockSessionManager.config,
        sessionDurationMs: 60 * 60 * 1000
      };
      const shortManager = new SessionRefreshManager(mockSessionManager);
      shortManager.start();

      // 16 minutes remaining: above 15-min trigger, should NOT refresh.
      mockSessionManager._sessionTimeRemaining = 16 * 60 * 1000;
      await shortManager.forceRefreshCheck();
      expect(mockSessionManager.refreshSession).not.toHaveBeenCalled();

      // 14 minutes remaining: below 15-min trigger, SHOULD refresh.
      mockSessionManager._sessionTimeRemaining = 14 * 60 * 1000;
      await shortManager.forceRefreshCheck();
      expect(mockSessionManager.refreshSession).toHaveBeenCalled();

      shortManager.stop();
    });

    it('should suppress refresh at exactly the activity threshold', async () => {
      refreshManager.start();
      mockSessionManager._sessionTimeRemaining = 3 * 60 * 60 * 1000;
      refreshManager['lastActivity'] = Date.now() - 30 * 60 * 1000;

      await refreshManager.forceRefreshCheck();

      expect(mockSessionManager.refreshSession).not.toHaveBeenCalled();
    });

    it('should skip concurrent refresh when one is already in flight', async () => {
      refreshManager.start();
      mockSessionManager._sessionTimeRemaining = 3 * 60 * 60 * 1000;

      // Make refreshSession return a promise we control so the first call
      // is still in-flight when we trigger the second.
      let resolveRefresh!: (value: boolean) => void;
      mockSessionManager.refreshSession.mockReturnValueOnce(
        new Promise<boolean>((r) => {
          resolveRefresh = r;
        })
      );

      // Start two concurrent checks.
      const first = refreshManager.forceRefreshCheck();
      const second = refreshManager.forceRefreshCheck();

      // Let the first refresh resolve.
      resolveRefresh(true);
      await first;
      await second;

      // Only one call should have been made despite two concurrent checks.
      expect(mockSessionManager.refreshSession).toHaveBeenCalledTimes(1);
    });

    it('should handle refresh errors and count consecutive failures', async () => {
      refreshManager.start();
      mockSessionManager.refreshSession.mockRejectedValue(
        new Error('Refresh error')
      );
      mockSessionManager._sessionTimeRemaining = 3 * 60 * 60 * 1000;

      await refreshManager.forceRefreshCheck();

      expect(log.error).toHaveBeenCalledWith(
        expect.stringContaining('attempt 1/3'),
        expect.any(Error)
      );
      expect(refreshManager.isActive()).toBe(true);
    });

    it('should stop after 3 consecutive errors', async () => {
      refreshManager.start();
      mockSessionManager.refreshSession.mockRejectedValue(
        new Error('Refresh error')
      );
      mockSessionManager._sessionTimeRemaining = 3 * 60 * 60 * 1000;

      // First two errors keep the manager running.
      let result = await refreshManager.forceRefreshCheck();
      expect(result).toBe(true);
      expect(refreshManager.isActive()).toBe(true);

      result = await refreshManager.forceRefreshCheck();
      expect(result).toBe(true);
      expect(refreshManager.isActive()).toBe(true);

      // Third error triggers self-stop; forceRefreshCheck returns false.
      result = await refreshManager.forceRefreshCheck();
      expect(result).toBe(false);
      expect(refreshManager.isActive()).toBe(false);
      expect(log.error).toHaveBeenCalledWith(
        '[SessionRefreshManager] Stopping after repeated failures'
      );
    });

    it('should reset consecutive errors on success', async () => {
      refreshManager.start();
      mockSessionManager._sessionTimeRemaining = 3 * 60 * 60 * 1000;

      // Cause two errors.
      mockSessionManager.refreshSession.mockRejectedValue(
        new Error('Refresh error')
      );
      await refreshManager.forceRefreshCheck();
      await refreshManager.forceRefreshCheck();

      // Now succeed — should reset the counter.
      mockSessionManager.refreshSession.mockResolvedValue(true);
      await refreshManager.forceRefreshCheck();
      expect(refreshManager.isActive()).toBe(true);

      // One more error should not stop (counter was reset).
      mockSessionManager.refreshSession.mockRejectedValue(
        new Error('Refresh error')
      );
      await refreshManager.forceRefreshCheck();
      expect(refreshManager.isActive()).toBe(true);
    });

    it('should log refresh success', async () => {
      refreshManager.start();
      mockSessionManager._sessionTimeRemaining = 3 * 60 * 60 * 1000;
      mockSessionManager.refreshSession.mockResolvedValue(true);

      await refreshManager.forceRefreshCheck();

      expect(log.info).toHaveBeenCalledWith(
        '[SessionRefreshManager] Session automatically refreshed'
      );
    });

    it('should warn when refresh returns false', async () => {
      refreshManager.start();
      mockSessionManager._sessionTimeRemaining = 3 * 60 * 60 * 1000;
      mockSessionManager.refreshSession.mockResolvedValue(false);

      await refreshManager.forceRefreshCheck();

      expect(log.warn).toHaveBeenCalledWith(
        '[SessionRefreshManager] Session refresh declined ' +
          '(max refreshes or max age reached)'
      );
    });
  });

  describe('Visibility change handling', () => {
    it('should pause timer when page becomes hidden', () => {
      refreshManager.start();

      const visibilityHandler = getEventHandler('visibilitychange');

      mockDocument.hidden = true;
      const currentTimer = refreshManager['refreshTimer'];
      visibilityHandler();

      expect(mockClearTimeout).toHaveBeenCalledWith(currentTimer);
    });

    it('should resume timer and update activity when page becomes visible', () => {
      refreshManager.start();

      const visibilityHandler = getEventHandler('visibilitychange');

      mockDocument.hidden = true;
      visibilityHandler();

      mockDocument.hidden = false;
      const activityBefore = refreshManager.getLastActivity();
      visibilityHandler();

      expect(mockSetTimeout).toHaveBeenCalled();
      expect(refreshManager.getLastActivity()).toBeGreaterThanOrEqual(
        activityBefore
      );
    });

    it('should not resume timer when visibility changes after circuit break', () => {
      refreshManager.start();

      const visibilityHandler = getEventHandler('visibilitychange');

      // Simulate circuit breaker tripping.
      refreshManager.stop();
      mockSetTimeout.mockClear();

      // Page becomes visible again — should not restart timer.
      mockDocument.hidden = false;
      visibilityHandler();

      // No new setTimeout should have been scheduled.
      expect(mockSetTimeout).not.toHaveBeenCalled();
    });
  });

  describe('Public methods', () => {
    describe('getLastActivity()', () => {
      it('should return last activity timestamp', () => {
        const activity = refreshManager.getLastActivity();

        expect(typeof activity).toBe('number');
        expect(activity).toBeGreaterThan(0);
      });
    });

    describe('isActive()', () => {
      it('should return running state', () => {
        expect(refreshManager.isActive()).toBe(false);

        refreshManager.start();
        expect(refreshManager.isActive()).toBe(true);

        refreshManager.stop();
        expect(refreshManager.isActive()).toBe(false);
      });
    });

    describe('forceRefreshCheck()', () => {
      it('should return true and trigger refresh check when running', async () => {
        refreshManager.start();
        mockSessionManager._sessionTimeRemaining = 3 * 60 * 60 * 1000;

        const result = await refreshManager.forceRefreshCheck();

        expect(result).toBe(true);
        expect(mockSessionManager.refreshSession).toHaveBeenCalled();
      });

      it('should return false and warn when not running', async () => {
        const result = await refreshManager.forceRefreshCheck();

        expect(result).toBe(false);
        expect(log.warn).toHaveBeenCalledWith(
          '[SessionRefreshManager] forceRefreshCheck called while not running'
        );
        expect(mockSessionManager.refreshSession).not.toHaveBeenCalled();
      });
    });
  });

  describe('Integration tests', () => {
    it('should handle full lifecycle', async () => {
      mockSessionManager._sessionTimeRemaining = 3 * 60 * 60 * 1000;

      refreshManager.start();
      expect(refreshManager.isActive()).toBe(true);

      await refreshManager.forceRefreshCheck();
      expect(mockSessionManager.refreshSession).toHaveBeenCalled();

      refreshManager.stop();
      expect(refreshManager.isActive()).toBe(false);

      expect(mockDocument.removeEventListener).toHaveBeenCalled();
    });

    it('should handle timer-based refresh checks', async () => {
      vi.useFakeTimers();
      mockSessionManager._sessionTimeRemaining = 3 * 60 * 60 * 1000;
      refreshManager.start();
      mockSessionManager.refreshSession.mockClear();

      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      expect(mockSessionManager.refreshSession).toHaveBeenCalledTimes(1);
      mockSessionManager.refreshSession.mockClear();

      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      expect(mockSessionManager.refreshSession).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should handle visibility changes correctly', () => {
      refreshManager.start();

      const visibilityHandler = getEventHandler('visibilitychange');

      mockDocument.hidden = true;
      visibilityHandler();
      expect(mockClearTimeout).toHaveBeenCalled();

      mockDocument.hidden = false;
      visibilityHandler();
      expect(mockSetTimeout).toHaveBeenCalled();
    });
  });
});
