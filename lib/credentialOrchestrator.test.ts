import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CredentialOrchestrator } from './credentialOrchestrator';
import { PasskeyEncryptionService } from './encryption/passkeyEncryptionService';
import SessionManager from './sessions/sessionManager';
import LncCredentialStore from './util/credentialStore';
import { log } from './util/log';

const createMockUnifiedStore = () => {
  const store: any = {
    unlock: vi.fn(),
    _isUnlocked: false,
    get isUnlocked() {
      return store._isUnlocked;
    },
    getAuthenticationInfo: vi.fn(),
    clearSession: vi.fn(),
    clear: vi.fn(),
    canAutoRestore: vi.fn(),
    tryAutoRestore: vi.fn(),
    createSessionAfterConnection: vi.fn(),
    isPaired: false,
    password: undefined,
    pairingPhrase: '',
    serverHost: ''
  };
  return store;
};

const createMockLegacyStore = () => {
  const store: any = {
    isPaired: true,
    serverHost: '',
    pairingPhrase: '',
    localKey: '',
    remoteKey: '',
    clear: vi.fn(function (this: any, memoryOnly?: boolean) {
      if (!memoryOnly) {
        const namespace = this._namespace || 'default';
        const key = `lnc-web:${namespace}`;
        localStorage.removeItem(key);
      }
      this.localKey = '';
      this.remoteKey = '';
      this.pairingPhrase = '';
    })
  };

  Object.defineProperty(store, 'password', {
    get: () => store._password || '',
    set: (password: string) => {
      store._password = password;
      if (password) {
        const namespace = store._namespace || 'default';
        const key = `lnc-web:${namespace}`;
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
      }
    },
    configurable: true
  });

  return store;
};

let mockUnifiedStore = createMockUnifiedStore();
let mockLegacyStore = createMockLegacyStore();

vi.mock('./stores/unifiedCredentialStore', () => {
  const UnifiedCredentialStoreMock = vi
    .fn()
    .mockImplementation((config?: any) => {
      mockUnifiedStore = createMockUnifiedStore();
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
      mockLegacyStore = createMockLegacyStore();
      mockLegacyStore._namespace = namespace || 'default';
      if (password) {
        mockLegacyStore.password = password;
      }
      return mockLegacyStore;
    });
  return { default: LncCredentialStoreMock };
});

vi.mock('./sessions/sessionManager', () => ({
  default: vi.fn().mockImplementation(() => ({
    config: { sessionDurationMs: 24 * 60 * 60 * 1000 }
  }))
}));

