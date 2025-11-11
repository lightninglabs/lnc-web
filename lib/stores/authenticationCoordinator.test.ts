import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';
import { AuthenticationCoordinator } from './authenticationCoordinator';
import { StrategyManager } from './strategyManager';
import { CredentialCache } from './credentialCache';
import { SessionCoordinator } from './sessionCoordinator';

// Mock dependencies
const mockStrategyManager = {
    getStrategy: vi.fn(),
    hasAnyCredentials: vi.fn(),
    getPreferredMethod: vi.fn()
};

const mockCredentialCache = {
    get: vi.fn(),
    set: vi.fn(),
    hydrateFromSession: vi.fn(),
    snapshot: vi.fn()
};

const mockSessionCoordinator = {
    isSessionAvailable: vi.fn(),
    createSession: vi.fn(),
    clearSession: vi.fn(),
    getSessionManager: vi.fn()
};

const mockStrategy = {
    method: 'password',
    unlock: vi.fn(),
    isUnlocked: vi.fn(),
    getCredential: vi.fn(),
    setCredential: vi.fn(),
    hasStoredAuthData: vi.fn(),
    isSupported: vi.fn()
};

const mockSessionManager = {
    tryRestore: vi.fn()
};

// Mock constructors
vi.mock('./strategyManager', () => ({
    StrategyManager: vi.fn().mockImplementation(() => mockStrategyManager)
}));

vi.mock('./credentialCache', () => ({
    CredentialCache: vi.fn().mockImplementation(() => mockCredentialCache)
}));

vi.mock('./sessionCoordinator', () => ({
    SessionCoordinator: vi.fn().mockImplementation(() => mockSessionCoordinator)
}));

