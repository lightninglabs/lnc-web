import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';
import { CredentialOrchestrator } from './credentialOrchestrator';
import UnifiedCredentialStore from './stores/unifiedCredentialStore';
import LncCredentialStore from './util/credentialStore';
import { PasskeyEncryptionService } from './encryption/passkeyEncryptionService';
import SessionManager from './sessions/sessionManager';

// Helper function to setup unified store spy
const setupUnifiedStoreSpy = (orchestrator: any) => {
    vi.spyOn(orchestrator, 'getUnifiedStore').mockReturnValue(mockUnifiedStore);
};

// Helper function to create orchestrator with unified store spy if needed
const createOrchestrator = (config: any) => {
    const orch = new CredentialOrchestrator(config);
    if (config.enableSessions || config.allowPasskeys) {
        setupUnifiedStoreSpy(orch);
    }
    return orch;
};

// Mock dependencies
const mockUnifiedStore = {
    unlock: vi.fn(),
    isUnlocked: vi.fn(),
    getAuthenticationInfo: vi.fn(),
    clearSession: vi.fn(),
    clear: vi.fn(),
    canAutoRestore: vi.fn(),
    tryAutoRestore: vi.fn(),
    createSessionAfterConnection: vi.fn(),
    isPaired: false,
    password: undefined,
    supportsPasskeys: vi.fn(),
    isPasskeySupported: vi.fn()
};

// Create mockLegacyStore with proper property descriptors for testing
const createMockLegacyStore = () => {
    const store: any = {
        isPaired: true,
        serverHost: '',
        pairingPhrase: '',
        clear: vi.fn()
    };
    // Make password property configurable
    Object.defineProperty(store, 'password', {
        value: 'test-password',
        writable: true,
        configurable: true
    });
    return store;
};

let mockLegacyStore = createMockLegacyStore();

const mockSessionManager = {
    config: {}
};

// Mock constructors
vi.mock('./stores/unifiedCredentialStore', () => {
    const UnifiedCredentialStoreMock = vi
        .fn()
        .mockImplementation(() => {
            Object.setPrototypeOf(
                mockUnifiedStore,
                UnifiedCredentialStoreMock.prototype
            );
            return mockUnifiedStore;
        });

    return { default: UnifiedCredentialStoreMock };
});

vi.mock('./util/credentialStore', () => ({
    default: vi.fn().mockImplementation(() => mockLegacyStore)
}));

vi.mock('./sessions/sessionManager', () => ({
    default: vi.fn().mockImplementation(() => mockSessionManager)
}));

// Mock static methods
vi.mock('./encryption/passkeyEncryptionService', () => ({
    PasskeyEncryptionService: {
        isSupported: vi.fn()
    }
}));

