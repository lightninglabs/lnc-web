import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '../util/log';
import { CredentialCache } from './credentialCache';
import { StrategyManager } from './strategyManager';
import UnifiedCredentialStore from './unifiedCredentialStore';

// Mock dependencies
const mockStrategyManager = {
  supportedMethods: ['password'],
  hasAnyCredentials: false,
  preferredMethod: 'password',
  supportedUnlockMethods: ['password'],
  getStrategy: vi.fn(),
  clearAll: vi.fn()
};

// Create a mock credential cache that actually stores values
const createMockCredentialCache = () => {
  const storage = new Map<string, string>();
  return {
    get: vi.fn((key: string) => storage.get(key)),
    set: vi.fn((key: string, value: string) => storage.set(key, value)),
    clear: vi.fn(() => storage.clear()),
    _storage: storage
  };
};

let mockCredentialCache = createMockCredentialCache();

// Mock strategies
const mockPasswordStrategy = {
  method: 'password',
  isSupported: true,
  isUnlocked: false,
  unlock: vi.fn(),
  getCredential: vi.fn(),
  setCredential: vi.fn(),
  hasAnyCredentials: false,
  hasStoredAuthData: vi.fn(),
  clear: vi.fn()
};

const mockPasskeyStrategy = {
  method: 'passkey',
  isSupported: true,
  isUnlocked: false,
  unlock: vi.fn(),
  getCredential: vi.fn(),
  setCredential: vi.fn(),
  hasAnyCredentials: false,
  hasStoredAuthData: vi.fn(),
  clear: vi.fn()
};

// Mock constructors
vi.mock('./strategyManager', () => ({
  StrategyManager: vi.fn().mockImplementation(() => mockStrategyManager)
}));

vi.mock('./credentialCache', () => ({
  CredentialCache: vi.fn().mockImplementation(() => mockCredentialCache)
}));

// Mock log
vi.spyOn(log, 'info').mockImplementation(() => {});
vi.spyOn(log, 'warn').mockImplementation(() => {});
vi.spyOn(log, 'error').mockImplementation(() => {});

