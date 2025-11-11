import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';
import UnifiedCredentialStore from './unifiedCredentialStore';
import { StrategyManager } from './strategyManager';
import { CredentialCache } from './credentialCache';
import { SessionCoordinator } from './sessionCoordinator';
import { AuthenticationCoordinator } from './authenticationCoordinator';
import SessionManager from '../sessions/sessionManager';

// Mock dependencies
const mockStrategyManager = {
    hasAnyCredentials: vi.fn(),
    clearAll: vi.fn(),
    getSupportedMethods: vi.fn(),
    getPreferredMethod: vi.fn()
};

// Create a mock credential cache that actually stores values
const createMockCredentialCache = () => {
    const storage = new Map<string, any>();
    return {
        get: vi.fn((key: string) => storage.get(key) || null),
        set: vi.fn((key: string, value: any) => storage.set(key, value)),
        clear: vi.fn(() => storage.clear()),
        _storage: storage  // For testing purposes
    };
};

let mockCredentialCache = createMockCredentialCache();

const mockSessionCoordinator = {
    canAutoRestore: vi.fn(),
    createSession: vi.fn(),
    clearSession: vi.fn(),
    tryAutoRestore: vi.fn(),
    refreshSession: vi.fn(),
    hasActiveSession: vi.fn(),
    getTimeRemaining: vi.fn(),
    getRefreshManager: vi.fn(),
    isAutoRefreshActive: vi.fn()
};

const mockAuthCoordinator = {
    unlock: vi.fn(),
    isUnlocked: vi.fn(),
    getAuthenticationInfo: vi.fn(),
    clearSession: vi.fn(),
    tryAutoRestore: vi.fn(),
    createSessionAfterConnection: vi.fn()
};

const mockSessionManager = {
    getSessionTimeRemaining: vi.fn(),
    refreshSession: vi.fn()
};

