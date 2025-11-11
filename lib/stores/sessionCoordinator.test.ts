import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';
import { SessionCoordinator } from './sessionCoordinator';
import SessionManager from '../sessions/sessionManager';
import SessionRefreshManager from '../sessions/sessionRefreshManager';
import { SessionCredentials } from '../sessions/types';

// Mock SessionManager
const mockSessionManager = {
    tryRestore: vi.fn(),
    hasActiveSession: vi.fn(),
    hasValidSession: vi.fn(),
    createSession: vi.fn(),
    refreshSession: vi.fn(),
    getSessionTimeRemaining: vi.fn(),
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

// Mock console methods
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('SessionCoordinator', () => {
    let sessionCoordinator: SessionCoordinator;
    let mockCredentials: SessionCredentials;

    beforeEach(() => {
        vi.clearAllMocks();
        mockCredentials = {
            localKey: 'test-local-key',
            remoteKey: 'test-remote-key',
            pairingPhrase: 'test-pairing-phrase',
            serverHost: 'test-server:443',
            expiresAt: Date.now() + 3600000
        };

        // Reset mock defaults
        mockSessionManager.tryRestore.mockResolvedValue(null);
        mockSessionManager.hasActiveSession.mockReturnValue(false);
        mockSessionManager.hasValidSession.mockResolvedValue(false);
        mockSessionManager.createSession.mockResolvedValue(undefined);
        mockSessionManager.refreshSession.mockResolvedValue(false);
        mockSessionManager.getSessionTimeRemaining.mockReturnValue(0);
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
            expect(sessionCoordinator.isSessionAvailable()).toBe(false);
        });

        it('should create instance with session manager and initialize refresh manager', () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);

            expect(sessionCoordinator).toBeInstanceOf(SessionCoordinator);
            expect(sessionCoordinator.isSessionAvailable()).toBe(true);
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

        it('should return true when session manager reports valid session', async () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            mockSessionManager.hasValidSession.mockResolvedValue(true);

            const result = await sessionCoordinator.canAutoRestore();

            expect(result).toBe(true);
            expect(mockSessionManager.hasValidSession).toHaveBeenCalled();
        });

        it('should return false when session manager reports invalid session', async () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            mockSessionManager.hasValidSession.mockResolvedValue(false);

            const result = await sessionCoordinator.canAutoRestore();

            expect(result).toBe(false);
            expect(mockSessionManager.hasValidSession).toHaveBeenCalled();
        });
    });

    describe('tryAutoRestore()', () => {
        it('should return false when no session manager', async () => {
            sessionCoordinator = new SessionCoordinator();

            const result = await sessionCoordinator.tryAutoRestore();

            expect(result).toBe(false);
            expect(mockSessionManager.tryRestore).not.toHaveBeenCalled();
        });

        it('should return true and start refresh manager when auto-restore succeeds', async () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            mockSessionManager.tryRestore.mockResolvedValue(mockCredentials);
            const consoleSpy = vi.spyOn(console, 'log');

            const result = await sessionCoordinator.tryAutoRestore();

            expect(result).toBe(true);
            expect(mockSessionManager.tryRestore).toHaveBeenCalled();
            expect(mockRefreshManager.start).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                '[SessionCoordinator] Session auto-restoration successful'
            );
        });

        it('should return false and log failure when no valid session', async () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            mockSessionManager.tryRestore.mockResolvedValue(null);
            const consoleSpy = vi.spyOn(console, 'log');

            const result = await sessionCoordinator.tryAutoRestore();

            expect(result).toBe(false);
            expect(mockSessionManager.tryRestore).toHaveBeenCalled();
            expect(mockRefreshManager.start).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                '[SessionCoordinator] Session auto-restoration failed - no valid session'
            );
        });

        it('should return false and log error when auto-restore throws', async () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            const error = new Error('Auto-restore failed');
            mockSessionManager.tryRestore.mockRejectedValue(error);
            const consoleSpy = vi.spyOn(console, 'error');

            const result = await sessionCoordinator.tryAutoRestore();

            expect(result).toBe(false);
            expect(mockSessionManager.tryRestore).toHaveBeenCalled();
            expect(mockRefreshManager.start).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                '[SessionCoordinator] Session auto-restoration error:',
                error
            );
        });
    });

    describe('createSession()', () => {
        it('should warn and return when no session manager', async () => {
            sessionCoordinator = new SessionCoordinator();
            const consoleSpy = vi.spyOn(console, 'warn');

            await sessionCoordinator.createSession(mockCredentials);

            expect(consoleSpy).toHaveBeenCalledWith(
                '[SessionCoordinator] No session manager available - skipping session creation'
            );
            expect(mockSessionManager.createSession).not.toHaveBeenCalled();
        });

        it('should create session and start refresh manager when successful', async () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            const consoleSpy = vi.spyOn(console, 'log');

            await sessionCoordinator.createSession(mockCredentials);

            expect(mockSessionManager.createSession).toHaveBeenCalledWith(mockCredentials);
            expect(mockRefreshManager.start).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('[SessionCoordinator] Session created successfully');
        });

        it('should propagate errors from session creation', async () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            const error = new Error('Session creation failed');
            mockSessionManager.createSession.mockRejectedValue(error);
            const consoleSpy = vi.spyOn(console, 'error');

            await expect(sessionCoordinator.createSession(mockCredentials)).rejects.toThrow('Session creation failed');

            expect(mockRefreshManager.start).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
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
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            mockSessionManager.refreshSession.mockResolvedValue(true);
            const consoleSpy = vi.spyOn(console, 'log');

            const result = await sessionCoordinator.refreshSession();

            expect(result).toBe(true);
            expect(mockSessionManager.refreshSession).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                '[SessionCoordinator] Session refreshed successfully'
            );
        });

        it('should return false and log failure when refresh fails', async () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            mockSessionManager.refreshSession.mockResolvedValue(false);
            const consoleSpy = vi.spyOn(console, 'log');

            const result = await sessionCoordinator.refreshSession();

            expect(result).toBe(false);
            expect(mockSessionManager.refreshSession).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('[SessionCoordinator] Session refresh failed');
        });

        it('should return false and log error when refresh throws', async () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            const error = new Error('Refresh failed');
            mockSessionManager.refreshSession.mockRejectedValue(error);
            const consoleSpy = vi.spyOn(console, 'error');

            const result = await sessionCoordinator.refreshSession();

            expect(result).toBe(false);
            expect(mockSessionManager.refreshSession).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('[SessionCoordinator] Session refresh error:', error);
        });
    });

    describe('hasActiveSession()', () => {
        it('should return false when no session manager', () => {
            sessionCoordinator = new SessionCoordinator();

            expect(sessionCoordinator.hasActiveSession()).toBe(false);
        });

        it('should return session manager active session status', () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            mockSessionManager.hasActiveSession.mockReturnValue(true);

            expect(sessionCoordinator.hasActiveSession()).toBe(true);

            mockSessionManager.hasActiveSession.mockReturnValue(false);

            expect(sessionCoordinator.hasActiveSession()).toBe(false);
        });
    });

    describe('getTimeRemaining()', () => {
        it('should return 0 when no session manager', async () => {
            sessionCoordinator = new SessionCoordinator();

            const result = await sessionCoordinator.getTimeRemaining();

            expect(result).toBe(0);
            expect(mockSessionManager.getSessionTimeRemaining).not.toHaveBeenCalled();
        });

        it('should return session manager time remaining', async () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            mockSessionManager.getSessionTimeRemaining.mockReturnValue(1800000); // 30 minutes

            const result = await sessionCoordinator.getTimeRemaining();

            expect(result).toBe(1800000);
            expect(mockSessionManager.getSessionTimeRemaining).toHaveBeenCalled();
        });
    });

    describe('clearSession()', () => {
        it('should do nothing when no session manager', () => {
            sessionCoordinator = new SessionCoordinator();

            expect(() => sessionCoordinator.clearSession()).not.toThrow();
            expect(mockSessionManager.clearSession).not.toHaveBeenCalled();
        });

        it('should stop refresh manager and clear session', () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            mockRefreshManager.isActive.mockReturnValue(true);
            const consoleSpy = vi.spyOn(console, 'log');

            sessionCoordinator.clearSession();

            expect(mockRefreshManager.stop).toHaveBeenCalled();
            expect(mockSessionManager.clearSession).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('[SessionCoordinator] Session cleared');
        });

        it('should not stop refresh manager if not active', () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            mockRefreshManager.isActive.mockReturnValue(false);

            sessionCoordinator.clearSession();

            expect(mockRefreshManager.stop).not.toHaveBeenCalled();
            expect(mockSessionManager.clearSession).toHaveBeenCalled();
        });
    });

    describe('getSessionManager()', () => {
        it('should return session manager when available', () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);

            expect(sessionCoordinator.getSessionManager()).toBe(mockSessionManager);
        });

        it('should return undefined when no session manager', () => {
            sessionCoordinator = new SessionCoordinator();

            expect(sessionCoordinator.getSessionManager()).toBeUndefined();
        });
    });

    describe('isSessionAvailable()', () => {
        it('should return true when session manager is available', () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);

            expect(sessionCoordinator.isSessionAvailable()).toBe(true);
        });

        it('should return false when no session manager', () => {
            sessionCoordinator = new SessionCoordinator();

            expect(sessionCoordinator.isSessionAvailable()).toBe(false);
        });
    });

    describe('getSessionExpiry()', () => {
        it('should return undefined when no session manager', () => {
            sessionCoordinator = new SessionCoordinator();

            expect(sessionCoordinator.getSessionExpiry()).toBeUndefined();
        });

        it('should return expiry date when session has time remaining', () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            const timeRemaining = 1800000; // 30 minutes
            mockSessionManager.getSessionTimeRemaining.mockReturnValue(timeRemaining);

            const result = sessionCoordinator.getSessionExpiry();

            expect(result).toBeInstanceOf(Date);
            expect(result!.getTime()).toBe(Date.now() + timeRemaining);
        });

        it('should return undefined when session has no time remaining', () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            mockSessionManager.getSessionTimeRemaining.mockReturnValue(0);

            const result = sessionCoordinator.getSessionExpiry();

            expect(result).toBeUndefined();
        });
    });

    describe('getRefreshManager()', () => {
        it('should return refresh manager when available', () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);

            expect(sessionCoordinator.getRefreshManager()).toBe(mockRefreshManager);
        });

        it('should return undefined when no session manager', () => {
            sessionCoordinator = new SessionCoordinator();

            expect(sessionCoordinator.getRefreshManager()).toBeUndefined();
        });
    });

    describe('isAutoRefreshActive()', () => {
        it('should return true when refresh manager is active', () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            mockRefreshManager.isActive.mockReturnValue(true);

            expect(sessionCoordinator.isAutoRefreshActive()).toBe(true);
        });

        it('should return false when refresh manager is not active', () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);
            mockRefreshManager.isActive.mockReturnValue(false);

            expect(sessionCoordinator.isAutoRefreshActive()).toBe(false);
        });

        it('should return false when no refresh manager', () => {
            sessionCoordinator = new SessionCoordinator();

            expect(sessionCoordinator.isAutoRefreshActive()).toBe(false);
        });
    });

    describe('Private methods', () => {
        describe('startRefreshManager()', () => {
            it('should start refresh manager if not active', () => {
                sessionCoordinator = new SessionCoordinator(mockSessionManager);
                mockRefreshManager.isActive.mockReturnValue(false);
                const consoleSpy = vi.spyOn(console, 'log');

                // Access private method through type assertion
                (sessionCoordinator as any).startRefreshManager();

                expect(mockRefreshManager.start).toHaveBeenCalled();
                expect(consoleSpy).toHaveBeenCalledWith(
                    '[SessionCoordinator] Automatic session refresh started'
                );
            });

            it('should not start refresh manager if already active', () => {
                sessionCoordinator = new SessionCoordinator(mockSessionManager);
                mockRefreshManager.isActive.mockReturnValue(true);

                (sessionCoordinator as any).startRefreshManager();

                expect(mockRefreshManager.start).not.toHaveBeenCalled();
            });

            it('should not start refresh manager when no refresh manager', () => {
                sessionCoordinator = new SessionCoordinator();

                expect(() => (sessionCoordinator as any).startRefreshManager()).not.toThrow();
            });
        });

        describe('stopRefreshManager()', () => {
            it('should stop refresh manager if active', () => {
                sessionCoordinator = new SessionCoordinator(mockSessionManager);
                mockRefreshManager.isActive.mockReturnValue(true);
                const consoleSpy = vi.spyOn(console, 'log');

                (sessionCoordinator as any).stopRefreshManager();

                expect(mockRefreshManager.stop).toHaveBeenCalled();
                expect(consoleSpy).toHaveBeenCalledWith(
                    '[SessionCoordinator] Automatic session refresh stopped'
                );
            });

            it('should not stop refresh manager if not active', () => {
                sessionCoordinator = new SessionCoordinator(mockSessionManager);
                mockRefreshManager.isActive.mockReturnValue(false);

                (sessionCoordinator as any).stopRefreshManager();

                expect(mockRefreshManager.stop).not.toHaveBeenCalled();
            });

            it('should not stop refresh manager when no refresh manager', () => {
                sessionCoordinator = new SessionCoordinator();

                expect(() => (sessionCoordinator as any).stopRefreshManager()).not.toThrow();
            });
        });
    });

    describe('Integration tests', () => {
        it('should handle full session lifecycle', async () => {
            sessionCoordinator = new SessionCoordinator(mockSessionManager);

            // Initially no session
            expect(sessionCoordinator.hasActiveSession()).toBe(false);
            expect(sessionCoordinator.isAutoRefreshActive()).toBe(false);

            // Create session
            await sessionCoordinator.createSession(mockCredentials);
            expect(mockSessionManager.createSession).toHaveBeenCalledWith(mockCredentials);
            expect(sessionCoordinator.isAutoRefreshActive()).toBe(false); // refresh manager not active yet

            // Simulate active session and refresh manager
            mockSessionManager.hasActiveSession.mockReturnValue(true);
            mockRefreshManager.isActive.mockReturnValue(true);
            expect(sessionCoordinator.hasActiveSession()).toBe(true);
            expect(sessionCoordinator.isAutoRefreshActive()).toBe(true);

            // Auto-restore
            mockSessionManager.tryRestore.mockResolvedValue(mockCredentials);
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

            expect(sessionCoordinator.isSessionAvailable()).toBe(false);
            expect(sessionCoordinator.hasActiveSession()).toBe(false);
            expect(sessionCoordinator.isAutoRefreshActive()).toBe(false);
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


