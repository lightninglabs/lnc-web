import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SessionManager from './sessionManager';
import SessionRefreshManager from './sessionRefreshManager';

// Mock SessionManager
const mockSessionManager = {
    config: {
        sessionDuration: 24 * 60 * 60 * 1000,
        enableActivityRefresh: true,
        activityThreshold: 30,
        activityThrottleInterval: 30,
        refreshTrigger: 4,
        refreshCheckInterval: 5,
        pauseOnHidden: true,
        maxRefreshes: 10,
        maxSessionAge: 7 * 24 * 60 * 60 * 1000
    },
    getSessionTimeRemaining: vi.fn(),
    refreshSession: vi.fn()
};

// Mock constructors
vi.mock('./sessionManager', () => ({
    default: vi.fn().mockImplementation(() => mockSessionManager)
}));

// Spy on timers to verify they're called, but don't mock implementation
// Tests that need timer control will use vi.useFakeTimers()
const mockSetTimeout = vi.spyOn(globalThis, 'setTimeout');
const mockClearTimeout = vi.spyOn(globalThis, 'clearTimeout');

// Mock document and events
const mockDocument = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    hidden: false,
    visibilityState: 'visible'
};

// Mock document globally
Object.defineProperty(globalThis, 'document', {
    value: mockDocument,
    writable: true
});

