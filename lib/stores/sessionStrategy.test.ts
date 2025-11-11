import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';
import { SessionStrategy } from './sessionStrategy';
import SessionManager from '../sessions/sessionManager';

// Mock SessionManager
const mockSessionManager = {
    tryRestore: vi.fn(),
    hasActiveSession: vi.fn(),
    canAutoRestore: vi.fn(),
    hasValidSession: vi.fn(),
    clearSession: vi.fn()
};

vi.mock('../sessions/sessionManager', () => ({
    default: vi.fn().mockImplementation(() => mockSessionManager)
}));

describe('SessionStrategy', () => {
    let strategy: SessionStrategy;
    let mockSession: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSession = {
            localKey: 'session-local-key',
            remoteKey: 'session-remote-key',
            pairingPhrase: 'session-pairing-phrase',
            serverHost: 'session-host:443'
        };

        // Reset mock defaults
        mockSessionManager.tryRestore.mockResolvedValue(null);
        mockSessionManager.hasActiveSession.mockReturnValue(false);
        mockSessionManager.canAutoRestore.mockReturnValue(false);
        mockSessionManager.hasValidSession.mockResolvedValue(false);

        strategy = new SessionStrategy(mockSessionManager as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create instance with session manager', () => {
            expect(strategy).toBeInstanceOf(SessionStrategy);
            expect(strategy.method).toBe('session');
        });
    });

    describe('isSupported()', () => {
        it('should always return true', () => {
            expect(strategy.isSupported()).toBe(true);
        });
    });

    describe('isUnlocked()', () => {
        it('should return true when session is validated and has active session', () => {
            (strategy as any).sessionValidated = true;
            mockSessionManager.hasActiveSession.mockReturnValue(true);

            expect(strategy.isUnlocked()).toBe(true);
        });

        it('should return false when session is not validated', () => {
            (strategy as any).sessionValidated = false;
            mockSessionManager.hasActiveSession.mockReturnValue(true);

            expect(strategy.isUnlocked()).toBe(false);
        });

        it('should return false when no active session', () => {
            (strategy as any).sessionValidated = true;
            mockSessionManager.hasActiveSession.mockReturnValue(false);

            expect(strategy.isUnlocked()).toBe(false);
        });

        it('should return false when neither validated nor active session', () => {
            (strategy as any).sessionValidated = false;
            mockSessionManager.hasActiveSession.mockReturnValue(false);

            expect(strategy.isUnlocked()).toBe(false);
        });
    });

    describe('unlock()', () => {
        it('should unlock with session method and return true when session restored', async () => {
            mockSessionManager.tryRestore.mockResolvedValue(mockSession);

            const result = await strategy.unlock({ method: 'session' });

            expect(result).toBe(true);
            expect(mockSessionManager.tryRestore).toHaveBeenCalled();
            expect((strategy as any).sessionValidated).toBe(true);
        });

        it('should return false for non-session method', async () => {
            const result = await strategy.unlock({ method: 'password' });

            expect(result).toBe(false);
            expect(mockSessionManager.tryRestore).not.toHaveBeenCalled();
        });

        it('should return false when session restore fails', async () => {
            const error = new Error('Session restore failed');
            mockSessionManager.tryRestore.mockRejectedValue(error);

            const result = await strategy.unlock({ method: 'session' });

            expect(result).toBe(false);
            expect(mockSessionManager.tryRestore).toHaveBeenCalled();
            expect((strategy as any).sessionValidated).toBe(false);
        });

        it('should return false when no session is restored', async () => {
            mockSessionManager.tryRestore.mockResolvedValue(null);

            const result = await strategy.unlock({ method: 'session' });

            expect(result).toBe(false);
            expect((strategy as any).sessionValidated).toBe(false);
        });

        it('should log error when session restore fails', async () => {
            const error = new Error('Session restore failed');
            mockSessionManager.tryRestore.mockRejectedValue(error);
            const consoleSpy = vi.spyOn(console, 'error');

            await strategy.unlock({ method: 'session' });

            expect(consoleSpy).toHaveBeenCalledWith('[SessionStrategy] Session restore failed:', error);
        });
    });

    describe('hasAnyCredentials()', () => {
        it('should return true when session is validated and has active session', () => {
            (strategy as any).sessionValidated = true;
            mockSessionManager.hasActiveSession.mockReturnValue(true);

            expect(strategy.hasAnyCredentials()).toBe(true);
        });

        it('should return false when session is not validated', () => {
            (strategy as any).sessionValidated = false;
            mockSessionManager.hasActiveSession.mockReturnValue(true);

            expect(strategy.hasAnyCredentials()).toBe(false);
        });

        it('should return false when no active session', () => {
            (strategy as any).sessionValidated = true;
            mockSessionManager.hasActiveSession.mockReturnValue(false);

            expect(strategy.hasAnyCredentials()).toBe(false);
        });
    });

    describe('canAutoRestore()', () => {
        it('should return false when session manager cannot auto restore', async () => {
            mockSessionManager.canAutoRestore.mockReturnValue(false);

            const result = await strategy.canAutoRestore();

            expect(result).toBe(false);
            expect(mockSessionManager.hasValidSession).not.toHaveBeenCalled();
        });

        it('should return true when session manager can auto restore and has valid session', async () => {
            mockSessionManager.canAutoRestore.mockReturnValue(true);
            mockSessionManager.hasValidSession.mockResolvedValue(true);

            const result = await strategy.canAutoRestore();

            expect(result).toBe(true);
            expect(mockSessionManager.canAutoRestore).toHaveBeenCalled();
            expect(mockSessionManager.hasValidSession).toHaveBeenCalled();
        });

        it('should return false when session manager can auto restore but no valid session', async () => {
            mockSessionManager.canAutoRestore.mockReturnValue(true);
            mockSessionManager.hasValidSession.mockResolvedValue(false);

            const result = await strategy.canAutoRestore();

            expect(result).toBe(false);
            expect(mockSessionManager.canAutoRestore).toHaveBeenCalled();
            expect(mockSessionManager.hasValidSession).toHaveBeenCalled();
        });

        it('should propagate hasValidSession errors', async () => {
            const error = new Error('Validation failed');
            mockSessionManager.canAutoRestore.mockReturnValue(true);
            mockSessionManager.hasValidSession.mockRejectedValue(error);

            await expect(strategy.canAutoRestore()).rejects.toThrow('Validation failed');
        });
    });

    describe('getCredential()', () => {
        it('should return credential value when unlocked and session has key', async () => {
            (strategy as any).sessionValidated = true;
            mockSessionManager.hasActiveSession.mockReturnValue(true);
            mockSessionManager.tryRestore.mockResolvedValue(mockSession);

            const result = await strategy.getCredential('localKey');

            expect(result).toBe('session-local-key');
            expect(mockSessionManager.tryRestore).toHaveBeenCalled();
        });

        it('should return undefined when not unlocked', async () => {
            (strategy as any).sessionValidated = false;
            mockSessionManager.hasActiveSession.mockReturnValue(false);
            const consoleSpy = vi.spyOn(console, 'warn');

            const result = await strategy.getCredential('localKey');

            expect(result).toBeUndefined();
            expect(mockSessionManager.tryRestore).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                '[SessionStrategy] Cannot get credential - no active session'
            );
        });

        it('should return undefined when session does not have the key', async () => {
            (strategy as any).sessionValidated = true;
            mockSessionManager.hasActiveSession.mockReturnValue(true);
            mockSessionManager.tryRestore.mockResolvedValue(mockSession);

            const result = await strategy.getCredential('non-existent-key');

            expect(result).toBeUndefined();
        });

        it('should return undefined when session restore fails', async () => {
            (strategy as any).sessionValidated = true;
            mockSessionManager.hasActiveSession.mockReturnValue(true);
            const error = new Error('Session restore failed');
            mockSessionManager.tryRestore.mockRejectedValue(error);
            const consoleSpy = vi.spyOn(console, 'error');

            const result = await strategy.getCredential('localKey');

            expect(result).toBeUndefined();
            expect(consoleSpy).toHaveBeenCalledWith(
                '[SessionStrategy] Failed to get credential localKey:',
                error
            );
        });

        it('should return undefined when no session is restored', async () => {
            (strategy as any).sessionValidated = true;
            mockSessionManager.hasActiveSession.mockReturnValue(true);
            mockSessionManager.tryRestore.mockResolvedValue(null);

            const result = await strategy.getCredential('localKey');

            expect(result).toBeUndefined();
        });
    });

    describe('setCredential()', () => {
        it('should throw error indicating setCredential is not supported', async () => {
            const consoleSpy = vi.spyOn(console, 'warn');

            await expect(strategy.setCredential('test-key', 'test-value')).rejects.toThrow(
                'SessionStrategy does not support direct credential storage'
            );

            expect(consoleSpy).toHaveBeenCalledWith(
                '[SessionStrategy] setCredential not supported - use createSession instead'
            );
        });
    });

    describe('clear()', () => {
        it('should clear session validation and call session manager clear', () => {
            (strategy as any).sessionValidated = true;

            strategy.clear();

            expect((strategy as any).sessionValidated).toBe(false);
            expect(mockSessionManager.clearSession).toHaveBeenCalled();
        });
    });

    describe('Integration tests', () => {
        it('should support full session workflow', async () => {
            // Initially not unlocked
            expect(strategy.isUnlocked()).toBe(false);

            // Unlock with session
            mockSessionManager.tryRestore.mockResolvedValue(mockSession);
            mockSessionManager.hasActiveSession.mockReturnValue(true);
            const unlockResult = await strategy.unlock({ method: 'session' });
            expect(unlockResult).toBe(true);
            expect(strategy.isUnlocked()).toBe(true);
            expect(strategy.hasAnyCredentials()).toBe(true);

            // Get credentials
            const localKey = await strategy.getCredential('localKey');
            const remoteKey = await strategy.getCredential('remoteKey');
            const pairingPhrase = await strategy.getCredential('pairingPhrase');

            expect(localKey).toBe('session-local-key');
            expect(remoteKey).toBe('session-remote-key');
            expect(pairingPhrase).toBe('session-pairing-phrase');

            // Test setCredential throws
            await expect(strategy.setCredential('test-key', 'test-value')).rejects.toThrow();

            // Clear
            strategy.clear();
            expect((strategy as any).sessionValidated).toBe(false);
            expect(mockSessionManager.clearSession).toHaveBeenCalled();
        });

        it('should handle auto-restore correctly', async () => {
            mockSessionManager.canAutoRestore.mockReturnValue(true);
            mockSessionManager.hasValidSession.mockResolvedValue(true);

            const canAutoRestore = await strategy.canAutoRestore();

            expect(canAutoRestore).toBe(true);

            // Test when cannot auto restore
            mockSessionManager.canAutoRestore.mockReturnValue(false);

            const cannotAutoRestore = await strategy.canAutoRestore();

            expect(cannotAutoRestore).toBe(false);
        });

        it('should work with different session managers', () => {
            const manager1 = {} as any;
            const manager2 = {} as any;

            const strategy1 = new SessionStrategy(manager1);
            const strategy2 = new SessionStrategy(manager2);

            expect(strategy1).not.toBe(strategy2);
        });
    });
});
