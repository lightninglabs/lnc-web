import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CredentialOrchestrator } from './credentialOrchestrator';
import { PasskeyEncryptionService } from './encryption/passkeyEncryptionService';
import SessionManager from './sessions/sessionManager';
import UnifiedCredentialStore from './stores/unifiedCredentialStore';
import { CredentialStore } from './types/lnc';
import LncCredentialStore from './util/credentialStore';
import { log } from './util/log';

// Helper function to create orchestrator
const createOrchestrator = (config: any) => {
  return new CredentialOrchestrator(config);
};

// Mock dependencies
const createMockUnifiedStore = () => {
  const store: any = {
    unlock: vi.fn(),
    get isUnlocked() {
      return store._isUnlocked;
    },
    _isUnlocked: false,
    getAuthenticationInfo: vi.fn(),
    clearSession: vi.fn(function (this: any) {
      // Clear in-memory data when session is cleared
      this.localKey = '';
      this.remoteKey = '';
    }),
    clear: vi.fn(function (this: any, memoryOnly?: boolean) {
      if (!memoryOnly) {
        // Clear persisted data
        const storeNamespace = this._namespace || 'default';
        const key = `lnc-web:${storeNamespace}`;
        localStorage.removeItem(key);
      }
      // Clear in-memory data
      this.localKey = '';
      this.remoteKey = '';
    }),
    canAutoRestore: vi.fn(),
    tryAutoRestore: vi.fn(),
    createSessionAfterConnection: vi.fn(),
    isPaired: false,
    localKey: '',
    remoteKey: '',
    password: undefined,
    supportsPasskeys: vi.fn(),
    isPasskeySupported: vi.fn()
  };
  return store;
};

const mockUnifiedStore = createMockUnifiedStore();

// Create mockLegacyStore with proper property descriptors for testing
const createMockLegacyStore = () => {
  const store: any = {
    isPaired: true,
    serverHost: '',
    pairingPhrase: '',
    localKey: '',
    remoteKey: '',
    clear: vi.fn(function (this: any, memoryOnly?: boolean) {
      if (!memoryOnly) {
        // Clear persisted data
        const storeNamespace = this._namespace || 'default';
        const key = `lnc-web:${storeNamespace}`;
        localStorage.removeItem(key);
      }
      // Clear in-memory data
      this.localKey = '';
      this.remoteKey = '';
      this.pairingPhrase = '';
    })
  };
  // Make password property configurable with setter that persists
  Object.defineProperty(store, 'password', {
    get: () => store._password || '',
    set: (password: string) => {
      store._password = password;
      // Simulate persistence: save cipher and salt to localStorage
      if (password) {
        const storeNamespace = store._namespace || 'default';
        const key = `lnc-web:${storeNamespace}`;
        const persisted = {
          salt: 'test-salt',
          cipher: 'test-cipher',
          serverHost: store.serverHost || '',
          localKey: '',
          remoteKey: '',
          pairingPhrase: ''
        };
        localStorage.setItem(key, JSON.stringify(persisted));
        store._persisted = true;
        // Note: Real implementation clears password after persisting,
        // but for tests we keep it to allow checking unlock state
      }
    },
    configurable: true
  });
  return store;
};

let mockLegacyStore = createMockLegacyStore();

// Mock constructors
vi.mock('./stores/unifiedCredentialStore', () => {
  const UnifiedCredentialStoreMock = vi
    .fn()
    .mockImplementation((config?: any) => {
      mockUnifiedStore._namespace = config?.namespace || 'default';
      Object.setPrototypeOf(
        mockUnifiedStore,
        UnifiedCredentialStoreMock.prototype
      );
      return mockUnifiedStore;
    });

  return { default: UnifiedCredentialStoreMock };
});

vi.mock('./util/credentialStore', () => {
  const LncCredentialStoreMock = vi
    .fn()
    .mockImplementation((namespace?: string, password?: string) => {
      mockLegacyStore._namespace = namespace || 'default';
      // If password is provided in constructor, set it (which will persist)
      if (password) {
        mockLegacyStore.password = password;
      }
      return mockLegacyStore;
    });
  return { default: LncCredentialStoreMock };
});

vi.mock('./sessions/sessionManager', () => ({
  default: vi.fn().mockImplementation(() => ({
    config: { sessionDuration: 24 * 60 * 60 * 1000 }
  }))
}));

// Mock static methods
vi.mock('./encryption/passkeyEncryptionService', () => ({
  PasskeyEncryptionService: {
    isSupported: vi.fn().mockResolvedValue(true)
  }
}));