describe('UnifiedCredentialStore', () => {
  let store: UnifiedCredentialStore;
  const baseConfig = {
    namespace: 'test-namespace'
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Recreate credential cache to ensure clean state
    mockCredentialCache = createMockCredentialCache();

    // Reset mock defaults
    mockStrategyManager.hasAnyCredentials = false;
    mockStrategyManager.preferredMethod = 'password';
    mockStrategyManager.clearAll.mockReturnValue(undefined);
    mockStrategyManager.supportedUnlockMethods = ['password'];
    mockStrategyManager.getStrategy.mockImplementation((method: string) => {
      if (method === 'passkey') return mockPasskeyStrategy;
      if (method === 'password') return mockPasswordStrategy;
      return undefined;
    });

    mockPasswordStrategy.isSupported = true;
    mockPasswordStrategy.isUnlocked = false;
    mockPasswordStrategy.unlock.mockResolvedValue(true);
    mockPasswordStrategy.getCredential.mockResolvedValue(undefined);
    mockPasswordStrategy.setCredential.mockResolvedValue(undefined);
    mockPasswordStrategy.hasAnyCredentials = false;
    mockPasswordStrategy.hasStoredAuthData.mockReturnValue(false);

    mockPasskeyStrategy.isSupported = true;
    mockPasskeyStrategy.isUnlocked = false;
    mockPasskeyStrategy.unlock.mockResolvedValue(true);
    mockPasskeyStrategy.getCredential.mockResolvedValue(undefined);
    mockPasskeyStrategy.setCredential.mockResolvedValue(undefined);
    mockPasskeyStrategy.hasAnyCredentials = false;
    mockPasskeyStrategy.hasStoredAuthData.mockReturnValue(false);

    store = new UnifiedCredentialStore(baseConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create strategy manager and credential cache', () => {
      expect(StrategyManager).toHaveBeenCalledWith(baseConfig);
      expect(CredentialCache).toHaveBeenCalled();
    });

    it('should log initialization', () => {
      expect(log.info).toHaveBeenCalledWith(
        '[UnifiedCredentialStore] Initialized with strategy manager'
      );
    });
  });

  describe('CredentialStore interface - getters/setters', () => {
    describe('password', () => {
      it('should return undefined (password not stored)', () => {
        expect(store.password).toBeUndefined();
      });

      it('should allow setting password (no-op)', () => {
        expect(() => {
          store.password = 'test-password';
        }).not.toThrow();
        expect(store.password).toBeUndefined();
      });
    });

    describe('pairingPhrase', () => {
      it('should return cached value', () => {
        mockCredentialCache._storage.set('pairingPhrase', 'test-phrase');

        expect(store.pairingPhrase).toBe('test-phrase');
        expect(mockCredentialCache.get).toHaveBeenCalledWith('pairingPhrase');
      });

      it('should return empty string when no cached value', () => {
        expect(store.pairingPhrase).toBe('');
      });

      it('should set cached value', () => {
        store.pairingPhrase = 'new-phrase';

        expect(mockCredentialCache.set).toHaveBeenCalledWith(
          'pairingPhrase',
          'new-phrase'
        );
      });
    });

    describe('serverHost', () => {
      it('should return cached value', () => {
        mockCredentialCache._storage.set('serverHost', 'test-host:443');

        expect(store.serverHost).toBe('test-host:443');
        expect(mockCredentialCache.get).toHaveBeenCalledWith('serverHost');
      });

      it('should return empty string when no cached value', () => {
        expect(store.serverHost).toBe('');
      });

      it('should set cached value', () => {
        store.serverHost = 'new-host:443';

        expect(mockCredentialCache.set).toHaveBeenCalledWith(
          'serverHost',
          'new-host:443'
        );
      });
    });

    describe('localKey', () => {
      it('should return cached value', () => {
        mockCredentialCache._storage.set('localKey', 'test-local-key');

        expect(store.localKey).toBe('test-local-key');
        expect(mockCredentialCache.get).toHaveBeenCalledWith('localKey');
      });

      it('should return empty string when no cached value', () => {
        expect(store.localKey).toBe('');
      });

      it('should set cached value', () => {
        store.localKey = 'new-local-key';

        expect(mockCredentialCache.set).toHaveBeenCalledWith(
          'localKey',
          'new-local-key'
        );
      });
    });

    describe('remoteKey', () => {
      it('should return cached value', () => {
        mockCredentialCache._storage.set('remoteKey', 'test-remote-key');

        expect(store.remoteKey).toBe('test-remote-key');
        expect(mockCredentialCache.get).toHaveBeenCalledWith('remoteKey');
      });

      it('should return empty string when no cached value', () => {
        expect(store.remoteKey).toBe('');
      });

      it('should set cached value', () => {
        store.remoteKey = 'new-remote-key';

        expect(mockCredentialCache.set).toHaveBeenCalledWith(
          'remoteKey',
          'new-remote-key'
        );
      });
    });

    describe('isPaired', () => {
      it('should return strategy manager hasAnyCredentials result', () => {
        mockStrategyManager.hasAnyCredentials = true;
        expect(store.isPaired).toBe(true);

        mockStrategyManager.hasAnyCredentials = false;
        expect(store.isPaired).toBe(false);
      });
    });
  });

  describe('clear()', () => {
    it('should clear cache and strategies when memoryOnly is false', () => {
      store.clear(false);

      expect(mockCredentialCache.clear).toHaveBeenCalled();
      expect(mockStrategyManager.clearAll).toHaveBeenCalled();
    });

    it('should clear cache only when memoryOnly is true', () => {
      store.clear(true);

      expect(mockCredentialCache.clear).toHaveBeenCalled();
      expect(mockStrategyManager.clearAll).not.toHaveBeenCalled();
    });

    it('should clear cache and strategies when memoryOnly is undefined', () => {
      store.clear();

      expect(mockCredentialCache.clear).toHaveBeenCalled();
      expect(mockStrategyManager.clearAll).toHaveBeenCalled();
    });

    it('should reset unlock state', async () => {
      // First unlock
      await store.unlock({ method: 'password', password: 'test' });
      expect(store.isUnlocked).toBe(true);

      // Then clear
      store.clear();
      expect(store.isUnlocked).toBe(false);
    });
  });

  describe('isUnlocked()', () => {
    it('should return false initially', () => {
      expect(store.isUnlocked).toBe(false);
    });

    it('should return true after successful unlock', async () => {
      mockPasswordStrategy.unlock.mockResolvedValue(true);

      await store.unlock({ method: 'password', password: 'test' });

      expect(store.isUnlocked).toBe(true);
    });

    it('should return false after failed unlock', async () => {
      mockPasswordStrategy.unlock.mockResolvedValue(false);

      await store.unlock({ method: 'password', password: 'wrong' });

      expect(store.isUnlocked).toBe(false);
    });
  });

  describe('unlock()', () => {
    it('should unlock with password method', async () => {
      mockPasswordStrategy.unlock.mockResolvedValue(true);

      const result = await store.unlock({
        method: 'password',
        password: 'test-password'
      });

      expect(result).toBe(true);
      expect(mockStrategyManager.getStrategy).toHaveBeenCalledWith('password');
      expect(mockPasswordStrategy.unlock).toHaveBeenCalledWith({
        method: 'password',
        password: 'test-password'
      });
    });

    it('should return false for unknown method', async () => {
      mockStrategyManager.getStrategy.mockReturnValue(undefined);

      // Cast to any since 'unknown' is not a valid UnlockMethod
      const result = await store.unlock({
        method: 'unknown' as any,
        password: 'test'
      });

      expect(result).toBe(false);
      expect(log.error).toHaveBeenCalledWith(
        '[UnifiedCredentialStore] Unknown unlock method: unknown'
      );
    });

    it('should return false when method not supported', async () => {
      mockPasswordStrategy.isSupported = false;

      const result = await store.unlock({
        method: 'password',
        password: 'test'
      });

      expect(result).toBe(false);
      expect(log.error).toHaveBeenCalledWith(
        '[UnifiedCredentialStore] Unlock method not supported: password'
      );
    });

    it('should return false when unlock fails', async () => {
      mockPasswordStrategy.unlock.mockResolvedValue(false);

      const result = await store.unlock({
        method: 'password',
        password: 'wrong'
      });

      expect(result).toBe(false);
      expect(store.isUnlocked).toBe(false);
    });

    it('should handle unlock error', async () => {
      const error = new Error('Unlock failed');
      mockPasswordStrategy.unlock.mockRejectedValue(error);

      const result = await store.unlock({
        method: 'password',
        password: 'test'
      });

      expect(result).toBe(false);
      expect(log.error).toHaveBeenCalledWith(
        '[UnifiedCredentialStore] Unlock failed:',
        error
      );
    });

    it('should load credentials to cache after successful unlock', async () => {
      mockPasswordStrategy.unlock.mockResolvedValue(true);
      mockPasswordStrategy.getCredential.mockImplementation((key: string) => {
        const values: Record<string, string> = {
          localKey: 'loaded-local',
          remoteKey: 'loaded-remote',
          pairingPhrase: 'loaded-phrase',
          serverHost: 'loaded-host'
        };
        return Promise.resolve(values[key]);
      });

      await store.unlock({ method: 'password', password: 'test' });

      expect(mockPasswordStrategy.getCredential).toHaveBeenCalledWith(
        'localKey'
      );
      expect(mockPasswordStrategy.getCredential).toHaveBeenCalledWith(
        'remoteKey'
      );
      expect(mockPasswordStrategy.getCredential).toHaveBeenCalledWith(
        'pairingPhrase'
      );
      expect(mockPasswordStrategy.getCredential).toHaveBeenCalledWith(
        'serverHost'
      );
    });
  });

  describe('getAuthenticationInfo()', () => {
    it('should return authentication info', async () => {
      mockStrategyManager.hasAnyCredentials = true;
      mockStrategyManager.preferredMethod = 'password';

      const info = await store.getAuthenticationInfo();

      expect(info).toEqual({
        isUnlocked: false,
        hasStoredCredentials: true,
        supportsPasskeys: true,
        hasPasskey: false,
        preferredUnlockMethod: 'password'
      });
    });

    it('should default supportsPasskeys/hasPasskey to false when passkey strategy is missing', async () => {
      mockStrategyManager.hasAnyCredentials = false;
      mockStrategyManager.preferredMethod = 'password';

      mockStrategyManager.getStrategy.mockImplementation((method: string) => {
        if (method === 'passkey') return undefined;
        if (method === 'password') return mockPasswordStrategy;
        return undefined;
      });

      const info = await store.getAuthenticationInfo();

      expect(info.supportsPasskeys).toBe(false);
      expect(info.hasPasskey).toBe(false);
      expect(info.preferredUnlockMethod).toBe('password');
    });

    it('should reflect unlocked state', async () => {
      mockPasswordStrategy.unlock.mockResolvedValue(true);
      await store.unlock({ method: 'password', password: 'test' });

      const info = await store.getAuthenticationInfo();

      expect(info.isUnlocked).toBe(true);
    });
  });

  describe('supportedUnlockMethods', () => {
    it('should return supported methods from strategy manager', () => {
      mockStrategyManager.supportedUnlockMethods = ['password'];

      expect(store.supportedUnlockMethods).toEqual(['password']);
    });
  });

  describe('persistCredentials()', () => {
    it('should persist credentials when unlocked', async () => {
      // Setup - unlock first
      mockPasswordStrategy.unlock.mockResolvedValue(true);
      await store.unlock({ method: 'password', password: 'test' });

      // Set some credentials
      mockCredentialCache._storage.set('localKey', 'test-local');
      mockCredentialCache._storage.set('remoteKey', 'test-remote');
      mockCredentialCache._storage.set('pairingPhrase', 'test-phrase');
      mockCredentialCache._storage.set('serverHost', 'test-host');

      // Persist
      await store.persistCredentials();

      expect(mockPasswordStrategy.setCredential).toHaveBeenCalledWith(
        'localKey',
        'test-local'
      );
      expect(mockPasswordStrategy.setCredential).toHaveBeenCalledWith(
        'remoteKey',
        'test-remote'
      );
      expect(mockPasswordStrategy.setCredential).toHaveBeenCalledWith(
        'pairingPhrase',
        'test-phrase'
      );
      expect(mockPasswordStrategy.setCredential).toHaveBeenCalledWith(
        'serverHost',
        'test-host'
      );
    });

    it('should warn and return when not unlocked', async () => {
      await store.persistCredentials();

      expect(log.warn).toHaveBeenCalledWith(
        '[UnifiedCredentialStore] Cannot persist credentials - not unlocked'
      );
      expect(mockPasswordStrategy.setCredential).not.toHaveBeenCalled();
    });

    it('should handle missing strategy', async () => {
      // Unlock first
      mockPasswordStrategy.unlock.mockResolvedValue(true);
      await store.unlock({ method: 'password', password: 'test' });

      // Make strategy unavailable
      mockStrategyManager.getStrategy.mockReturnValue(undefined);

      await store.persistCredentials();

      expect(log.error).toHaveBeenCalledWith(
        '[UnifiedCredentialStore] Active strategy not found'
      );
    });

    it('should propagate errors from setCredential', async () => {
      // Unlock first
      mockPasswordStrategy.unlock.mockResolvedValue(true);
      await store.unlock({ method: 'password', password: 'test' });

      mockCredentialCache._storage.set('localKey', 'test-local');

      const error = new Error('Set credential failed');
      mockPasswordStrategy.setCredential.mockRejectedValue(error);

      await expect(store.persistCredentials()).rejects.toThrow(
        'Set credential failed'
      );
      expect(log.error).toHaveBeenCalledWith(
        '[UnifiedCredentialStore] Failed to persist credentials:',
        error
      );
    });

    it('should skip credentials that are not in cache', async () => {
      // Unlock first
      mockPasswordStrategy.unlock.mockResolvedValue(true);
      await store.unlock({ method: 'password', password: 'test' });

      // Only set some credentials
      mockCredentialCache._storage.set('localKey', 'test-local');
      // remoteKey, pairingPhrase, serverHost are not set

      await store.persistCredentials();

      expect(mockPasswordStrategy.setCredential).toHaveBeenCalledWith(
        'localKey',
        'test-local'
      );
      expect(mockPasswordStrategy.setCredential).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration tests', () => {
    it('should support full authentication workflow', async () => {
      // Initially not unlocked
      expect(store.isUnlocked).toBe(false);
      const info1 = await store.getAuthenticationInfo();
      expect(info1.isUnlocked).toBe(false);

      // Set credentials before unlock
      store.pairingPhrase = 'test-phrase';
      store.serverHost = 'test-host:443';

      // Unlock
      mockPasswordStrategy.unlock.mockResolvedValue(true);
      const unlockResult = await store.unlock({
        method: 'password',
        password: 'test-password'
      });
      expect(unlockResult).toBe(true);
      expect(store.isUnlocked).toBe(true);

      // Check auth info after unlock
      const info2 = await store.getAuthenticationInfo();
      expect(info2.isUnlocked).toBe(true);

      // Set keys received during connection
      store.localKey = 'new-local-key';
      store.remoteKey = 'new-remote-key';

      // Persist credentials
      await store.persistCredentials();
      expect(mockPasswordStrategy.setCredential).toHaveBeenCalled();

      // Clear
      store.clear();
      expect(store.isUnlocked).toBe(false);
    });
  });
});
