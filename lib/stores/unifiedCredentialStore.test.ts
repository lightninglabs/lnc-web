import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationCoordinator } from './authenticationCoordinator';
import { CredentialCache } from './credentialCache';
import { SessionCoordinator } from './sessionCoordinator';
import { StrategyManager } from './strategyManager';
import UnifiedCredentialStore from './unifiedCredentialStore';

const mockStrategyManager = {
  hasAnyCredentials: false,
  clearAll: vi.fn(),
  getSupportedMethods: vi.fn(),
  supportedMethods: [] as string[],
  getPreferredMethod: vi.fn(),
  getStrategy: vi.fn()
};

const createMockCredentialCache = () => {
  const storage = new Map<string, any>();
  return {
    get: vi.fn((key: string) => storage.get(key) || null),
    set: vi.fn((key: string, value: any) => storage.set(key, value)),
    clear: vi.fn(() => storage.clear()),
    _storage: storage // For testing purposes
  };
};

let mockCredentialCache = createMockCredentialCache();

const mockSessionCoordinator = {
  canAutoRestore: vi.fn(),
  createSession: vi.fn(),
  clearSession: vi.fn(),
  refreshSession: vi.fn(),
  _hasActiveSession: false,
  get hasActiveSession() {
    return mockSessionCoordinator._hasActiveSession;
  },
  getTimeRemaining: vi.fn(),
  getSessionManager: vi.fn()
};

const mockAuthCoordinator = {
  unlock: vi.fn(),
  _isUnlocked: false,
  get isUnlocked() {
    return mockAuthCoordinator._isUnlocked;
  },
  getAuthenticationInfo: vi.fn(),
  clearSession: vi.fn(),
  tryAutoRestore: vi.fn(),
  createSessionAfterConnection: vi.fn()
};