const mockRefreshManager = {
    getTimeSinceLastActivity: vi.fn(),
    recordActivity: vi.fn()
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

vi.mock('./authenticationCoordinator', () => ({
    AuthenticationCoordinator: vi.fn().mockImplementation(() => mockAuthCoordinator)
}));

vi.mock('../sessions/sessionManager', () => ({
    default: vi.fn().mockImplementation(() => mockSessionManager)
}));

describe('UnifiedCredentialStore', () => {
    let unifiedStore: UnifiedCredentialStore;
    const baseConfig = {
        namespace: 'test-namespace',
        allowPasskeys: true,
        enableSessions: true
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Recreate credential cache to ensure clean state
        mockCredentialCache = createMockCredentialCache();

        mockStrategyManager.hasAnyCredentials.mockReturnValue(false);
        mockStrategyManager.clearAll.mockReturnValue(undefined);
        mockStrategyManager.getSupportedMethods.mockReturnValue(['password', 'passkey', 'session']);

        mockSessionCoordinator.canAutoRestore.mockResolvedValue(false);
        mockSessionCoordinator.createSession.mockResolvedValue(undefined);
        mockSessionCoordinator.clearSession.mockReturnValue(undefined);
        mockSessionCoordinator.tryAutoRestore.mockResolvedValue(false);
        mockSessionCoordinator.refreshSession.mockResolvedValue(false);
        mockSessionCoordinator.hasActiveSession.mockReturnValue(false);
        mockSessionCoordinator.getTimeRemaining.mockResolvedValue(0);
        mockSessionCoordinator.getRefreshManager.mockReturnValue(mockRefreshManager);
        mockSessionCoordinator.isAutoRefreshActive.mockReturnValue(false);

        mockAuthCoordinator.unlock.mockResolvedValue(false);
        mockAuthCoordinator.isUnlocked.mockReturnValue(false);
        mockAuthCoordinator.getAuthenticationInfo.mockResolvedValue({
            isUnlocked: false,
            hasStoredCredentials: false,
            hasActiveSession: false,
            supportsPasskeys: true,
            hasPasskey: false,
            preferredUnlockMethod: 'password'
        });
        mockAuthCoordinator.clearSession.mockReturnValue(undefined);
        mockAuthCoordinator.tryAutoRestore.mockResolvedValue(false);
        mockAuthCoordinator.createSessionAfterConnection.mockResolvedValue(undefined);

        mockRefreshManager.getTimeSinceLastActivity.mockReturnValue(0);
        mockRefreshManager.recordActivity.mockReturnValue(undefined);

        unifiedStore = new UnifiedCredentialStore(baseConfig, mockSessionManager);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create all coordinator components', () => {
            expect(StrategyManager).toHaveBeenCalledWith(baseConfig, mockSessionManager);
            expect(CredentialCache).toHaveBeenCalled();
            expect(SessionCoordinator).toHaveBeenCalledWith(mockSessionManager);
            expect(AuthenticationCoordinator).toHaveBeenCalledWith(
                mockStrategyManager,
                mockCredentialCache,
                mockSessionCoordinator
            );
        });

        it('should create without session manager when not provided', () => {
            const configWithoutSessions = { ...baseConfig, enableSessions: false };
            unifiedStore = new UnifiedCredentialStore(configWithoutSessions);

            expect(StrategyManager).toHaveBeenCalledWith(configWithoutSessions, undefined);
            expect(SessionCoordinator).toHaveBeenCalledWith(undefined);
        });
    });

    describe('CredentialStore interface - getters/setters', () => {
        describe('password', () => {
            it('should return undefined (password not stored)', () => {
                expect(unifiedStore.password).toBeUndefined();
            });

            it('should allow setting password (no-op)', () => {
                expect(() => {
                    unifiedStore.password = 'test-password';
                }).not.toThrow();
            });
        });

        describe('pairingPhrase', () => {
            it('should return cached value', () => {
                mockCredentialCache.get.mockReturnValue('test-phrase');

                expect(unifiedStore.pairingPhrase).toBe('test-phrase');
                expect(mockCredentialCache.get).toHaveBeenCalledWith('pairingPhrase');
            });

            it('should return empty string when no cached value', () => {
                mockCredentialCache.get.mockReturnValue(null);

                expect(unifiedStore.pairingPhrase).toBe('');
            });

            it('should set cached value', () => {
                unifiedStore.pairingPhrase = 'new-phrase';

                expect(mockCredentialCache.set).toHaveBeenCalledWith('pairingPhrase', 'new-phrase');
            });
        });

        describe('serverHost', () => {
            it('should return cached value', () => {
                mockCredentialCache.get.mockReturnValue('test-host:443');

                expect(unifiedStore.serverHost).toBe('test-host:443');
                expect(mockCredentialCache.get).toHaveBeenCalledWith('serverHost');
            });

            it('should return empty string when no cached value', () => {
                mockCredentialCache.get.mockReturnValue(null);

                expect(unifiedStore.serverHost).toBe('');
            });

            it('should set cached value', () => {
                unifiedStore.serverHost = 'new-host:443';

                expect(mockCredentialCache.set).toHaveBeenCalledWith('serverHost', 'new-host:443');
            });
        });

        describe('localKey', () => {
            it('should return cached value', () => {
                mockCredentialCache.get.mockReturnValue('test-local-key');

                expect(unifiedStore.localKey).toBe('test-local-key');
                expect(mockCredentialCache.get).toHaveBeenCalledWith('localKey');
            });

            it('should return empty string when no cached value', () => {
                mockCredentialCache.get.mockReturnValue(null);

                expect(unifiedStore.localKey).toBe('');
            });

            it('should set cached value', () => {
                unifiedStore.localKey = 'new-local-key';

                expect(mockCredentialCache.set).toHaveBeenCalledWith('localKey', 'new-local-key');
            });
        });

        describe('remoteKey', () => {
            it('should return cached value', () => {
                mockCredentialCache.get.mockReturnValue('test-remote-key');

                expect(unifiedStore.remoteKey).toBe('test-remote-key');
                expect(mockCredentialCache.get).toHaveBeenCalledWith('remoteKey');
            });

            it('should return empty string when no cached value', () => {
                mockCredentialCache.get.mockReturnValue(null);

                expect(unifiedStore.remoteKey).toBe('');
            });

            it('should set cached value', () => {
                unifiedStore.remoteKey = 'new-remote-key';

                expect(mockCredentialCache.set).toHaveBeenCalledWith('remoteKey', 'new-remote-key');
            });
        });

        describe('isPaired', () => {
            it('should return strategy manager hasAnyCredentials result', () => {
                mockStrategyManager.hasAnyCredentials.mockReturnValue(true);

                expect(unifiedStore.isPaired).toBe(true);

                mockStrategyManager.hasAnyCredentials.mockReturnValue(false);

                expect(unifiedStore.isPaired).toBe(false);
            });
        });
    });

    describe('clear()', () => {
        it('should clear cache and strategies when memoryOnly is false', () => {
            unifiedStore.clear(false);

            expect(mockCredentialCache.clear).toHaveBeenCalled();
            expect(mockStrategyManager.clearAll).toHaveBeenCalled();
            expect(mockAuthCoordinator.clearSession).toHaveBeenCalled();
        });

        it('should only clear cache when memoryOnly is true', () => {
            unifiedStore.clear(true);

            expect(mockCredentialCache.clear).toHaveBeenCalled();
            expect(mockStrategyManager.clearAll).not.toHaveBeenCalled();
            expect(mockAuthCoordinator.clearSession).toHaveBeenCalled();
        });

        it('should default to memoryOnly false', () => {
            unifiedStore.clear();

            expect(mockCredentialCache.clear).toHaveBeenCalled();
            expect(mockStrategyManager.clearAll).toHaveBeenCalled();
            expect(mockAuthCoordinator.clearSession).toHaveBeenCalled();
        });
    });

    describe('Authentication methods', () => {
        describe('clearSession()', () => {
            it('should delegate to auth coordinator', () => {
                unifiedStore.clearSession();

                expect(mockAuthCoordinator.clearSession).toHaveBeenCalled();
            });
        });

        describe('isUnlocked()', () => {
            it('should delegate to auth coordinator', () => {
                mockAuthCoordinator.isUnlocked.mockReturnValue(true);

                expect(unifiedStore.isUnlocked()).toBe(true);

                mockAuthCoordinator.isUnlocked.mockReturnValue(false);

                expect(unifiedStore.isUnlocked()).toBe(false);
            });
        });

        describe('unlock()', () => {
            it('should delegate to auth coordinator', async () => {
                const options = { method: 'password' as const, password: 'test' };
                mockAuthCoordinator.unlock.mockResolvedValue(true);

                const result = await unifiedStore.unlock(options);

                expect(result).toBe(true);
                expect(mockAuthCoordinator.unlock).toHaveBeenCalledWith(options);
            });
        });

        describe('getAuthenticationInfo()', () => {
            it('should delegate to auth coordinator', async () => {
                const authInfo = {
                    isUnlocked: true,
                    hasStoredCredentials: true,
                    hasActiveSession: false,
                    supportsPasskeys: true,
                    hasPasskey: false,
                    preferredUnlockMethod: 'passkey' as const
                };
                mockAuthCoordinator.getAuthenticationInfo.mockResolvedValue(authInfo);

                const result = await unifiedStore.getAuthenticationInfo();

                expect(result).toBe(authInfo);
                expect(mockAuthCoordinator.getAuthenticationInfo).toHaveBeenCalled();
            });
        });

        describe('getSupportedUnlockMethods()', () => {
            it('should delegate to strategy manager', () => {
                const methods = ['password', 'passkey', 'session'];
                mockStrategyManager.getSupportedMethods.mockReturnValue(methods);

                const result = unifiedStore.getSupportedUnlockMethods();

                expect(result).toBe(methods);
                expect(mockStrategyManager.getSupportedMethods).toHaveBeenCalled();
            });
        });

        describe('canAutoRestore()', () => {
            it('should delegate to session coordinator', async () => {
                mockSessionCoordinator.canAutoRestore.mockResolvedValue(true);

                const result = await unifiedStore.canAutoRestore();

                expect(result).toBe(true);
                expect(mockSessionCoordinator.canAutoRestore).toHaveBeenCalled();
            });
        });

        describe('tryAutoRestore()', () => {
            it('should delegate to auth coordinator', async () => {
                mockAuthCoordinator.tryAutoRestore.mockResolvedValue(true);

                const result = await unifiedStore.tryAutoRestore();

                expect(result).toBe(true);
                expect(mockAuthCoordinator.tryAutoRestore).toHaveBeenCalled();
            });
        });
    });

    describe('Session management', () => {
        describe('createSession()', () => {
            it('should not create session when not unlocked', async () => {
                mockAuthCoordinator.isUnlocked.mockReturnValue(false);

                await unifiedStore.createSession();

                expect(mockSessionCoordinator.createSession).not.toHaveBeenCalled();
            });

            it('should create session with current credentials when unlocked', async () => {
                mockAuthCoordinator.isUnlocked.mockReturnValue(true);
                mockCredentialCache.get.mockImplementation((key) => `value-${key}`);

                await unifiedStore.createSession();

                expect(mockSessionCoordinator.createSession).toHaveBeenCalledWith({
                    localKey: 'value-localKey',
                    remoteKey: 'value-remoteKey',
                    pairingPhrase: 'value-pairingPhrase',
                    serverHost: 'value-serverHost',
                    expiresAt: expect.any(Number)
                });
            });
        });

        describe('refreshSession()', () => {
            it('should delegate to session coordinator', async () => {
                mockSessionCoordinator.refreshSession.mockResolvedValue(true);

                const result = await unifiedStore.refreshSession();

                expect(result).toBe(true);
                expect(mockSessionCoordinator.refreshSession).toHaveBeenCalled();
            });
        });

        describe('hasActiveSession()', () => {
            it('should delegate to session coordinator', () => {
                mockSessionCoordinator.hasActiveSession.mockReturnValue(true);

                expect(unifiedStore.hasActiveSession()).toBe(true);
            });
        });

        describe('getSessionTimeRemaining()', () => {
            it('should delegate to session coordinator', async () => {
                mockSessionCoordinator.getTimeRemaining.mockResolvedValue(3600000);

                const result = await unifiedStore.getSessionTimeRemaining();

                expect(result).toBe(3600000);
                expect(mockSessionCoordinator.getTimeRemaining).toHaveBeenCalled();
            });
        });

        describe('createSessionAfterConnection()', () => {
            it('should delegate to auth coordinator', async () => {
                await unifiedStore.createSessionAfterConnection();

                expect(mockAuthCoordinator.createSessionAfterConnection).toHaveBeenCalled();
            });
        });
    });

    describe('Session refresh management', () => {
        describe('isAutoRefreshActive()', () => {
            it('should delegate to session coordinator', () => {
                mockSessionCoordinator.isAutoRefreshActive.mockReturnValue(true);

                expect(unifiedStore.isAutoRefreshActive()).toBe(true);
            });
        });

        describe('getTimeSinceLastActivity()', () => {
            it('should delegate to refresh manager when available', () => {
                mockRefreshManager.getTimeSinceLastActivity.mockReturnValue(30000);

                const result = unifiedStore.getTimeSinceLastActivity();

                expect(result).toBe(30000);
                expect(mockRefreshManager.getTimeSinceLastActivity).toHaveBeenCalled();
            });

            it('should return 0 when no refresh manager', () => {
                mockSessionCoordinator.getRefreshManager.mockReturnValue(undefined);

                const result = unifiedStore.getTimeSinceLastActivity();

                expect(result).toBe(0);
            });
        });

        describe('recordActivity()', () => {
            it('should delegate to refresh manager when available', () => {
                unifiedStore.recordActivity();

                expect(mockRefreshManager.recordActivity).toHaveBeenCalled();
            });

            it('should do nothing when no refresh manager', () => {
                mockSessionCoordinator.getRefreshManager.mockReturnValue(undefined);

                expect(() => unifiedStore.recordActivity()).not.toThrow();
            });
        });
    });

    describe('Integration tests', () => {
        it('should handle full credential lifecycle', async () => {
            // Set credentials
            unifiedStore.pairingPhrase = 'test-phrase';
            unifiedStore.serverHost = 'test-host:443';
            unifiedStore.localKey = 'test-local';
            unifiedStore.remoteKey = 'test-remote';

            expect(unifiedStore.pairingPhrase).toBe('test-phrase');
            expect(unifiedStore.serverHost).toBe('test-host:443');
            expect(unifiedStore.localKey).toBe('test-local');
            expect(unifiedStore.remoteKey).toBe('test-remote');

            // Unlock
            mockAuthCoordinator.unlock.mockResolvedValue(true);
            mockAuthCoordinator.isUnlocked.mockReturnValue(true);

            const unlockResult = await unifiedStore.unlock({ method: 'password', password: 'test' });
            expect(unlockResult).toBe(true);

            // Create session
            await unifiedStore.createSession();
            expect(mockSessionCoordinator.createSession).toHaveBeenCalled();

            // Check authentication info
            const authInfo = await unifiedStore.getAuthenticationInfo();
            expect(authInfo).toBeDefined();

            // Clear everything
            unifiedStore.clear(false);
            expect(mockCredentialCache.clear).toHaveBeenCalled();
            expect(mockStrategyManager.clearAll).toHaveBeenCalled();
            expect(mockAuthCoordinator.clearSession).toHaveBeenCalled();
        });

        it('should handle session lifecycle', async () => {
            // Mock active session
            mockSessionCoordinator.hasActiveSession.mockReturnValue(true);
            mockSessionCoordinator.getTimeRemaining.mockResolvedValue(3600000);

            expect(unifiedStore.hasActiveSession()).toBe(true);
            expect(await unifiedStore.getSessionTimeRemaining()).toBe(3600000);

            // Refresh session
            mockSessionCoordinator.refreshSession.mockResolvedValue(true);
            const refreshResult = await unifiedStore.refreshSession();
            expect(refreshResult).toBe(true);

            // Check auto refresh
            mockSessionCoordinator.isAutoRefreshActive.mockReturnValue(true);
            expect(unifiedStore.isAutoRefreshActive()).toBe(true);

            // Record activity
            unifiedStore.recordActivity();
            expect(mockRefreshManager.recordActivity).toHaveBeenCalled();

            expect(unifiedStore.getTimeSinceLastActivity()).toBe(0);
        });

        it('should handle auto-restore workflow', async () => {
            // Mock auto-restore capability
            mockSessionCoordinator.canAutoRestore.mockResolvedValue(true);
            mockAuthCoordinator.tryAutoRestore.mockResolvedValue(true);

            const canRestore = await unifiedStore.canAutoRestore();
            expect(canRestore).toBe(true);

            const restoreResult = await unifiedStore.tryAutoRestore();
            expect(restoreResult).toBe(true);
        });
    });
});


