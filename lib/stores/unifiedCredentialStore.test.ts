import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationCoordinator } from './authenticationCoordinator';
import { CredentialCache } from './credentialCache';
import { SessionCoordinator } from './sessionCoordinator';
import { StrategyManager } from './strategyManager';
import UnifiedCredentialStore from './unifiedCredentialStore';

const mockStrategyManager = {
  hasAnyCredentials: false,
  clearAll: vi.fn(),
  supportedMethods: [] as string[]
};

const createMockCredentialCache = () => {
  const storage = new Map<string, any>();
  return {
    get: vi.fn((key: string) => storage.get(key)),
    set: vi.fn((key: string, value: any) => storage.set(key, value)),
    clear: vi.fn(() => storage.clear()),
    _storage: storage
  };
};

let mockCredentialCache = createMockCredentialCache();

const mockSessionCoordinator = {
  canAutoRestore: vi.fn(),
  createSession: vi.fn(),
  clearSession: vi.fn(),
  refreshSession: vi.fn(),
  hasActiveSession: false as boolean,
  getTimeRemaining: vi.fn(),
  getSessionManager: vi.fn()
};

const mockAuthCoordinator = {
  unlock: vi.fn(),
  isUnlocked: false as boolean,
  getAuthenticationInfo: vi.fn(),
  clearSession: vi.fn(),
  tryAutoRestore: vi.fn(),
  createSessionAfterConnection: vi.fn()
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

describe('UnifiedCredentialStore', () => {
  let store: UnifiedCredentialStore;
  const baseConfig = {
    namespace: 'test-namespace',
    allowPasskeys: true,
    enableSessions: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCredentialCache = createMockCredentialCache();

    mockStrategyManager.hasAnyCredentials = false;
    mockStrategyManager.supportedMethods = ['password', 'passkey', 'session'];
    mockStrategyManager.clearAll.mockReturnValue(undefined);

    mockSessionCoordinator.canAutoRestore.mockResolvedValue(false);
    mockSessionCoordinator.createSession.mockResolvedValue(undefined);
    mockSessionCoordinator.clearSession.mockReturnValue(undefined);
    mockSessionCoordinator.refreshSession.mockResolvedValue(false);
    mockSessionCoordinator.hasActiveSession = false;
    mockSessionCoordinator.getTimeRemaining.mockResolvedValue(0);
    mockSessionCoordinator.getSessionManager.mockReturnValue({
      config: { sessionDuration: 60000 }
    });

    mockAuthCoordinator.unlock.mockResolvedValue(false);
    mockAuthCoordinator.isUnlocked = false;
    mockAuthCoordinator.getAuthenticationInfo.mockResolvedValue({
      isUnlocked: false,
      hasStoredCredentials: false,
      hasActiveSession: false,
      sessionTimeRemaining: 0,
      supportsPasskeys: true,
      hasPasskey: false,
      preferredUnlockMethod: 'password'
    });
    mockAuthCoordinator.clearSession.mockReturnValue(undefined);
    mockAuthCoordinator.tryAutoRestore.mockResolvedValue(false);
    mockAuthCoordinator.createSessionAfterConnection.mockResolvedValue(
      undefined
    );

    store = new UnifiedCredentialStore(baseConfig, {
      config: { sessionDuration: 60000 }
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create coordinator components with session manager', () => {
      expect(StrategyManager).toHaveBeenCalledWith(
        baseConfig,
        expect.any(Object)
      );
      expect(CredentialCache).toHaveBeenCalled();
      expect(SessionCoordinator).toHaveBeenCalledWith(expect.any(Object));
      expect(AuthenticationCoordinator).toHaveBeenCalledWith(
        mockStrategyManager,
        mockCredentialCache,
        mockSessionCoordinator
      );
    });

    it('should create coordinators without session manager', () => {
      const configWithoutSessions = {
        ...baseConfig,
        enableSessions: false
      };

      store = new UnifiedCredentialStore(configWithoutSessions);

      expect(StrategyManager).toHaveBeenCalledWith(
        configWithoutSessions,
        undefined
      );
      expect(SessionCoordinator).toHaveBeenCalledWith(undefined);
    });
  });

  describe('CredentialStore interface', () => {
    it('returns undefined for password getter', () => {
      expect(store.password).toBeUndefined();
    });

    it('allows setting password as no-op', () => {
      expect(() => {
        store.password = 'test-password';
      }).not.toThrow();
    });

    it('gets and sets pairingPhrase', () => {
      mockCredentialCache.get.mockReturnValue('test-phrase');
      expect(store.pairingPhrase).toBe('test-phrase');

      store.pairingPhrase = 'new-phrase';
      expect(mockCredentialCache.set).toHaveBeenCalledWith(
        'pairingPhrase',
        'new-phrase'
      );
    });

    it('gets and sets serverHost', () => {
      mockCredentialCache.get.mockReturnValue('test-host');
      expect(store.serverHost).toBe('test-host');

      store.serverHost = 'new-host';
      expect(mockCredentialCache.set).toHaveBeenCalledWith(
        'serverHost',
        'new-host'
      );
    });

    it('gets and sets localKey', () => {
      mockCredentialCache.get.mockReturnValue('local');
      expect(store.localKey).toBe('local');

      store.localKey = 'new-local';
      expect(mockCredentialCache.set).toHaveBeenCalledWith(
        'localKey',
        'new-local'
      );
    });

    it('gets and sets remoteKey', () => {
      mockCredentialCache.get.mockReturnValue('remote');
      expect(store.remoteKey).toBe('remote');

      store.remoteKey = 'new-remote';
      expect(mockCredentialCache.set).toHaveBeenCalledWith(
        'remoteKey',
        'new-remote'
      );
    });

    it('returns empty string when cache has no value', () => {
      mockCredentialCache.get.mockReturnValue(undefined);
      expect(store.remoteKey).toBe('');
      expect(store.localKey).toBe('');
      expect(store.serverHost).toBe('');
      expect(store.pairingPhrase).toBe('');
    });

    it('exposes isPaired from strategy manager', () => {
      mockStrategyManager.hasAnyCredentials = true;
      expect(store.isPaired).toBe(true);

      mockStrategyManager.hasAnyCredentials = false;
      expect(store.isPaired).toBe(false);
    });
  });

  describe('clear()', () => {
    it('clears cache and strategies when memoryOnly is false', () => {
      store.clear(false);

      expect(mockCredentialCache.clear).toHaveBeenCalled();
      expect(mockStrategyManager.clearAll).toHaveBeenCalled();
      expect(mockAuthCoordinator.clearSession).toHaveBeenCalled();
    });

    it('clears cache only when memoryOnly is true', () => {
      store.clear(true);

      expect(mockCredentialCache.clear).toHaveBeenCalled();
      expect(mockStrategyManager.clearAll).not.toHaveBeenCalled();
      expect(mockAuthCoordinator.clearSession).toHaveBeenCalled();
    });

    it('defaults to clearing persisted data when memoryOnly is undefined', () => {
      store.clear();

      expect(mockCredentialCache.clear).toHaveBeenCalled();
      expect(mockStrategyManager.clearAll).toHaveBeenCalled();
      expect(mockAuthCoordinator.clearSession).toHaveBeenCalled();
    });
  });

  describe('Authentication methods', () => {
    it('delegates clearSession to auth coordinator', () => {
      store.clearSession();
      expect(mockAuthCoordinator.clearSession).toHaveBeenCalled();
    });

    it('delegates isUnlocked to auth coordinator', () => {
      mockAuthCoordinator.isUnlocked = true;
      expect(store.isUnlocked).toBe(true);

      mockAuthCoordinator.isUnlocked = false;
      expect(store.isUnlocked).toBe(false);
    });

    it('delegates unlock to auth coordinator', async () => {
      const options = { method: 'password' as const, password: 'test' };
      mockAuthCoordinator.unlock.mockResolvedValue(true);

      const result = await store.unlock(options);

      expect(result).toBe(true);
      expect(mockAuthCoordinator.unlock).toHaveBeenCalledWith(options);
    });

    it('delegates getAuthenticationInfo to auth coordinator', async () => {
      const info = await store.getAuthenticationInfo();

      expect(info).toEqual(
        expect.objectContaining({
          hasActiveSession: false
        })
      );
      expect(mockAuthCoordinator.getAuthenticationInfo).toHaveBeenCalled();
    });

    it('exposes supported unlock methods', () => {
      mockStrategyManager.supportedMethods = ['password', 'session'];
      expect(store.supportedUnlockMethods).toEqual(['password', 'session']);
    });

    it('delegates canAutoRestore to session coordinator', async () => {
      mockSessionCoordinator.canAutoRestore.mockResolvedValue(true);

      const result = await store.canAutoRestore();

      expect(result).toBe(true);
      expect(mockSessionCoordinator.canAutoRestore).toHaveBeenCalled();
    });

    it('delegates tryAutoRestore to auth coordinator', async () => {
      mockAuthCoordinator.tryAutoRestore.mockResolvedValue(true);

      const result = await store.tryAutoRestore();

      expect(result).toBe(true);
      expect(mockAuthCoordinator.tryAutoRestore).toHaveBeenCalled();
    });
  });

  describe('Session management', () => {
    it('does not create a session when not unlocked', async () => {
      mockAuthCoordinator.isUnlocked = false;

      await store.createSession();

      expect(mockSessionCoordinator.createSession).not.toHaveBeenCalled();
    });

    it('creates a session with cached credentials when unlocked', async () => {
      mockAuthCoordinator.isUnlocked = true;
      mockCredentialCache.get.mockImplementation(
        (key: string) => `value-${key}`
      );
      mockSessionCoordinator.getSessionManager.mockReturnValue({
        config: { sessionDuration: 1000 }
      });

      await store.createSession();

      expect(mockSessionCoordinator.createSession).toHaveBeenCalledWith({
        localKey: 'value-localKey',
        remoteKey: 'value-remoteKey',
        pairingPhrase: 'value-pairingPhrase',
        serverHost: 'value-serverHost'
      });
    });

    it('delegates refreshSession to session coordinator', async () => {
      mockSessionCoordinator.refreshSession.mockResolvedValue(true);

      const result = await store.refreshSession();

      expect(result).toBe(true);
      expect(mockSessionCoordinator.refreshSession).toHaveBeenCalled();
    });

    it('delegates hasActiveSession to session coordinator', () => {
      mockSessionCoordinator.hasActiveSession = true;

      expect(store.hasActiveSession).toBe(true);
    });

    it('delegates getSessionTimeRemaining to session coordinator', async () => {
      mockSessionCoordinator.getTimeRemaining.mockResolvedValue(1234);

      const result = await store.getSessionTimeRemaining();

      expect(result).toBe(1234);
      expect(mockSessionCoordinator.getTimeRemaining).toHaveBeenCalled();
    });

    it('delegates createSessionAfterConnection to auth coordinator', async () => {
      await store.createSessionAfterConnection();

      expect(
        mockAuthCoordinator.createSessionAfterConnection
      ).toHaveBeenCalled();
    });
  });
});