const mockSessionManager = {
  config: { sessionDuration: 24 * 60 * 60 * 1000 }
};

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
  AuthenticationCoordinator: vi
    .fn()
    .mockImplementation(() => mockAuthCoordinator),
  DEFAULT_SESSION_DURATION: 60000
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
    mockCredentialCache = createMockCredentialCache();

    mockStrategyManager.hasAnyCredentials = false;
    mockStrategyManager.clearAll.mockReturnValue(undefined);
    mockStrategyManager.supportedMethods = ['password', 'passkey', 'session'];

    mockSessionCoordinator.canAutoRestore.mockResolvedValue(false);
    mockSessionCoordinator.createSession.mockResolvedValue(undefined);
    mockSessionCoordinator.clearSession.mockReturnValue(undefined);
    mockSessionCoordinator.refreshSession.mockResolvedValue(false);
    mockSessionCoordinator._hasActiveSession = false;
    mockSessionCoordinator.getTimeRemaining.mockResolvedValue(0);
    mockSessionCoordinator.getSessionManager.mockReturnValue(
      mockSessionManager
    );

    mockAuthCoordinator.unlock.mockResolvedValue(false);
    mockAuthCoordinator._isUnlocked = false;
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
    mockAuthCoordinator.createSessionAfterConnection.mockResolvedValue(
      undefined
    );

    unifiedStore = new UnifiedCredentialStore(
      baseConfig,
      mockSessionManager as any
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create all coordinator components', () => {
      expect(StrategyManager).toHaveBeenCalledWith(
        baseConfig,
        mockSessionManager
      );
      expect(CredentialCache).toHaveBeenCalled();
      expect(SessionCoordinator).toHaveBeenCalledWith(mockSessionManager);
      expect(AuthenticationCoordinator).toHaveBeenCalledWith(
        mockStrategyManager,
        mockCredentialCache,
        mockSessionCoordinator
      );
    });

    it('should create without session manager when not provided', () => {
      const configWithoutSessions = {
        ...baseConfig,
        enableSessions: false
      };
      unifiedStore = new UnifiedCredentialStore(configWithoutSessions);

      expect(StrategyManager).toHaveBeenCalledWith(
        configWithoutSessions,
        undefined
      );
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

        expect(mockCredentialCache.set).toHaveBeenCalledWith(
          'pairingPhrase',
          'new-phrase'
        );
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

        expect(mockCredentialCache.set).toHaveBeenCalledWith(
          'serverHost',
          'new-host:443'
        );
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

        expect(mockCredentialCache.set).toHaveBeenCalledWith(
          'localKey',
          'new-local-key'
        );
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

        expect(mockCredentialCache.set).toHaveBeenCalledWith(
          'remoteKey',
          'new-remote-key'
        );
      });
    });

    describe('isPaired', () => {
      it('should return strategy manager hasAnyCredentials result', () => {
        mockStrategyManager.hasAnyCredentials = true;

        expect(unifiedStore.isPaired).toBe(true);

        mockStrategyManager.hasAnyCredentials = false;

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

    describe('isUnlocked', () => {
      it('should delegate to auth coordinator', () => {
        mockAuthCoordinator._isUnlocked = true;

        expect(unifiedStore.isUnlocked).toBe(true);

        mockAuthCoordinator._isUnlocked = false;

        expect(unifiedStore.isUnlocked).toBe(false);
      });
    });

    describe('unlock()', () => {
      it('should delegate to auth coordinator', async () => {
        const options = {
          method: 'password' as const,
          password: 'test'
        };
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

    describe('supportedUnlockMethods', () => {
      it('should delegate to strategy manager', () => {
        const methods = ['password', 'passkey', 'session'];
        mockStrategyManager.supportedMethods = methods;

        const result = unifiedStore.supportedUnlockMethods;

        expect(result).toBe(methods);
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
        mockAuthCoordinator._isUnlocked = false;

        await unifiedStore.createSession();

        expect(mockSessionCoordinator.createSession).not.toHaveBeenCalled();
      });

      it('should create session with current credentials when unlocked', async () => {
        mockAuthCoordinator._isUnlocked = true;
        mockCredentialCache.get.mockImplementation((key) => `value-${key}`);

        await unifiedStore.createSession();

        expect(mockSessionCoordinator.createSession).toHaveBeenCalledWith({
          localKey: 'value-localKey',
          remoteKey: 'value-remoteKey',
          pairingPhrase: 'value-pairingPhrase',
          serverHost: 'value-serverHost'
        });
      });

      it('should use default session TTL when session manager is unavailable', async () => {
        mockAuthCoordinator._isUnlocked = true;
        mockCredentialCache.get.mockImplementation((key) => `value-${key}`);
        mockSessionCoordinator.getSessionManager.mockReturnValueOnce(undefined);

        await unifiedStore.createSession();

        expect(mockSessionCoordinator.createSession).toHaveBeenCalledWith({
          localKey: 'value-localKey',
          remoteKey: 'value-remoteKey',
          pairingPhrase: 'value-pairingPhrase',
          serverHost: 'value-serverHost'
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

    describe('hasActiveSession', () => {
      it('should delegate to session coordinator', () => {
        mockSessionCoordinator._hasActiveSession = true;

        expect(unifiedStore.hasActiveSession).toBe(true);
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

        expect(
          mockAuthCoordinator.createSessionAfterConnection
        ).toHaveBeenCalled();
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
      mockAuthCoordinator._isUnlocked = true;

      const unlockResult = await unifiedStore.unlock({
        method: 'password',
        password: 'test'
      });
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
      mockSessionCoordinator._hasActiveSession = true;
      mockSessionCoordinator.getTimeRemaining.mockResolvedValue(3600000);

      expect(unifiedStore.hasActiveSession).toBe(true);
      expect(await unifiedStore.getSessionTimeRemaining()).toBe(3600000);

      // Refresh session
      mockSessionCoordinator.refreshSession.mockResolvedValue(true);
      const refreshResult = await unifiedStore.refreshSession();
      expect(refreshResult).toBe(true);
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