vi.mock('./encryption/passkeyEncryptionService', () => ({
  PasskeyEncryptionService: {
    isSupported: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('./util/log', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('CredentialOrchestrator', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('constructor and store creation', () => {
    it('should create legacy store by default', () => {
      const orchestrator = new CredentialOrchestrator({});
      const store = orchestrator.credentialStore;

      expect(store).toBe(mockLegacyStore);
    });

    it('should create unified store when sessions are enabled', () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });

      expect(orchestrator.credentialStore).toBe(mockUnifiedStore);
      expect(SessionManager).toHaveBeenCalledWith('default', undefined);
    });

    it('should create unified store when passkeys are enabled', () => {
      const orchestrator = new CredentialOrchestrator({ allowPasskeys: true });

      expect(orchestrator.credentialStore).toBe(mockUnifiedStore);
    });

    it('should create unified store with custom session config', () => {
      new CredentialOrchestrator({
        enableSessions: true,
        sessionConfig: { sessionDurationMs: 3600000 }
      });

      expect(SessionManager).toHaveBeenCalledWith('default', {
        sessionDurationMs: 3600000
      });
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

    it('should set serverHost from config for legacy store', () => {
      const unpairedStore = createMockLegacyStore();
      unpairedStore.isPaired = false;
      vi.mocked(LncCredentialStore).mockReturnValueOnce(unpairedStore);

      const orchestrator = new CredentialOrchestrator({
        serverHost: 'test.server:443'
      });
      const store = orchestrator.credentialStore as any;

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
      const store = orchestrator.credentialStore as any;

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
    it('delegates to unified store when available', async () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });
      mockUnifiedStore.unlock.mockResolvedValue(true);

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

    it('returns false and logs warning for missing password', async () => {
      const orchestrator = new CredentialOrchestrator({});

      const result = await orchestrator.unlock({
        method: 'password',
        password: ''
      });

      expect(result).toBe(false);
      expect(log.warn).toHaveBeenCalledWith(
        '[CredentialOrchestrator] Legacy unlock failed: missing or empty password for method "password".'
      );
    });
  });

  describe('isUnlocked', () => {
    it('returns unified store unlock state', () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });
      mockUnifiedStore._isUnlocked = true;

      expect(orchestrator.isUnlocked).toBe(true);
    });

    it('returns legacy password state', () => {
      const orchestrator = new CredentialOrchestrator({});
      mockLegacyStore.password = 'test-password';

      expect(orchestrator.isUnlocked).toBe(true);

      mockLegacyStore.password = undefined;
      expect(orchestrator.isUnlocked).toBe(false);
    });
  });

  describe('isPaired', () => {
    it('returns store pairing state', () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });
      mockUnifiedStore.isPaired = true;

      expect(orchestrator.isPaired).toBe(true);
    });
  });

  describe('supportsPasskeys', () => {
    it('returns unified store support status', async () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });
      mockUnifiedStore.getAuthenticationInfo.mockResolvedValue({
        supportsPasskeys: true,
        hasPasskey: false,
        isUnlocked: false,
        hasStoredCredentials: false,
        hasActiveSession: false,
        sessionTimeRemaining: 0,
        preferredUnlockMethod: 'password'
      });

      const result = await orchestrator.supportsPasskeys();

      expect(result).toBe(true);
    });

    it('returns false for legacy store', async () => {
      const orchestrator = new CredentialOrchestrator({});

      const result = await orchestrator.supportsPasskeys();

      expect(result).toBe(false);
    });
  });

  describe('persistWithPassword', () => {
    it('unlocks with password and creates session for unified store', async () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });
      mockUnifiedStore.unlock.mockResolvedValue(true);

      await orchestrator.persistWithPassword('test-password');

      expect(mockUnifiedStore.unlock).toHaveBeenCalledWith({
        method: 'password',
        password: 'test-password'
      });
      expect(mockUnifiedStore.createSessionAfterConnection).toHaveBeenCalled();
    });

    it('throws error when unlock fails for unified store', async () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });
      mockUnifiedStore.unlock.mockResolvedValue(false);

      await expect(
        orchestrator.persistWithPassword('test-password')
      ).rejects.toThrow('Failed to unlock credentials with password');
    });

    it('sets password directly for legacy store', async () => {
      const orchestrator = new CredentialOrchestrator({});

      await orchestrator.persistWithPassword('test-password');

      expect(mockLegacyStore.password).toBe('test-password');
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

    it('throws error when unlock fails for unified store', async () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });
      mockUnifiedStore.unlock.mockResolvedValue(false);

      await expect(orchestrator.persistWithPasskey()).rejects.toThrow(
        'Failed to create/use passkey for credentials'
      );
    });

    it('throws error for legacy store', async () => {
      const orchestrator = new CredentialOrchestrator({});

      await expect(orchestrator.persistWithPasskey()).rejects.toThrow(
        'Passkey authentication requires the new credential store (enable sessions or passkeys)'
      );
    });

    it('throws error when no credential store exists', async () => {
      const orchestrator = new CredentialOrchestrator({ enableSessions: true });
      (orchestrator as any).currentCredentialStore = undefined;

      await expect(orchestrator.persistWithPasskey()).rejects.toThrow(
        'No credentials store available'
      );
    });
  });

  describe('isPasskeySupported', () => {
    it('delegates to PasskeyEncryptionService', async () => {
      const result = await CredentialOrchestrator.isPasskeySupported();

      expect(result).toBe(true);
      expect(PasskeyEncryptionService.isSupported).toHaveBeenCalled();
    });
  });
});