// Mock console methods
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('AuthenticationCoordinator', () => {
    let authCoordinator: AuthenticationCoordinator;

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset mock defaults
        mockStrategyManager.getStrategy.mockImplementation((method) => {
            if (method === 'passkey') {
                return {
                    method: 'passkey',
                    isSupported: () => false,
                    hasStoredAuthData: () => false
                };
            }
            if (method === 'session') {
                return {
                    method: 'session',
                    isUnlocked: () => false
                };
            }
            return mockStrategy;
        });
        mockStrategyManager.hasAnyCredentials.mockReturnValue(false);
        mockStrategyManager.getPreferredMethod.mockReturnValue('password');

        mockCredentialCache.get.mockReturnValue(null);
        mockCredentialCache.set.mockReturnValue(undefined);
        mockCredentialCache.hydrateFromSession.mockReturnValue(undefined);
        mockCredentialCache.snapshot.mockReturnValue({});

        mockSessionCoordinator.isSessionAvailable.mockReturnValue(true);
        mockSessionCoordinator.createSession.mockResolvedValue(undefined);
        mockSessionCoordinator.clearSession.mockReturnValue(undefined);
        mockSessionCoordinator.getSessionManager.mockReturnValue(mockSessionManager);

        mockStrategy.unlock.mockResolvedValue(false);
        mockStrategy.isUnlocked.mockReturnValue(false);
        mockStrategy.getCredential.mockResolvedValue(null);
        mockStrategy.setCredential.mockResolvedValue(undefined);
        mockStrategy.hasStoredAuthData.mockReturnValue(false);
        mockStrategy.isSupported.mockReturnValue(true);

        mockSessionManager.tryRestore.mockResolvedValue(null);

        authCoordinator = new AuthenticationCoordinator(
            mockStrategyManager,
            mockCredentialCache,
            mockSessionCoordinator
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create instance with dependencies', () => {
            expect(authCoordinator).toBeInstanceOf(AuthenticationCoordinator);
            // Dependencies are passed in, not constructed internally
            expect(authCoordinator['strategyManager']).toBe(mockStrategyManager);
            expect(authCoordinator['credentialCache']).toBe(mockCredentialCache);
            expect(authCoordinator['sessionCoordinator']).toBe(mockSessionCoordinator);
        });
    });

    describe('unlock()', () => {
        it('should return false when strategy is not supported', async () => {
            mockStrategyManager.getStrategy.mockReturnValue(null);
            const consoleSpy = vi.spyOn(console, 'error');

            const result = await authCoordinator.unlock({ method: 'password' });

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(
                "[AuthenticationCoordinator] Authentication method 'password' not supported"
            );
        });

        it('should return false when strategy unlock fails', async () => {
            mockStrategy.unlock.mockResolvedValue(false);
            const consoleSpy = vi.spyOn(console, 'error');

            const result = await authCoordinator.unlock({ method: 'password' });

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(
                '[AuthenticationCoordinator] Failed to unlock with password'
            );
        });

        it('should unlock successfully and set active strategy', async () => {
            mockStrategy.unlock.mockResolvedValue(true);
            mockStrategy.isUnlocked.mockReturnValue(true);
            mockStrategy.getCredential.mockResolvedValue('test-value');
            const consoleSpy = vi.spyOn(console, 'log');

            const result = await authCoordinator.unlock({ method: 'password' });

            expect(result).toBe(true);
            expect(authCoordinator['activeStrategy']).toBe(mockStrategy);
            expect(consoleSpy).toHaveBeenCalledWith(
                '[AuthenticationCoordinator] Successfully unlocked with password strategy'
            );
        });

        it('should load credentials from strategy after unlock', async () => {
            mockStrategy.unlock.mockResolvedValue(true);
            mockStrategy.isUnlocked.mockReturnValue(true);
            mockStrategy.getCredential.mockImplementation((key) => Promise.resolve(`value-${key}`));

            await authCoordinator.unlock({ method: 'password' });

            expect(mockStrategy.getCredential).toHaveBeenCalledWith('pairingPhrase');
            expect(mockStrategy.getCredential).toHaveBeenCalledWith('serverHost');
            expect(mockStrategy.getCredential).toHaveBeenCalledWith('localKey');
            expect(mockStrategy.getCredential).toHaveBeenCalledWith('remoteKey');
            expect(mockCredentialCache.set).toHaveBeenCalledWith('pairingPhrase', 'value-pairingPhrase');
            expect(mockCredentialCache.set).toHaveBeenCalledWith('serverHost', 'value-serverHost');
        });

        it('should persist cached credentials to strategy', async () => {
            mockStrategy.unlock.mockResolvedValue(true);
            mockStrategy.isUnlocked.mockReturnValue(true);
            mockCredentialCache.get.mockImplementation((key) => `cached-${key}`);

            await authCoordinator.unlock({ method: 'password' });

            expect(mockStrategy.setCredential).toHaveBeenCalledWith('localKey', 'cached-localKey');
            expect(mockStrategy.setCredential).toHaveBeenCalledWith('remoteKey', 'cached-remoteKey');
            expect(mockStrategy.setCredential).toHaveBeenCalledWith('pairingPhrase', 'cached-pairingPhrase');
            expect(mockStrategy.setCredential).toHaveBeenCalledWith('serverHost', 'cached-serverHost');
        });

        it('should create session when sessions are available and unlocked', async () => {
            mockStrategy.unlock.mockResolvedValue(true);
            mockStrategy.isUnlocked.mockReturnValue(true);
            mockCredentialCache.get.mockImplementation((key) => `value-${key}`);

            await authCoordinator.unlock({ method: 'password' });

            expect(mockSessionCoordinator.createSession).toHaveBeenCalledWith({
                localKey: 'value-localKey',
                remoteKey: 'value-remoteKey',
                pairingPhrase: 'value-pairingPhrase',
                serverHost: 'value-serverHost',
                expiresAt: expect.any(Number)
            });
        });

        it('should not create session when sessions are not available', async () => {
            mockSessionCoordinator.isSessionAvailable.mockReturnValue(false);
            mockStrategy.unlock.mockResolvedValue(true);
            mockStrategy.isUnlocked.mockReturnValue(true);

            await authCoordinator.unlock({ method: 'password' });

            expect(mockSessionCoordinator.createSession).not.toHaveBeenCalled();
        });

        it('should handle errors during unlock process', async () => {
            mockStrategy.unlock.mockRejectedValue(new Error('Unlock error'));
            const consoleSpy = vi.spyOn(console, 'error');

            const result = await authCoordinator.unlock({ method: 'password' });

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('[AuthenticationCoordinator] Unlock failed:', expect.any(Error));
        });
    });

    describe('isUnlocked()', () => {
        it('should return false when no active strategy', () => {
            authCoordinator['activeStrategy'] = undefined;

            expect(authCoordinator.isUnlocked()).toBe(false);
        });

        it('should return false when strategy is not unlocked', () => {
            authCoordinator['activeStrategy'] = mockStrategy;
            mockStrategy.isUnlocked.mockReturnValue(false);

            expect(authCoordinator.isUnlocked()).toBe(false);
        });

        it('should return true when strategy is unlocked', () => {
            authCoordinator['activeStrategy'] = mockStrategy;
            mockStrategy.isUnlocked.mockReturnValue(true);

            expect(authCoordinator.isUnlocked()).toBe(true);
        });
    });

    describe('getAuthenticationInfo()', () => {
        it('should return authentication information', async () => {
            mockStrategyManager.hasAnyCredentials.mockReturnValue(true);
            mockStrategyManager.getPreferredMethod.mockReturnValue('passkey');
            mockStrategyManager.getStrategy.mockImplementation((method) => {
                if (method === 'session') return { isUnlocked: () => true };
                if (method === 'passkey') return { isSupported: () => true, hasStoredAuthData: () => true };
                return mockStrategy;
            });

            const result = await authCoordinator.getAuthenticationInfo();

            expect(result).toEqual({
                isUnlocked: false,
                hasStoredCredentials: true,
                hasActiveSession: true,
                supportsPasskeys: true,
                hasPasskey: true,
                preferredUnlockMethod: 'passkey'
            });
        });

        it('should wait for session restoration', async () => {
            // This test ensures that getAuthenticationInfo waits for session restoration
            const result = await authCoordinator.getAuthenticationInfo();

            expect(result.isUnlocked).toBe(false);
        });

        it('should handle missing session and passkey strategies when gathering auth info', async () => {
            mockStrategyManager.getStrategy.mockImplementation((method) => {
                if (method === 'passkey' || method === 'session') {
                    return null;
                }
                return mockStrategy;
            });

            const result = await authCoordinator.getAuthenticationInfo();

            expect(result.hasActiveSession).toBe(false);
            expect(result.supportsPasskeys).toBe(false);
            expect(result.hasPasskey).toBe(false);
        });
    });

    describe('tryAutoRestore()', () => {
        it('should return false when sessions are not available', async () => {
            mockSessionCoordinator.isSessionAvailable.mockReturnValue(false);

            const result = await authCoordinator.tryAutoRestore();

            expect(result).toBe(false);
        });

        it('should return false when already restored', async () => {
            authCoordinator['sessionRestored'] = true;

            const result = await authCoordinator.tryAutoRestore();

            expect(result).toBe(false);
        });

        it('should return false when session strategy is not available', async () => {
            mockStrategyManager.getStrategy.mockReturnValue(null);

            const result = await authCoordinator.tryAutoRestore();

            expect(result).toBe(false);
        });

        it('should return false when session unlock fails', async () => {
            mockStrategyManager.getStrategy.mockReturnValue({ unlock: vi.fn().mockResolvedValue(false) });

            const result = await authCoordinator.tryAutoRestore();

            expect(result).toBe(false);
        });

        it('should restore session successfully', async () => {
            const sessionCredentials = {
                localKey: 'session-local',
                remoteKey: 'session-remote',
                pairingPhrase: 'session-phrase',
                serverHost: 'session-host:443',
                expiresAt: Date.now() + 3600000
            };

            mockStrategyManager.getStrategy.mockReturnValue({
                unlock: vi.fn().mockResolvedValue(true),
                method: 'session'
            });
            mockSessionManager.tryRestore.mockResolvedValue(sessionCredentials);

            const result = await authCoordinator.tryAutoRestore();

            expect(result).toBe(true);
            expect(authCoordinator['sessionRestored']).toBe(true);
            expect(authCoordinator['activeStrategy']).toEqual({ unlock: expect.any(Function), method: 'session' });
            expect(mockCredentialCache.hydrateFromSession).toHaveBeenCalledWith(sessionCredentials);
        });

        it('should handle auto-restore errors', async () => {
            mockStrategyManager.getStrategy.mockReturnValue({
                unlock: vi.fn().mockRejectedValue(new Error('Unlock error'))
            });
            const consoleSpy = vi.spyOn(console, 'error');

            const result = await authCoordinator.tryAutoRestore();

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(
                '[AuthenticationCoordinator] Auto-restore failed:',
                expect.any(Error)
            );
        });
    });

    describe('clearSession()', () => {
        it('should clear session and reset state', () => {
            authCoordinator['activeStrategy'] = mockStrategy;
            authCoordinator['sessionRestored'] = true;
            const consoleSpy = vi.spyOn(console, 'log');

            authCoordinator.clearSession();

            expect(mockSessionCoordinator.clearSession).toHaveBeenCalled();
            expect(authCoordinator['sessionRestored']).toBe(false);
            expect(authCoordinator['activeStrategy']).toBeUndefined();
            expect(consoleSpy).toHaveBeenCalledWith('[AuthenticationCoordinator] Cleared session state');
        });
    });

    describe('createSessionAfterConnection()', () => {
        it('should save cached credentials to strategy and create session', async () => {
            authCoordinator['activeStrategy'] = mockStrategy;
            mockCredentialCache.get.mockImplementation((key) => `value-${key}`);

            await authCoordinator.createSessionAfterConnection();

            expect(mockStrategy.setCredential).toHaveBeenCalledWith('localKey', 'value-localKey');
            expect(mockStrategy.setCredential).toHaveBeenCalledWith('remoteKey', 'value-remoteKey');
            expect(mockStrategy.setCredential).toHaveBeenCalledWith('pairingPhrase', 'value-pairingPhrase');
            expect(mockStrategy.setCredential).toHaveBeenCalledWith('serverHost', 'value-serverHost');

            expect(mockSessionCoordinator.createSession).toHaveBeenCalledWith({
                localKey: 'value-localKey',
                remoteKey: 'value-remoteKey',
                pairingPhrase: 'value-pairingPhrase',
                serverHost: 'value-serverHost',
                expiresAt: expect.any(Number)
            });
        });

        it('should default to empty values when cache is missing data', async () => {
            authCoordinator['activeStrategy'] = mockStrategy;
            mockCredentialCache.get.mockReturnValue(undefined);

            await authCoordinator.createSessionAfterConnection();

            expect(mockSessionCoordinator.createSession).toHaveBeenCalledWith({
                localKey: '',
                remoteKey: '',
                pairingPhrase: '',
                serverHost: '',
                expiresAt: expect.any(Number)
            });
        });

        it('should not create session when sessions are not available', async () => {
            mockSessionCoordinator.isSessionAvailable.mockReturnValue(false);
            authCoordinator['activeStrategy'] = mockStrategy;

            await authCoordinator.createSessionAfterConnection();

            expect(mockSessionCoordinator.createSession).not.toHaveBeenCalled();
        });
    });

    describe('getActiveStrategy()', () => {
        it('should return active strategy', () => {
            authCoordinator['activeStrategy'] = mockStrategy;

            expect(authCoordinator.getActiveStrategy()).toBe(mockStrategy);
        });

        it('should return undefined when no active strategy', () => {
            authCoordinator['activeStrategy'] = undefined;

            expect(authCoordinator.getActiveStrategy()).toBeUndefined();
        });
    });

    describe('Private methods', () => {
        describe('initializeCache()', () => {
            it('should try auto-restore and load from active strategy if not restored', async () => {
                authCoordinator['activeStrategy'] = mockStrategy;
                mockStrategy.getCredential.mockImplementation((key) => Promise.resolve(`value-${key}`));

                // Access private method
                await (authCoordinator as any).initializeCache();

                expect(mockCredentialCache.set).toHaveBeenCalledWith('pairingPhrase', 'value-pairingPhrase');
                expect(mockCredentialCache.set).toHaveBeenCalledWith('serverHost', 'value-serverHost');
                expect(mockCredentialCache.set).toHaveBeenCalledWith('localKey', 'value-localKey');
                expect(mockCredentialCache.set).toHaveBeenCalledWith('remoteKey', 'value-remoteKey');
            });
        });

        describe('waitForSessionRestoration()', () => {
            it('should return immediately when session not available', async () => {
                mockSessionCoordinator.isSessionAvailable.mockReturnValue(false);

                await expect((authCoordinator as any).waitForSessionRestoration()).resolves.toBeUndefined();
            });

            it('should return immediately when already restored', async () => {
                authCoordinator['sessionRestored'] = true;

                await expect((authCoordinator as any).waitForSessionRestoration()).resolves.toBeUndefined();
            });

            it('should attempt auto-restore when cache initialization is idle', async () => {
                mockSessionCoordinator.isSessionAvailable.mockReturnValue(true);
                authCoordinator['sessionRestored'] = false;
                (authCoordinator as any).initializeCachePromise = undefined;

                const autoRestoreSpy = vi
                    .spyOn(authCoordinator, 'tryAutoRestore')
                    .mockResolvedValue(false);

                await (authCoordinator as any).waitForSessionRestoration();

                expect(autoRestoreSpy).toHaveBeenCalled();

                autoRestoreSpy.mockRestore();
            });
        });

        describe('persistCachedCredentials()', () => {
            it('should persist credentials to strategy', async () => {
                mockCredentialCache.get.mockImplementation((key) => `value-${key}`);

                await (authCoordinator as any).persistCachedCredentials(mockStrategy);

                expect(mockStrategy.setCredential).toHaveBeenCalledWith('localKey', 'value-localKey');
                expect(mockStrategy.setCredential).toHaveBeenCalledWith('remoteKey', 'value-remoteKey');
                expect(mockStrategy.setCredential).toHaveBeenCalledWith('pairingPhrase', 'value-pairingPhrase');
                expect(mockStrategy.setCredential).toHaveBeenCalledWith('serverHost', 'value-serverHost');
            });

            it('should handle errors when persisting credentials', async () => {
                mockCredentialCache.get.mockImplementation((key) => `value-${key}`);
                mockStrategy.setCredential.mockRejectedValue(new Error('Persist error'));
                const consoleSpy = vi.spyOn(console, 'error');

                await (authCoordinator as any).persistCachedCredentials(mockStrategy);

                expect(consoleSpy).toHaveBeenCalledWith(
                    '[AuthenticationCoordinator] Failed to persist localKey:',
                    expect.any(Error)
                );
            });
        });

        describe('loadCredentialsFromStrategy()', () => {
            it('should load credentials from strategy into cache', async () => {
                mockStrategy.getCredential.mockImplementation((key) => Promise.resolve(`value-${key}`));

                await (authCoordinator as any).loadCredentialsFromStrategy(mockStrategy);

                expect(mockStrategy.getCredential).toHaveBeenCalledWith('pairingPhrase');
                expect(mockStrategy.getCredential).toHaveBeenCalledWith('serverHost');
                expect(mockStrategy.getCredential).toHaveBeenCalledWith('localKey');
                expect(mockStrategy.getCredential).toHaveBeenCalledWith('remoteKey');

                expect(mockCredentialCache.set).toHaveBeenCalledWith('pairingPhrase', 'value-pairingPhrase');
                expect(mockCredentialCache.set).toHaveBeenCalledWith('serverHost', 'value-serverHost');
                expect(mockCredentialCache.set).toHaveBeenCalledWith('localKey', 'value-localKey');
                expect(mockCredentialCache.set).toHaveBeenCalledWith('remoteKey', 'value-remoteKey');
            });

            it('should handle errors when loading credentials', async () => {
                mockStrategy.getCredential.mockRejectedValue(new Error('Load error'));
                const consoleSpy = vi.spyOn(console, 'error');

                await (authCoordinator as any).loadCredentialsFromStrategy(mockStrategy);

                expect(consoleSpy).toHaveBeenCalledWith(
                    '[AuthenticationCoordinator] Failed to load credential pairingPhrase:',
                    expect.any(Error)
                );
            });
        });

        describe('saveCredentialToStrategy()', () => {
            it('should save credential to active strategy', async () => {
                authCoordinator['activeStrategy'] = mockStrategy;

                await (authCoordinator as any).saveCredentialToStrategy('test-key', 'test-value');

                expect(mockStrategy.setCredential).toHaveBeenCalledWith('test-key', 'test-value');
            });

            it('should do nothing when no active strategy', async () => {
                authCoordinator['activeStrategy'] = undefined;

                await (authCoordinator as any).saveCredentialToStrategy('test-key', 'test-value');

                expect(mockStrategy.setCredential).not.toHaveBeenCalled();
            });

            it('should handle errors when saving credentials', async () => {
                authCoordinator['activeStrategy'] = mockStrategy;
                mockStrategy.setCredential.mockRejectedValue(new Error('Save error'));
                const consoleSpy = vi.spyOn(console, 'error');

                await (authCoordinator as any).saveCredentialToStrategy('test-key', 'test-value');

                expect(consoleSpy).toHaveBeenCalledWith(
                    '[AuthenticationCoordinator] Failed to save credential test-key:',
                    expect.any(Error)
                );
            });
        });
    });

    describe('Integration tests', () => {
        it('should handle full authentication lifecycle', async () => {
            // Unlock
            mockStrategy.unlock.mockResolvedValue(true);
            mockStrategy.isUnlocked.mockReturnValue(true);
            mockCredentialCache.get.mockImplementation((key) => `value-${key}`);

            const unlockResult = await authCoordinator.unlock({ method: 'password' });
            expect(unlockResult).toBe(true);

            // Get auth info
            const authInfo = await authCoordinator.getAuthenticationInfo();
            expect(authInfo.isUnlocked).toBe(true);

            // Create session after connection
            await authCoordinator.createSessionAfterConnection();

            // Auto-restore (should fail since already unlocked)
            const autoRestoreResult = await authCoordinator.tryAutoRestore();
            expect(autoRestoreResult).toBe(false);

            // Clear session
            authCoordinator.clearSession();
            expect(authCoordinator['activeStrategy']).toBeUndefined();
        });
    });
});