describe('CredentialOrchestrator', () => {
    let orchestrator: CredentialOrchestrator;

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset mock defaults
        mockUnifiedStore.unlock.mockResolvedValue(false);
        mockUnifiedStore.isUnlocked.mockReturnValue(false);
        mockUnifiedStore.getAuthenticationInfo.mockResolvedValue({
            isUnlocked: false,
            hasStoredCredentials: false,
            hasActiveSession: false,
            supportsPasskeys: true,
            hasPasskey: false,
            preferredUnlockMethod: 'password'
        });
        mockUnifiedStore.clearSession.mockReturnValue(undefined);
        mockUnifiedStore.canAutoRestore.mockResolvedValue(false);
        mockUnifiedStore.tryAutoRestore.mockResolvedValue(false);
        mockUnifiedStore.createSessionAfterConnection.mockResolvedValue(undefined);
        mockUnifiedStore.isPaired = false;
        mockUnifiedStore.password = undefined;

        // Recreate mockLegacyStore to ensure clean state
        mockLegacyStore = createMockLegacyStore();

        PasskeyEncryptionService.isSupported.mockResolvedValue(true);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create unified store when sessions are enabled', () => {
            const config = { enableSessions: true, allowPasskeys: false };
            orchestrator = new CredentialOrchestrator(config);

            expect(UnifiedCredentialStore).toHaveBeenCalledWith(config, expect.any(Object));
            expect(SessionManager).toHaveBeenCalledWith('default', expect.any(Object));
        });

        it('should create unified store when passkeys are enabled', () => {
            const config = { enableSessions: false, allowPasskeys: true };
            orchestrator = new CredentialOrchestrator(config);

            expect(UnifiedCredentialStore).toHaveBeenCalledWith(config, undefined);
            expect(SessionManager).not.toHaveBeenCalled();
        });

        it('should create legacy store when neither sessions nor passkeys are enabled', () => {
            const config = { enableSessions: false, allowPasskeys: false };
            orchestrator = new CredentialOrchestrator(config);

            expect(LncCredentialStore).toHaveBeenCalledWith('default', undefined);
            expect(UnifiedCredentialStore).not.toHaveBeenCalled();
        });

        it('should use custom namespace', () => {
            const config = { namespace: 'custom-namespace', enableSessions: false, allowPasskeys: false };
            orchestrator = new CredentialOrchestrator(config);

            expect(LncCredentialStore).toHaveBeenCalledWith('custom-namespace', undefined);
        });

        it('should use provided credential store', () => {
            const customStore = { isPaired: true };
            const config = { credentialStore: customStore as any };
            orchestrator = new CredentialOrchestrator(config);

            expect(orchestrator.getCredentialStore()).toBe(customStore);
            expect(UnifiedCredentialStore).not.toHaveBeenCalled();
            expect(LncCredentialStore).not.toHaveBeenCalled();
        });

        it('should set initial values for legacy store', () => {
            const config = {
                enableSessions: false,
                allowPasskeys: false,
                serverHost: 'test-host:443',
                pairingPhrase: 'test-phrase'
            };
            orchestrator = new CredentialOrchestrator(config);

            expect(LncCredentialStore).toHaveBeenCalledWith('default', undefined);
            // The legacy store initialization would happen in the constructor
        });
    });

    describe('Unified store creation', () => {
        it('should create session manager with custom TTL', () => {
            const config = {
                enableSessions: true,
                sessionTTL: 3600000 // 1 hour
            };
            orchestrator = new CredentialOrchestrator(config);

            expect(SessionManager).toHaveBeenCalledWith('default', expect.objectContaining({
                sessionDuration: 3600000
            }));
        });

        it('should create session manager with default TTL', () => {
            const config = { enableSessions: true };
            orchestrator = new CredentialOrchestrator(config);

            expect(SessionManager).toHaveBeenCalledWith('default', expect.objectContaining({
                sessionDuration: 24 * 60 * 60 * 1000 // 24 hours
            }));
        });

        it('should set initial values for unified store', () => {
            const config = {
                enableSessions: true,
                serverHost: 'test-host:443',
                pairingPhrase: 'test-phrase'
            };
            orchestrator = new CredentialOrchestrator(config);

            expect(UnifiedCredentialStore).toHaveBeenCalledWith(config, expect.any(Object));
        });
    });

    describe('getCredentialStore()', () => {
        it('should return the current credential store', () => {
            const config = { enableSessions: true };
            orchestrator = new CredentialOrchestrator(config);

            expect(orchestrator.getCredentialStore()).toBe(mockUnifiedStore);
        });
    });

    describe('performAutoLogin()', () => {
        beforeEach(() => {
            orchestrator = createOrchestrator({ enableSessions: true });
        });

        it('should return true when auto-restore succeeds', async () => {
            mockUnifiedStore.canAutoRestore.mockResolvedValue(true);
            mockUnifiedStore.tryAutoRestore.mockResolvedValue(true);

            const result = await orchestrator.performAutoLogin();

            expect(result).toBe(true);
            expect(mockUnifiedStore.canAutoRestore).toHaveBeenCalled();
            expect(mockUnifiedStore.tryAutoRestore).toHaveBeenCalled();
        });

        it('should return false when canAutoRestore returns false', async () => {
            mockUnifiedStore.canAutoRestore.mockResolvedValue(false);

            const result = await orchestrator.performAutoLogin();

            expect(result).toBe(false);
            expect(mockUnifiedStore.tryAutoRestore).not.toHaveBeenCalled();
        });

        it('should return false when tryAutoRestore fails', async () => {
            mockUnifiedStore.canAutoRestore.mockResolvedValue(true);
            mockUnifiedStore.tryAutoRestore.mockResolvedValue(false);

            const result = await orchestrator.performAutoLogin();

            expect(result).toBe(false);
        });

        it('should return false for legacy store', async () => {
            orchestrator = new CredentialOrchestrator({ enableSessions: false, allowPasskeys: false });

            const result = await orchestrator.performAutoLogin();

            expect(result).toBe(false);
        });
    });

    describe('clear()', () => {
        beforeEach(() => {
            orchestrator = createOrchestrator({ enableSessions: true });
        });

        it('should clear session when session option is true', async () => {
            await orchestrator.clear({ session: true, persisted: false });

            expect(mockUnifiedStore.clearSession).toHaveBeenCalled();
        });

        it('should clear persisted credentials when persisted option is true', async () => {
            await orchestrator.clear({ session: false, persisted: true });

            expect(orchestrator.getCredentialStore().clear).toHaveBeenCalled();
        });

        it('should clear session by default', async () => {
            await orchestrator.clear();

            expect(mockUnifiedStore.clearSession).toHaveBeenCalled();
            expect(orchestrator.getCredentialStore().clear).not.toHaveBeenCalled();
        });

        it('should not clear session for legacy store', async () => {
            orchestrator = new CredentialOrchestrator({ enableSessions: false, allowPasskeys: false });

            await orchestrator.clear({ session: true });

            expect(mockUnifiedStore.clearSession).not.toHaveBeenCalled();
        });
    });

    describe('getAuthenticationInfo()', () => {
        it('should return auth info from unified store', async () => {
            orchestrator = createOrchestrator({ enableSessions: true });
            const authInfo = {
                isUnlocked: true,
                hasStoredCredentials: true,
                hasActiveSession: true,
                supportsPasskeys: true,
                hasPasskey: false,
                preferredUnlockMethod: 'session'
            };
            mockUnifiedStore.getAuthenticationInfo.mockResolvedValue(authInfo);

            const result = await orchestrator.getAuthenticationInfo();

            expect(result).toBe(authInfo);
        });

        it('should return fallback auth info for legacy store', async () => {
            orchestrator = new CredentialOrchestrator({ enableSessions: false, allowPasskeys: false });

            const result = await orchestrator.getAuthenticationInfo();

            expect(result).toEqual({
                isUnlocked: true, // password is set
                hasStoredCredentials: true, // isPaired is true
                hasActiveSession: false,
                supportsPasskeys: false,
                hasPasskey: false,
                preferredUnlockMethod: 'password'
            });
        });

        it('should return unlocked false for legacy store without password', async () => {
            orchestrator = new CredentialOrchestrator({ enableSessions: false, allowPasskeys: false });
            mockLegacyStore.password = undefined;

            const result = await orchestrator.getAuthenticationInfo();

            expect(result.isUnlocked).toBe(false);
        });
    });

    describe('unlock()', () => {
        it('should delegate to unified store', async () => {
            orchestrator = createOrchestrator({ enableSessions: true });
            const options = { method: 'password' as const, password: 'test' };
            mockUnifiedStore.unlock.mockResolvedValue(true);

            const result = await orchestrator.unlock(options);

            expect(result).toBe(true);
            expect(mockUnifiedStore.unlock).toHaveBeenCalledWith(options);
        });

        it('should handle password unlock for legacy store', async () => {
            orchestrator = new CredentialOrchestrator({ enableSessions: false, allowPasskeys: false });
            const options = { method: 'password' as const, password: 'test-password' };

            const result = await orchestrator.unlock(options);

            expect(result).toBe(true);
            expect(mockLegacyStore.password).toBe('test-password');
        });

        it('should return false for unsupported unlock method on legacy store', async () => {
            orchestrator = new CredentialOrchestrator({ enableSessions: false, allowPasskeys: false });
            const options = { method: 'passkey' as const };

            const result = await orchestrator.unlock(options);

            expect(result).toBe(false);
        });

        it('should handle unlock errors for legacy store', async () => {
            orchestrator = new CredentialOrchestrator({ enableSessions: false, allowPasskeys: false });
            const options = { method: 'password' as const, password: 'test' };

            // Mock setter to throw
            Object.defineProperty(mockLegacyStore, 'password', {
                set: vi.fn(() => { throw new Error('Set error'); }),
                configurable: true
            });

            const result = await orchestrator.unlock(options);

            expect(result).toBe(false);
        });
    });

    describe('isUnlocked getter', () => {
        it('should delegate to unified store', () => {
            orchestrator = createOrchestrator({ enableSessions: true });
            mockUnifiedStore.isUnlocked.mockReturnValue(true);

            expect(orchestrator.isUnlocked).toBe(true);
        });

        it('should check password for legacy store', () => {
            orchestrator = new CredentialOrchestrator({ enableSessions: false, allowPasskeys: false });
            mockLegacyStore.password = 'test-password';

            expect(orchestrator.isUnlocked).toBe(true);

            mockLegacyStore.password = undefined;

            expect(orchestrator.isUnlocked).toBe(false);
        });
    });

    describe('isPaired getter', () => {
        it('should return store isPaired property', () => {
            orchestrator = createOrchestrator({ enableSessions: true });
            mockUnifiedStore.isPaired = true;

            expect(orchestrator.isPaired).toBe(true);
        });
    });

    describe('supportsPasskeys()', () => {
        it('should delegate to unified store', async () => {
            orchestrator = createOrchestrator({ enableSessions: true });
            mockUnifiedStore.getAuthenticationInfo.mockResolvedValue({
                supportsPasskeys: true,
                hasPasskey: false,
                isUnlocked: false,
                hasStoredCredentials: false,
                hasActiveSession: false,
                preferredUnlockMethod: 'password'
            });

            const result = await orchestrator.supportsPasskeys();

            expect(result).toBe(true);
        });

        it('should return false for legacy store', async () => {
            orchestrator = new CredentialOrchestrator({ enableSessions: false, allowPasskeys: false });

            const result = await orchestrator.supportsPasskeys();

            expect(result).toBe(false);
        });
    });

    describe('persistWithPassword()', () => {
        it('should unlock with password and create session for unified store', async () => {
            orchestrator = createOrchestrator({ enableSessions: true });
            mockUnifiedStore.unlock.mockResolvedValue(true);

            await orchestrator.persistWithPassword('test-password');

            expect(mockUnifiedStore.unlock).toHaveBeenCalledWith({
                method: 'password',
                password: 'test-password'
            });
            expect(mockUnifiedStore.createSessionAfterConnection).toHaveBeenCalled();
        });

        it('should throw error when unlock fails for unified store', async () => {
            orchestrator = createOrchestrator({ enableSessions: true });
            mockUnifiedStore.unlock.mockResolvedValue(false);

            await expect(orchestrator.persistWithPassword('test-password')).rejects.toThrow(
                'Failed to unlock credentials with password'
            );
        });

        it('should set password directly for legacy store', async () => {
            orchestrator = new CredentialOrchestrator({ enableSessions: false, allowPasskeys: false });

            await orchestrator.persistWithPassword('test-password');

            expect(mockLegacyStore.password).toBe('test-password');
            expect(mockUnifiedStore.unlock).not.toHaveBeenCalled();
        });

        it('should throw error when no credential store', async () => {
            orchestrator = createOrchestrator({ enableSessions: true });
            (orchestrator as any).currentCredentialStore = undefined;

            await expect(orchestrator.persistWithPassword('test-password')).rejects.toThrow(
                'No credentials store available'
            );
        });
    });

    describe('persistWithPasskey()', () => {
        it('should unlock with passkey and create session for unified store', async () => {
            orchestrator = createOrchestrator({ enableSessions: true });
            mockUnifiedStore.unlock.mockResolvedValue(true);

            await orchestrator.persistWithPasskey();

            expect(mockUnifiedStore.unlock).toHaveBeenCalledWith({
                method: 'passkey',
                createIfMissing: true
            });
            expect(mockUnifiedStore.createSessionAfterConnection).toHaveBeenCalled();
        });

        it('should throw error when unlock fails for unified store', async () => {
            orchestrator = createOrchestrator({ enableSessions: true });
            mockUnifiedStore.unlock.mockResolvedValue(false);

            await expect(orchestrator.persistWithPasskey()).rejects.toThrow(
                'Failed to create/use passkey for credentials'
            );
        });

        it('should throw error for legacy store', async () => {
            orchestrator = new CredentialOrchestrator({ enableSessions: false, allowPasskeys: false });

            await expect(orchestrator.persistWithPasskey()).rejects.toThrow(
                'Passkey authentication requires the new credential store (enable sessions or passkeys)'
            );
        });

        it('should throw error when no credential store is available', async () => {
            orchestrator = createOrchestrator({ enableSessions: true });
            (orchestrator as any).currentCredentialStore = undefined;

            await expect(orchestrator.persistWithPasskey()).rejects.toThrow('No credentials store available');
        });
    });

    describe('isPasskeySupported() static method', () => {
        it('should delegate to PasskeyEncryptionService.isSupported', async () => {
            PasskeyEncryptionService.isSupported.mockResolvedValue(true);

            const result = await CredentialOrchestrator.isPasskeySupported();

            expect(result).toBe(true);
            expect(PasskeyEncryptionService.isSupported).toHaveBeenCalled();
        });
    });

    describe('getUnifiedStore() private method', () => {
        it('should return unified store when available', () => {
            // Create directly without spy to test real instanceof check
            orchestrator = new CredentialOrchestrator({ enableSessions: true });

            const result = (orchestrator as any).getUnifiedStore();

            expect(result).toBe(mockUnifiedStore);
        });

        it('should return undefined for legacy store', () => {
            orchestrator = new CredentialOrchestrator({ enableSessions: false, allowPasskeys: false });

            const result = (orchestrator as any).getUnifiedStore();

            expect(result).toBeUndefined();
        });
    });

    describe('Integration tests', () => {
        it('should handle unified store workflow', async () => {
            orchestrator = createOrchestrator({ enableSessions: true, allowPasskeys: true });

            // Test authentication info
            const authInfo = await orchestrator.getAuthenticationInfo();
            expect(authInfo.supportsPasskeys).toBe(true);

            // Test unlock
            mockUnifiedStore.unlock.mockResolvedValue(true);
            const unlockResult = await orchestrator.unlock({ method: 'password', password: 'test' });
            expect(unlockResult).toBe(true);

            // Test auto-login
            mockUnifiedStore.canAutoRestore.mockResolvedValue(true);
            mockUnifiedStore.tryAutoRestore.mockResolvedValue(true);
            const autoLoginResult = await orchestrator.performAutoLogin();
            expect(autoLoginResult).toBe(true);

            // Test clear
            await orchestrator.clear();
            expect(mockUnifiedStore.clearSession).toHaveBeenCalled();

            // Test persistence
            await orchestrator.persistWithPassword('test-password');
            expect(mockUnifiedStore.createSessionAfterConnection).toHaveBeenCalled();
        });

        it('should handle legacy store workflow', async () => {
            orchestrator = new CredentialOrchestrator({ enableSessions: false, allowPasskeys: false });

            // Test authentication info
            const authInfo = await orchestrator.getAuthenticationInfo();
            expect(authInfo.supportsPasskeys).toBe(false);

            // Test unlock
            const unlockResult = await orchestrator.unlock({ method: 'password', password: 'legacy-password' });
            expect(unlockResult).toBe(true);

            // Test auto-login (should fail)
            const autoLoginResult = await orchestrator.performAutoLogin();
            expect(autoLoginResult).toBe(false);

            // Test clear
            await orchestrator.clear();
            expect(mockLegacyStore.clear).toHaveBeenCalled();

            // Test persistence
            await orchestrator.persistWithPassword('legacy-password');
            expect(mockLegacyStore.password).toBe('legacy-password');

            // Test passkey persistence (should fail)
            await expect(orchestrator.persistWithPasskey()).rejects.toThrow();
        });

        it('should handle custom credential store', () => {
            const customStore = {
                isPaired: true,
                password: 'custom-password',
                unlock: vi.fn().mockResolvedValue(true),
                createSessionAfterConnection: vi.fn()
            };
            const config = { credentialStore: customStore };
            orchestrator = new CredentialOrchestrator(config);

            expect(orchestrator.getCredentialStore()).toBe(customStore);
            expect(orchestrator.isPaired).toBe(true);
            expect(orchestrator.isUnlocked).toBe(true);
        });
    });
});