// Mock console methods
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

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
            sessionDuration: 24 * 60 * 60 * 1000,
            enableActivityRefresh: true,
            activityThreshold: 30,
            activityThrottleInterval: 30,
            refreshTrigger: 4,
            refreshCheckInterval: 5,
            pauseOnHidden: true,
            maxRefreshes: 10,
            maxSessionAge: 7 * 24 * 60 * 60 * 1000
        };
        mockDocument.hidden = false;
        mockDocument.visibilityState = 'visible';

        // Reset mock defaults
        mockSessionManager.getSessionTimeRemaining.mockReturnValue(
            5 * 60 * 60 * 1000
        ); // 5 hours
        mockSessionManager.refreshSession.mockResolvedValue(true);

        refreshManager = new SessionRefreshManager(mockSessionManager);
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    describe('Constructor', () => {
        it('should initialize with session manager config', () => {
            expect(refreshManager['config']).toBe(mockSessionManager.config);
        });
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
            const firstCallCount =
                mockDocument.addEventListener.mock.calls.length;

            refreshManager.start(); // Try to start again

            // Should not add more listeners
            expect(mockDocument.addEventListener).toHaveBeenCalledTimes(
                firstCallCount
            );
        });

        it('should set up activity monitoring', () => {
            refreshManager.start();

            // Check that event listeners were added for activity events
            const events = [
                'click',
                'keydown',
                'mousemove',
                'scroll',
                'touchstart'
            ];
            events.forEach((event) => {
                expect(mockDocument.addEventListener).toHaveBeenCalledWith(
                    event,
                    expect.any(Function),
                    { passive: true }
                );
            });
        });

        it('should not set up visibility listener when disabled in config', () => {
            mockSessionManager.config.pauseOnHidden = false;
            refreshManager = new SessionRefreshManager(mockSessionManager);

            refreshManager.start();

            expect(mockDocument.addEventListener).not.toHaveBeenCalledWith(
                'visibilitychange',
                expect.any(Function)
            );
        });

        it('should resume refresh timer', () => {
            refreshManager.start();

            expect(mockSetTimeout).toHaveBeenCalledWith(
                expect.any(Function),
                5 * 60 * 1000 // 5 minutes
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

            // Check that activity event listeners were removed
            const events = [
                'click',
                'keydown',
                'mousemove',
                'scroll',
                'touchstart'
            ];
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
    });

    describe('Activity monitoring', () => {
        it('should update last activity on events', () => {
            refreshManager.start();

            // Simulate activity event
            const activityHandler = getEventHandler('click');
            const initialActivity = refreshManager.getLastActivity();

            // Advance time
            vi.useFakeTimers();
            vi.advanceTimersByTime(1000);

            activityHandler();

            expect(refreshManager.getLastActivity()).toBeGreaterThan(
                initialActivity
            );
            vi.useRealTimers();
        });

        it('should throttle activity updates', () => {
            vi.useFakeTimers();
            refreshManager.start();

            const activityHandler = getEventHandler('click');

            // First call should update activity
            const activity1 = refreshManager.getLastActivity();
            vi.advanceTimersByTime(1);
            activityHandler();
            const activity2 = refreshManager.getLastActivity();

            // Second call within throttle interval should not update
            vi.advanceTimersByTime(1);
            activityHandler();
            const activity3 = refreshManager.getLastActivity();

            expect(activity2).toBeGreaterThan(activity1);
            expect(activity3).toBe(activity2); // Should be throttled
            vi.useRealTimers();
        });

        it('should allow activity updates after throttle interval', () => {
            vi.useFakeTimers();
            refreshManager.start();

            const activityHandler = getEventHandler('click');

            // First call
            activityHandler();
            const activity1 = refreshManager.getLastActivity();

            // Advance time past throttle interval (30 seconds)
            vi.advanceTimersByTime(31000);

            // Second call after throttle
            activityHandler();
            const activity2 = refreshManager.getLastActivity();

            expect(activity2).toBeGreaterThan(activity1);
            vi.useRealTimers();
        });
    });

    describe('Refresh timer', () => {
        it('should check and refresh session periodically', async () => {
            vi.useFakeTimers();
            // Set up conditions that trigger refresh: session expiring soon
            mockSessionManager.getSessionTimeRemaining.mockReturnValue(
                3 * 60 * 60 * 1000
            ); // 3 hours
            refreshManager.start();

            // Advance time to trigger refresh check
            vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

            await vi.runOnlyPendingTimersAsync();

            expect(mockSessionManager.refreshSession).toHaveBeenCalled();
            vi.useRealTimers();
        });

        it('should refresh session when conditions are met', async () => {
            refreshManager.start();

            // Set up conditions for refresh: recent activity and session expiring soon
            mockSessionManager.getSessionTimeRemaining.mockReturnValue(
                3 * 60 * 60 * 1000
            ); // 3 hours (less than 4 hour trigger)

            await (refreshManager as any).checkAndRefreshSession();

            expect(mockSessionManager.refreshSession).toHaveBeenCalled();
        });

        it('should not refresh session when user has not been active recently', async () => {
            refreshManager.start();

            // Set last activity to be old
            refreshManager['lastActivity'] = Date.now() - 31 * 60 * 1000; // 31 minutes ago

            await (refreshManager as any).checkAndRefreshSession();

            expect(mockSessionManager.refreshSession).not.toHaveBeenCalled();
        });

        it('should not refresh session when session has plenty of time remaining', async () => {
            refreshManager.start();

            // Set session to have plenty of time remaining
            mockSessionManager.getSessionTimeRemaining.mockReturnValue(
                6 * 60 * 60 * 1000
            ); // 6 hours (more than 4 hour trigger)

            await (refreshManager as any).checkAndRefreshSession();

            expect(mockSessionManager.refreshSession).not.toHaveBeenCalled();
        });

        it('should not refresh session when session is expired', async () => {
            refreshManager.start();

            // Set session to be expired
            mockSessionManager.getSessionTimeRemaining.mockReturnValue(0);

            await (refreshManager as any).checkAndRefreshSession();

            expect(mockSessionManager.refreshSession).not.toHaveBeenCalled();
        });

        it('should handle refresh errors gracefully', async () => {
            refreshManager.start();

            mockSessionManager.refreshSession.mockRejectedValue(
                new Error('Refresh error')
            );
            mockSessionManager.getSessionTimeRemaining.mockReturnValue(
                3 * 60 * 60 * 1000
            );

            await (refreshManager as any).checkAndRefreshSession();

            // Should not throw, should log error
            expect(console.error).toHaveBeenCalledWith(
                'Error during session refresh check:',
                expect.any(Error)
            );
        });

        it('should log refresh success and failure', async () => {
            refreshManager.start();

            mockSessionManager.getSessionTimeRemaining.mockReturnValue(
                3 * 60 * 60 * 1000
            );

            // Test success
            mockSessionManager.refreshSession.mockResolvedValue(true);
            await (refreshManager as any).checkAndRefreshSession();
            expect(console.log).toHaveBeenCalledWith(
                'Session automatically refreshed'
            );

            // Test failure
            mockSessionManager.refreshSession.mockResolvedValue(false);
            await (refreshManager as any).checkAndRefreshSession();
            expect(console.log).toHaveBeenCalledWith(
                'Session refresh failed or reached limits'
            );
        });
    });

    describe('Visibility change handling', () => {
        it('should pause timer when page becomes hidden', () => {
            refreshManager.start();

            const visibilityHandler = getEventHandler('visibilitychange');

            // Simulate page becoming hidden
            mockDocument.hidden = true;
            const currentTimer = refreshManager['refreshTimer'];
            visibilityHandler();

            expect(mockClearTimeout).toHaveBeenCalledWith(currentTimer);
        });

        it('should resume timer and update activity when page becomes visible', () => {
            refreshManager.start();

            const visibilityHandler = getEventHandler('visibilitychange');

            // First make it hidden
            mockDocument.hidden = true;
            visibilityHandler();

            // Then make it visible
            mockDocument.hidden = false;
            const activityBefore = refreshManager.getLastActivity();
            visibilityHandler();

            expect(mockSetTimeout).toHaveBeenCalled();
            expect(refreshManager.getLastActivity()).toBeGreaterThanOrEqual(
                activityBefore
            );
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

        describe('recordActivity()', () => {
            it('should manually update last activity', () => {
                const activityBefore = refreshManager.getLastActivity();

                refreshManager.recordActivity();

                expect(refreshManager.getLastActivity()).toBeGreaterThanOrEqual(
                    activityBefore
                );
            });
        });

        describe('getTimeSinceLastActivity()', () => {
            it('should return time since last activity', () => {
                const timeSince = refreshManager.getTimeSinceLastActivity();

                expect(typeof timeSince).toBe('number');
                expect(timeSince).toBeGreaterThanOrEqual(0);
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
            it('should trigger refresh check when running', async () => {
                refreshManager.start();
                // Set up conditions that trigger refresh: session expiring soon
                mockSessionManager.getSessionTimeRemaining.mockReturnValue(
                    3 * 60 * 60 * 1000
                ); // 3 hours

                await refreshManager.forceRefreshCheck();

                expect(mockSessionManager.refreshSession).toHaveBeenCalled();
            });

            it('should not trigger refresh check when not running', async () => {
                await refreshManager.forceRefreshCheck();

                expect(
                    mockSessionManager.refreshSession
                ).not.toHaveBeenCalled();
            });
        });
    });

    describe('Private methods', () => {
        describe('createThrottledActivityUpdater()', () => {
            it('should create throttled function', () => {
                const throttledUpdater = (
                    refreshManager as any
                ).createThrottledActivityUpdater();

                expect(typeof throttledUpdater).toBe('function');
            });

            it('should throttle updates correctly', () => {
                vi.useFakeTimers();
                const throttledUpdater = (
                    refreshManager as any
                ).createThrottledActivityUpdater();

                const activity1 = refreshManager.getLastActivity();
                vi.advanceTimersByTime(1);
                throttledUpdater();
                const activity2 = refreshManager.getLastActivity();

                expect(activity2).toBeGreaterThan(activity1);

                // Second call should be throttled
                vi.advanceTimersByTime(1);
                throttledUpdater();
                const activity3 = refreshManager.getLastActivity();

                expect(activity3).toBe(activity2); // Should not have changed

                // After throttle interval, should work again
                vi.advanceTimersByTime(31000);
                throttledUpdater();
                const activity4 = refreshManager.getLastActivity();

                expect(activity4).toBeGreaterThan(activity3);
                vi.useRealTimers();
            });
        });

        describe('resumeRefreshTimer()', () => {
            it('should clear existing timer and set new one', () => {
                const existingTimer = setTimeout(() => {}, 1000);
                refreshManager['refreshTimer'] = existingTimer;

                (refreshManager as any).resumeRefreshTimer();

                expect(mockClearTimeout).toHaveBeenCalledWith(existingTimer);
                expect(mockSetTimeout).toHaveBeenCalled();
                clearTimeout(existingTimer); // cleanup
            });
        });

        describe('pauseRefreshTimer()', () => {
            it('should clear refresh timer', () => {
                const timer = setTimeout(() => {}, 1000);
                refreshManager['refreshTimer'] = timer;

                (refreshManager as any).pauseRefreshTimer();

                expect(mockClearTimeout).toHaveBeenCalledWith(timer);
                expect(refreshManager['refreshTimer']).toBeUndefined();
            });
        });

        describe('handleVisibilityChange()', () => {
            it('should pause timer when hidden', () => {
                const timer = setTimeout(() => {}, 1000);
                refreshManager['refreshTimer'] = timer;
                mockDocument.hidden = true;

                (refreshManager as any).handleVisibilityChange();

                expect(mockClearTimeout).toHaveBeenCalledWith(timer);
                mockDocument.hidden = false; // reset
            });

            it('should resume timer when visible', () => {
                mockDocument.hidden = false;

                (refreshManager as any).handleVisibilityChange();

                expect(mockSetTimeout).toHaveBeenCalled();
            });
        });

        describe('cleanupTimersAndListeners()', () => {
            it('should clear all timers and remove listeners', () => {
                refreshManager.start();
                const refreshTimer = setTimeout(() => {}, 1000);
                const activityTimer = setTimeout(() => {}, 1000);
                refreshManager['refreshTimer'] = refreshTimer;
                refreshManager['activityThrottleTimer'] = activityTimer;

                (refreshManager as any).cleanupTimersAndListeners();

                expect(mockClearTimeout).toHaveBeenCalledWith(refreshTimer);
                expect(mockClearTimeout).toHaveBeenCalledWith(activityTimer);

                // Activity listeners should be removed (5 activity events only, visibility is handled separately)
                expect(mockDocument.removeEventListener).toHaveBeenCalledTimes(
                    5
                );
            });
        });
    });

    describe('Integration tests', () => {
        it('should handle full lifecycle', async () => {
            // Set up conditions that trigger refresh
            mockSessionManager.getSessionTimeRemaining.mockReturnValue(
                3 * 60 * 60 * 1000
            ); // 3 hours

            // Start monitoring
            refreshManager.start();
            expect(refreshManager.isActive()).toBe(true);

            // Simulate some activity
            refreshManager.recordActivity();
            expect(refreshManager.getTimeSinceLastActivity()).toBeLessThan(
                1000
            );

            // Force refresh check
            await refreshManager.forceRefreshCheck();
            expect(mockSessionManager.refreshSession).toHaveBeenCalled();

            // Stop monitoring
            refreshManager.stop();
            expect(refreshManager.isActive()).toBe(false);

            // Verify cleanup
            expect(mockDocument.removeEventListener).toHaveBeenCalled();
        });

        it('should handle timer-based refresh checks', async () => {
            vi.useFakeTimers();
            // Set up conditions that trigger refresh
            mockSessionManager.getSessionTimeRemaining.mockReturnValue(
                3 * 60 * 60 * 1000
            ); // 3 hours
            refreshManager.start();
            mockSessionManager.refreshSession.mockClear();

            // Advance time to trigger first check
            await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
            expect(mockSessionManager.refreshSession).toHaveBeenCalledTimes(1);
            mockSessionManager.refreshSession.mockClear();

            // Advance time again for next check
            await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
            expect(mockSessionManager.refreshSession).toHaveBeenCalledTimes(1);

            vi.useRealTimers();
        });

        it('should handle visibility changes correctly', () => {
            refreshManager.start();

            const visibilityHandler = getEventHandler('visibilitychange');

            // Page becomes hidden
            mockDocument.hidden = true;
            visibilityHandler();
            expect(mockClearTimeout).toHaveBeenCalled();

            // Page becomes visible
            mockDocument.hidden = false;
            visibilityHandler();
            expect(mockSetTimeout).toHaveBeenCalled();
        });
    });
});