describe('CredentialOrchestrator', () => {
  let orchestrator: CredentialOrchestrator;

  describe('constructor and store creation', () => {
    it('should create legacy store by default', () => {
      const orchestrator = new CredentialOrchestrator({});
      const store = orchestrator.credentialStore;

      // Since LncCredentialStore is mocked, check that it's the mock instance
      expect(store).toBe(mockLegacyStore);
    });

    it('should create UnifiedCredentialStore when allowPasskeys is true', () => {
      const orchestrator = new CredentialOrchestrator({
        allowPasskeys: true
      });

      expect(orchestrator.credentialStore).toBe(mockUnifiedStore);
    });

    it('should create unified store when passkeys are enabled', () => {
      const orchestrator = new CredentialOrchestrator({ allowPasskeys: true });

      expect(orchestrator.credentialStore).toBe(mockUnifiedStore);
    });

    it('should create unified store with custom session ttl', () => {
      new CredentialOrchestrator({
        enableSessions: true,
        sessionDuration: 3600000
      });

      expect(SessionManager).toHaveBeenCalledWith(
        'default',
        expect.objectContaining({
          sessionDuration: 3600000
        })
      );
    });

    it('should use custom credential store if provided', () => {
      const customStore: any = {
        password: undefined,
        pairingPhrase: '',
        serverHost: '',
        localKey: '',
        remoteKey: '',
        isPaired: false,
        clear: vi.fn()
      };

      const orchestrator = new CredentialOrchestrator({
        credentialStore: customStore
      });

      expect(orchestrator.credentialStore).toBe(customStore);
    });

    it('should set serverHost from config for UnifiedCredentialStore', () => {
      const orchestrator = new CredentialOrchestrator({
        allowPasskeys: true,
        serverHost: 'test.server:443'
      });
      const store = orchestrator.credentialStore;

      expect(store.serverHost).toBe('test.server:443');
    });

    it('should set pairingPhrase from config for UnifiedCredentialStore', () => {
      const orchestrator = new CredentialOrchestrator({
        allowPasskeys: true,
        pairingPhrase: 'test-pairing-phrase'
      });
      const store = orchestrator.credentialStore;

      expect(store.pairingPhrase).toBe('test-pairing-phrase');
    });

    it('should set serverHost from config for legacy store', () => {
      // Create a new mock store that is not paired
      const unpairedStore = createMockLegacyStore();
      unpairedStore.isPaired = false;
      vi.mocked(LncCredentialStore).mockReturnValueOnce(unpairedStore);

      const orchestrator = new CredentialOrchestrator({
        serverHost: 'test.server:443'
      });
      const store = orchestrator.credentialStore;

      expect(store.serverHost).toBe('test.server:443');
    });

    it('should set pairingPhrase from config for unified store', () => {
      const orchestrator = new CredentialOrchestrator({
        allowPasskeys: true,
        pairingPhrase: 'test-pairing-phrase'
      });

      const store = orchestrator.credentialStore as any;

      expect(store.pairingPhrase).toBe('test-pairing-phrase');
    });

    it('should set pairingPhrase from config for legacy store', () => {
      const orchestrator = new CredentialOrchestrator({
        pairingPhrase: 'test-pairing-phrase'
      });
      const store = orchestrator.credentialStore;

      expect(store.pairingPhrase).toBe('test-pairing-phrase');
    });
  });

  describe('performAutoLogin', () => {
    it('returns true when auto-restore succeeds', async () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });
      mockUnifiedStore.canAutoRestore.mockResolvedValue(true);
      mockUnifiedStore.tryAutoRestore.mockResolvedValue(true);

      const result = await orchestrator.performAutoLogin();

      expect(result).toBe(true);
      expect(mockUnifiedStore.canAutoRestore).toHaveBeenCalled();
      expect(mockUnifiedStore.tryAutoRestore).toHaveBeenCalled();
    });

    it('returns false when canAutoRestore is false', async () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });
      mockUnifiedStore.canAutoRestore.mockResolvedValue(false);

      const result = await orchestrator.performAutoLogin();

      expect(result).toBe(false);
      expect(mockUnifiedStore.tryAutoRestore).not.toHaveBeenCalled();
    });

    it('returns false for legacy store', async () => {
      const orchestrator = new CredentialOrchestrator({});

      const result = await orchestrator.performAutoLogin();

      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('clears session by default for unified store', () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });

      orchestrator.clear();

      expect(mockUnifiedStore.clearSession).toHaveBeenCalled();
      expect(mockUnifiedStore.clear).not.toHaveBeenCalled();
    });

    it('clears persisted credentials when requested', () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });

      orchestrator.clear({ session: false, persisted: true });

      expect(mockUnifiedStore.clear).toHaveBeenCalled();
    });

    it('clears both session and persisted credentials', () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });

      orchestrator.clear({ session: true, persisted: true });

      expect(mockUnifiedStore.clearSession).toHaveBeenCalled();
      expect(mockUnifiedStore.clear).toHaveBeenCalled();
    });

    it('clears legacy credentials when session is requested', () => {
      const orchestrator = new CredentialOrchestrator({});

      orchestrator.clear({ session: true });

      expect(mockLegacyStore.clear).toHaveBeenCalled();
    });
  });

  describe('getAuthenticationInfo', () => {
    it('returns unified store auth info when available', async () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });
      const authInfo = {
        isUnlocked: true,
        hasStoredCredentials: true,
        hasActiveSession: true,
        sessionTimeRemaining: 1000,
        supportsPasskeys: true,
        hasPasskey: false,
        preferredUnlockMethod: 'session' as const
      };
      mockUnifiedStore.getAuthenticationInfo.mockResolvedValue(authInfo);

      const result = await orchestrator.getAuthenticationInfo();

      expect(result).toBe(authInfo);
    });

    it('returns fallback auth info for legacy store', async () => {
      const orchestrator = new CredentialOrchestrator({});

      const info = await orchestrator.getAuthenticationInfo();

      expect(info).toEqual({
        isUnlocked: false,
        hasStoredCredentials: true,
        hasActiveSession: false,
        sessionTimeRemaining: 0,
        supportsPasskeys: false,
        hasPasskey: false,
        preferredUnlockMethod: 'password'
      });
    });
  });

  describe('unlock', () => {
    it('should unlock UnifiedCredentialStore with password', async () => {
      const orchestrator = new CredentialOrchestrator({
        allowPasskeys: true,
        namespace: 'test-unlock'
      });

      mockUnifiedStore.unlock.mockResolvedValue(true);
      mockUnifiedStore._isUnlocked = true;

      const result = await orchestrator.unlock({
        method: 'password',
        password: 'test-password'
      });

      expect(result).toBe(true);
      expect(mockUnifiedStore.unlock).toHaveBeenCalledWith({
        method: 'password',
        password: 'test-password'
      });
    });

    it('unlocks legacy store with password', async () => {
      const orchestrator = new CredentialOrchestrator({});

      const result = await orchestrator.unlock({
        method: 'password',
        password: 'test-password'
      });

      expect(result).toBe(true);
      expect(mockLegacyStore.password).toBe('test-password');
    });

    it('returns false for legacy unlock errors', async () => {
      const orchestrator = new CredentialOrchestrator({});
      Object.defineProperty(mockLegacyStore, 'password', {
        set: vi.fn(() => {
          throw new Error('Set error');
        }),
        configurable: true
      });

      const result = await orchestrator.unlock({
        method: 'password',
        password: 'test'
      });

      expect(result).toBe(false);
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock defaults
    mockUnifiedStore.unlock.mockResolvedValue(false);
    mockUnifiedStore._isUnlocked = false;
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
    if (!mockUnifiedStore.createSessionAfterConnection) {
      mockUnifiedStore.createSessionAfterConnection = vi.fn();
    }
    mockUnifiedStore.createSessionAfterConnection.mockResolvedValue(undefined);
    mockUnifiedStore.isPaired = false;
    mockUnifiedStore.password = undefined;

    // Recreate mockLegacyStore to ensure clean state
    mockLegacyStore = createMockLegacyStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create unified store when sessions are enabled', () => {
      const config = { enableSessions: true, allowPasskeys: false };
      orchestrator = new CredentialOrchestrator(config);

      expect(UnifiedCredentialStore).toHaveBeenCalledWith(
        config,
        expect.any(Object)
      );
      expect(SessionManager).toHaveBeenCalledWith(
        'default',
        expect.any(Object)
      );
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
      const config = {
        namespace: 'custom-namespace',
        enableSessions: false,
        allowPasskeys: false
      };
      orchestrator = new CredentialOrchestrator(config);

      expect(LncCredentialStore).toHaveBeenCalledWith(
        'custom-namespace',
        undefined
      );
    });

    it('should use provided credential store', () => {
      const customStore = { isPaired: true };
      const config = { credentialStore: customStore as any };
      orchestrator = new CredentialOrchestrator(config);

      expect(orchestrator.credentialStore).toBe(customStore);
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
        sessionDuration: 3600000 // 1 hour
      };
      orchestrator = new CredentialOrchestrator(config);

      expect(SessionManager).toHaveBeenCalledWith(
        'default',
        expect.objectContaining({
          sessionDuration: 3600000
        })
      );
    });

    it('should create session manager with default TTL', () => {
      const config = { enableSessions: true };
      orchestrator = new CredentialOrchestrator(config);

      expect(SessionManager).toHaveBeenCalledWith(
        'default',
        expect.objectContaining({
          sessionDuration: 24 * 60 * 60 * 1000 // 24 hours
        })
      );
    });

    it('should set initial values for unified store', () => {
      const config = {
        enableSessions: true,
        serverHost: 'test-host:443',
        pairingPhrase: 'test-phrase'
      };
      orchestrator = new CredentialOrchestrator(config);

      expect(UnifiedCredentialStore).toHaveBeenCalledWith(
        config,
        expect.any(Object)
      );
    });
  });

  describe('credentialStore getter', () => {
    it('should return the current credential store', () => {
      const config = { enableSessions: true };
      orchestrator = createOrchestrator(config);

      expect(orchestrator.credentialStore).toBe(mockUnifiedStore);
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
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });

      const result = await orchestrator.performAutoLogin();

      expect(result).toBe(false);
    });

    it('should persist with legacy store', async () => {
      const orchestrator = new CredentialOrchestrator({
        namespace: 'test-persist-legacy'
      });

      // Set some credentials first
      const store = orchestrator.credentialStore;
      store.localKey = 'test-local-key';
      store.remoteKey = 'test-remote-key';

      await orchestrator.persistWithPassword('test-password');

      // Legacy store clears in-memory password after persisting encrypted data,
      // but the data should be persisted to localStorage
      expect(store.isPaired).toBe(true);
      // Verify data was persisted by checking localStorage
      const key = 'lnc-web:test-persist-legacy';
      const persisted = JSON.parse(localStorage.getItem(key) || '{}');
      expect(persisted.cipher).toBeDefined();
      expect(persisted.salt).toBeDefined();
    });

    it('should throw if unlock fails during persist', async () => {
      const orchestrator = new CredentialOrchestrator({
        allowPasskeys: true,
        namespace: 'test-persist-fail'
      });

      // Mock unlock to fail by using a store with failing strategy
      const store = orchestrator.credentialStore as UnifiedCredentialStore;
      vi.spyOn(store, 'unlock').mockResolvedValue(false);

      await expect(
        orchestrator.persistWithPassword('test-password')
      ).rejects.toThrow('Failed to unlock credentials with password');
    });
  });

  describe('persistWithPasskey', () => {
    it('should persist credentials with passkey using UnifiedCredentialStore', async () => {
      const orchestrator = new CredentialOrchestrator({
        allowPasskeys: true,
        namespace: 'test-persist-passkey'
      });

      const store = orchestrator.credentialStore as UnifiedCredentialStore;
      store.localKey = 'test-local-key';
      store.remoteKey = 'test-remote-key';

      // Mock unlock to succeed
      vi.spyOn(store, 'unlock').mockResolvedValue(true);

      await orchestrator.persistWithPasskey();

      expect(store.unlock).toHaveBeenCalledWith({
        method: 'passkey',
        createIfMissing: true
      });
    });

    it('should throw error when used with legacy store', async () => {
      const orchestrator = new CredentialOrchestrator({
        namespace: 'test-persist-passkey-legacy'
      });

      await expect(orchestrator.persistWithPasskey()).rejects.toThrow(
        'Passkey authentication requires the new credential store (enable sessions or passkeys)'
      );
    });

    it('should throw if passkey unlock fails', async () => {
      const orchestrator = new CredentialOrchestrator({
        allowPasskeys: true,
        namespace: 'test-persist-passkey-fail'
      });

      // Mock unlock to fail by using a store with failing strategy
      const store = orchestrator.credentialStore as UnifiedCredentialStore;
      vi.spyOn(store, 'unlock').mockResolvedValue(false);

      await expect(orchestrator.persistWithPasskey()).rejects.toThrow(
        'Failed to create/use passkey for credentials'
      );
    });
  });

  describe('getAuthenticationInfo', () => {
    it('should return auth info from UnifiedCredentialStore', async () => {
      const orchestrator = new CredentialOrchestrator({
        allowPasskeys: true,
        namespace: 'test-auth-info'
      });

      const info = await orchestrator.getAuthenticationInfo();

      expect(info).toEqual({
        isUnlocked: false,
        hasStoredCredentials: false,
        hasActiveSession: false,
        supportsPasskeys: true,
        hasPasskey: false,
        preferredUnlockMethod: 'password'
      });
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

      expect(orchestrator.credentialStore.clear).toHaveBeenCalled();
    });

    it('should clear session by default', async () => {
      await orchestrator.clear();

      expect(mockUnifiedStore.clearSession).toHaveBeenCalled();
      expect(orchestrator.credentialStore.clear).not.toHaveBeenCalled();
    });

    it('should not clear session for legacy store', async () => {
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });

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
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });

      // Set password on mock store to simulate unlocked state
      mockLegacyStore.password = 'test-password';

      const result = await orchestrator.getAuthenticationInfo();

      expect(result).toEqual({
        isUnlocked: true, // password is set
        hasStoredCredentials: true, // isPaired is true
        hasActiveSession: false,
        sessionTimeRemaining: 0,
        supportsPasskeys: false,
        hasPasskey: false,
        preferredUnlockMethod: 'password'
      });
    });
  });

  describe('unlock()', () => {
    it('should return unlocked false for legacy store without password', async () => {
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });
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
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });
      const options = {
        method: 'password' as const,
        password: 'test-password'
      };

      const result = await orchestrator.unlock(options);

      expect(result).toBe(true);
      expect(mockLegacyStore.password).toBe('test-password');
    });

    it('should return false for unsupported unlock method on legacy store', async () => {
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });
      const options = { method: 'passkey' as const };

      const result = await orchestrator.unlock(options);

      expect(result).toBe(false);
    });

    it('should handle unlock errors for legacy store', async () => {
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });
      const options = { method: 'password' as const, password: 'test' };

      // Mock setter to throw
      Object.defineProperty(mockLegacyStore, 'password', {
        set: vi.fn(() => {
          throw new Error('Set error');
        }),
        configurable: true
      });

      const result = await orchestrator.unlock(options);

      expect(result).toBe(false);
    });

    it('should return false and log warning when password is missing for legacy store', async () => {
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });
      const options = {
        method: 'password' as const,
        password: undefined
      } as any;
      const warnSpy = vi.spyOn(log, 'warn');

      const result = await orchestrator.unlock(options);

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        '[CredentialOrchestrator] Legacy unlock failed: missing or empty password for method "password".'
      );
      warnSpy.mockRestore();
    });

    it('should return false and log warning when password is empty for legacy store', async () => {
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });
      const options = { method: 'password' as const, password: '' };
      const warnSpy = vi.spyOn(log, 'warn');

      const result = await orchestrator.unlock(options);

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        '[CredentialOrchestrator] Legacy unlock failed: missing or empty password for method "password".'
      );
      warnSpy.mockRestore();
    });
  });

  describe('isUnlocked getter', () => {
    it('should delegate to unified store', () => {
      orchestrator = createOrchestrator({ enableSessions: true });
      mockUnifiedStore._isUnlocked = true;

      expect(orchestrator.isUnlocked).toBe(true);
    });

    it('should check password for legacy store', () => {
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });
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

  describe('clear', () => {
    it('should clear credentials (UnifiedCredentialStore)', async () => {
      const orchestrator = new CredentialOrchestrator({
        allowPasskeys: true,
        namespace: 'test-clear'
      });

      const store = orchestrator.credentialStore as any;
      store.localKey = 'test-key';

      orchestrator.clear({ persisted: true });

      expect(store.localKey).toBe('');
    });

    it('should clear credentials (legacy store)', () => {
      const orchestrator = new CredentialOrchestrator({
        namespace: 'test-clear-legacy'
      });

      const store = orchestrator.credentialStore;
      store.localKey = 'test-key';

      orchestrator.clear();

      expect(store.localKey).toBe('');
    });

    it('should support memoryOnly flag', () => {
      const orchestrator = new CredentialOrchestrator({
        allowPasskeys: true,
        namespace: 'test-clear-memory'
      });

      const store = orchestrator.credentialStore as any;
      const clearSessionSpy = vi.spyOn(store, 'clearSession');

      orchestrator.clear({ session: true });

      expect(clearSessionSpy).toHaveBeenCalled();
    });
  });

  describe('getCredentialStore', () => {
    it('should return the underlying credential store', () => {
      const orchestrator = new CredentialOrchestrator({
        allowPasskeys: true
      });

      const store = orchestrator.credentialStore;

      expect(store).toBeInstanceOf(UnifiedCredentialStore);
    });

    it('should return same instance on multiple calls', () => {
      const orchestrator = new CredentialOrchestrator({});

      const store1 = orchestrator.credentialStore;
      const store2 = orchestrator.credentialStore;

      expect(store1).toBe(store2);
    });

    it('throws error when no credential store exists', async () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });
      (orchestrator as any).currentCredentialStore = undefined;

      await expect(
        orchestrator.persistWithPassword('test-password')
      ).rejects.toThrow('No credentials store available');
    });
  });

  describe('persistWithPasskey', () => {
    it('unlocks with passkey and creates session for unified store', async () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });
      mockUnifiedStore.unlock.mockResolvedValue(true);

      await orchestrator.persistWithPasskey();

      expect(mockUnifiedStore.unlock).toHaveBeenCalledWith({
        method: 'passkey',
        createIfMissing: true
      });
      expect(mockUnifiedStore.createSessionAfterConnection).toHaveBeenCalled();
    });

    it('should prioritize custom credentialStore over allowPasskeys', () => {
      const customStore: CredentialStore = {
        password: undefined,
        pairingPhrase: '',
        serverHost: '',
        localKey: '',
        remoteKey: '',
        isPaired: false,
        clear: vi.fn()
      };

      const orchestrator = new CredentialOrchestrator({
        credentialStore: customStore,
        allowPasskeys: true // This should be ignored
      });

      expect(orchestrator.credentialStore).toBe(customStore);
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
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });

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

      await expect(
        orchestrator.persistWithPassword('test-password')
      ).rejects.toThrow('Failed to unlock credentials with password');
    });

    it('should set password directly for legacy store', async () => {
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });

      await orchestrator.persistWithPassword('test-password');

      expect(mockLegacyStore.password).toBe('test-password');
      expect(mockUnifiedStore.unlock).not.toHaveBeenCalled();
    });

    it('should throw error when no credential store', async () => {
      orchestrator = createOrchestrator({ enableSessions: true });
      (orchestrator as any).currentCredentialStore = undefined;

      await expect(
        orchestrator.persistWithPassword('test-password')
      ).rejects.toThrow('No credentials store available');
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
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });

      await expect(orchestrator.persistWithPasskey()).rejects.toThrow(
        'Passkey authentication requires the new credential store (enable sessions or passkeys)'
      );
    });

    it('should throw error when no credential store is available', async () => {
      orchestrator = createOrchestrator({ enableSessions: true });
      (orchestrator as any).currentCredentialStore = undefined;

      await expect(orchestrator.persistWithPasskey()).rejects.toThrow(
        'No credentials store available'
      );
    });
  });

  describe('isPasskeySupported() static method', () => {
    it('should delegate to PasskeyEncryptionService.isSupported', async () => {
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
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });

      const result = (orchestrator as any).getUnifiedStore();

      expect(result).toBeUndefined();
    });
  });

  describe('Integration tests', () => {
    it('should handle unified store workflow', async () => {
      orchestrator = createOrchestrator({
        enableSessions: true,
        allowPasskeys: true
      });

      // Test authentication info
      const authInfo = await orchestrator.getAuthenticationInfo();
      expect(authInfo.supportsPasskeys).toBe(true);

      // Test unlock
      mockUnifiedStore.unlock.mockResolvedValue(true);
      const unlockResult = await orchestrator.unlock({
        method: 'password',
        password: 'test'
      });
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
      orchestrator = new CredentialOrchestrator({
        enableSessions: false,
        allowPasskeys: false
      });

      // Test authentication info
      const authInfo = await orchestrator.getAuthenticationInfo();
      expect(authInfo.supportsPasskeys).toBe(false);

      // Test unlock
      const unlockResult = await orchestrator.unlock({
        method: 'password',
        password: 'legacy-password'
      });
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
      const config = { credentialStore: customStore as any };
      orchestrator = new CredentialOrchestrator(config);

      expect(orchestrator.credentialStore).toBe(customStore);
      expect(orchestrator.isPaired).toBe(true);
      expect(orchestrator.isUnlocked).toBe(true);
    });
  });
});
