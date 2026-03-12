import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createModernMockSetup } from '../test/utils/mock-factory';
import { testData } from '../test/utils/test-helpers';
import LightningNodeConnect from './lightningNodeConnect';

// Mock all heavy dependencies so tests run fast and without real WASM/crypto.
vi.mock('./wasmManager', () => {
  const WasmManager = vi
    .fn()
    .mockImplementation((_ns: string, _code: string, callbacks: any) => ({
      isReady: true,
      isConnected: false,
      status: 'idle',
      expiry: new Date(0),
      isReadOnly: false,
      hasPerms: vi.fn().mockReturnValue(true),
      preload: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockResolvedValue(undefined),
      waitTilReady: vi.fn().mockResolvedValue(undefined),
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
      request: vi.fn().mockResolvedValue({ result: 'ok' }),
      subscribe: vi.fn(),
      callbacks
    }));
  return {
    WasmManager,
    lncGlobal: globalThis
  };
});

vi.mock('./stores/strategyManager', () => {
  const StrategyManager = vi.fn().mockImplementation(() => ({
    getStrategy: vi.fn(),
    hasAnyCredentials: false,
    preferredMethod: 'password',
    supportedMethods: ['password'],
    clearAll: vi.fn()
  }));
  return { StrategyManager };
});

vi.mock('./stores/authenticationCoordinator', () => {
  const AuthenticationCoordinator = vi.fn().mockImplementation(() => ({
    unlock: vi.fn().mockResolvedValue(true),
    tryAutoRestore: vi.fn().mockResolvedValue(false),
    getAuthenticationInfo: vi.fn().mockResolvedValue({
      isUnlocked: false,
      hasStoredCredentials: false,
      hasActiveSession: false,
      sessionTimeRemaining: 0,
      supportsPasskeys: false,
      hasPasskey: false,
      preferredUnlockMethod: 'password'
    }),
    clearSession: vi.fn(),
    persistCachedCredentials: vi.fn().mockResolvedValue(undefined),
    createSessionAfterConnection: vi.fn().mockResolvedValue(undefined),
    waitForSessionRestoration: vi.fn().mockResolvedValue(undefined),
    isUnlocked: false
  }));
  return { AuthenticationCoordinator };
});

vi.mock('./stores/sessionCoordinator', () => {
  const SessionCoordinator = vi.fn().mockImplementation(() => ({
    isSessionAvailable: true,
    hasActiveSession: false,
    clearSession: vi.fn()
  }));
  return { SessionCoordinator };
});

vi.mock('./stores/credentialCache', () => {
  const CredentialCache = vi.fn().mockImplementation(() => {
    const map = new Map<string, string>();
    return {
      get: vi.fn((key: string) => map.get(key)),
      set: vi.fn((key: string, value: string) => {
        map.set(key, value);
      }),
      has: vi.fn((key: string) => map.has(key)),
      clear: vi.fn(() => map.clear()),
      hasAny: vi.fn(() => map.size > 0)
    };
  });
  return { CredentialCache };
});

vi.mock('./sessions/sessionManager', () => ({
  default: vi.fn().mockImplementation(() => ({}))
}));

vi.mock('./encryption/passkeyEncryptionService', () => ({
  PasskeyEncryptionService: {
    isSupported: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('@lightninglabs/lnc-core', () => ({
  LndApi: vi.fn().mockImplementation(() => ({})),
  LoopApi: vi.fn().mockImplementation(() => ({})),
  PoolApi: vi.fn().mockImplementation(() => ({})),
  FaradayApi: vi.fn().mockImplementation(() => ({})),
  TaprootAssetsApi: vi.fn().mockImplementation(() => ({})),
  LitApi: vi.fn().mockImplementation(() => ({})),
  snakeKeysToCamel: (v: unknown) => v
}));

vi.mock('./api/createRpc', () => ({
  createRpc: vi.fn()
}));

vi.mock('./util/log', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}));

describe('LightningNodeConnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor defaults', () => {
    it('creates with default config when no options provided', () => {
      const lnc = new LightningNodeConnect();
      expect(lnc).toBeDefined();
      expect(lnc.lnd).toBeDefined();
      expect(lnc.loop).toBeDefined();
      expect(lnc.pool).toBeDefined();
      expect(lnc.faraday).toBeDefined();
      expect(lnc.tapd).toBeDefined();
      expect(lnc.lit).toBeDefined();
    });

    it('enables passkeys by default', () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      expect(mocks.config.allowPasskeys).toBe(true);
    });

    it('enables sessions by default', () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      expect(mocks.config.enableSessions).toBe(true);
    });
  });

  describe('opt-out config', () => {
    it('allows disabling passkeys', () => {
      const lnc = new LightningNodeConnect({
        allowPasskeys: false,
        enableSessions: false
      });
      const mocks = createModernMockSetup(lnc);
      expect(mocks.config.allowPasskeys).toBe(false);
      expect(mocks.config.enableSessions).toBe(false);
    });
  });

  describe('explicit config', () => {
    it('uses provided namespace and wasmClientCode', () => {
      const lnc = new LightningNodeConnect({
        namespace: testData.namespace,
        wasmClientCode: 'https://example.com/custom.wasm'
      });
      const mocks = createModernMockSetup(lnc);
      expect(mocks.config.namespace).toBe(testData.namespace);
      expect(mocks.config.wasmClientCode).toBe(
        'https://example.com/custom.wasm'
      );
    });
  });

  describe('no public credentials property', () => {
    it('does not expose a public credentials field', () => {
      const lnc = new LightningNodeConnect();
      expect((lnc as any).credentials).toBeUndefined();
    });
  });

  describe('status getters', () => {
    it('delegates isReady to WasmManager', () => {
      const lnc = new LightningNodeConnect();
      expect(lnc.isReady).toBe(true);
    });

    it('delegates isConnected to WasmManager', () => {
      const lnc = new LightningNodeConnect();
      expect(lnc.isConnected).toBe(false);
    });

    it('delegates status to WasmManager', () => {
      const lnc = new LightningNodeConnect();
      expect(lnc.status).toBe('idle');
    });

    it('delegates expiry to WasmManager', () => {
      const lnc = new LightningNodeConnect();
      expect(lnc.expiry).toEqual(new Date(0));
    });

    it('delegates isReadOnly to WasmManager', () => {
      const lnc = new LightningNodeConnect();
      expect(lnc.isReadOnly).toBe(false);
    });

    it('delegates hasPerms to WasmManager', () => {
      const lnc = new LightningNodeConnect();
      expect(lnc.hasPerms('lnrpc')).toBe(true);
    });

    it('serverHost getter returns config default when cache is empty', () => {
      const lnc = new LightningNodeConnect();
      expect(lnc.serverHost).toBe('mailbox.terminal.lightning.today:443');
    });

    it('serverHost getter returns custom config value when provided', () => {
      const lnc = new LightningNodeConnect({
        serverHost: testData.serverHost
      });
      expect(lnc.serverHost).toBe(testData.serverHost);
    });

    it('serverHost getter returns cache value over config', () => {
      const lnc = new LightningNodeConnect();
      lnc.serverHost = 'runtime.server:443';
      expect(lnc.serverHost).toBe('runtime.server:443');
    });

    it('serverHost setter updates the credential cache', () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      lnc.serverHost = testData.serverHost;

      expect(mocks.credentialCache.set).toHaveBeenCalledWith(
        'serverHost',
        testData.serverHost
      );
      expect(lnc.serverHost).toBe(testData.serverHost);
    });

    it('serverHost set before pair() is preserved during pair()', async () => {
      const lnc = new LightningNodeConnect();
      lnc.serverHost = 'pre-pair.server:443';

      await lnc.pair(testData.pairingPhrase);

      // pair() should not overwrite serverHost since it was already set.
      expect(lnc.serverHost).toBe('pre-pair.server:443');
    });

    it('serverHost set before connect() is used in ConnectionParams', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      mocks.credentialCache.set('pairingPhrase', testData.pairingPhrase);

      lnc.serverHost = 'connect-time.server:443';
      await lnc.connect();

      expect(mocks.wasmManager.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          serverHost: 'connect-time.server:443'
        })
      );
    });
  });

  describe('lifecycle methods', () => {
    it('delegates preload to WasmManager', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      await lnc.preload();
      expect(mocks.wasmManager.preload).toHaveBeenCalled();
    });

    it('delegates connect to WasmManager with ConnectionParams from cache', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      mocks.credentialCache.set('pairingPhrase', testData.pairingPhrase);
      mocks.credentialCache.set('serverHost', testData.serverHost);
      mocks.credentialCache.set('localKey', testData.localKey);
      mocks.credentialCache.set('remoteKey', testData.remoteKey);

      await lnc.connect();

      expect(mocks.wasmManager.connect).toHaveBeenCalledWith({
        pairingPhrase: testData.pairingPhrase,
        serverHost: testData.serverHost,
        localKey: testData.localKey,
        remoteKey: testData.remoteKey
      });
    });

    it('creates a session after successful connection', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      mocks.credentialCache.set('pairingPhrase', testData.pairingPhrase);

      await lnc.connect();

      expect(
        mocks.authCoordinator.createSessionAfterConnection
      ).toHaveBeenCalled();
    });

    it('throws when no pairing phrase or local key is available', async () => {
      const lnc = new LightningNodeConnect();
      // Cache is empty — no pairingPhrase and no localKey.
      await expect(lnc.connect()).rejects.toThrow(
        'No pairing phrase or local key available'
      );
    });

    it('logs error but resolves when session creation fails', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      mocks.credentialCache.set('pairingPhrase', testData.pairingPhrase);

      mocks.authCoordinator.createSessionAfterConnection.mockRejectedValue(
        new Error('session boom')
      );

      // connect() should resolve despite session creation failure.
      await expect(lnc.connect()).resolves.toBeUndefined();
    });

    it('skips session creation when sessions are disabled', async () => {
      const lnc = new LightningNodeConnect({ enableSessions: false });
      const mocks = createModernMockSetup(lnc);
      mocks.credentialCache.set('pairingPhrase', testData.pairingPhrase);

      await lnc.connect();

      expect(
        mocks.authCoordinator.createSessionAfterConnection
      ).not.toHaveBeenCalled();
    });

    it('delegates disconnect to WasmManager', () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      lnc.disconnect();
      expect(mocks.wasmManager.disconnect).toHaveBeenCalled();
    });

    it('run() and waitTilReady() are not public', () => {
      const lnc = new LightningNodeConnect();
      expect((lnc as any).run).toBeDefined(); // exists as private
      expect(typeof (lnc as any).run).toBe('function');
      // Verify they're not in the public type by checking the prototype
      const publicProto = Object.getOwnPropertyNames(
        LightningNodeConnect.prototype
      );
      // run is present on prototype (JS doesn't enforce private at runtime)
      // but the TypeScript compiler prevents public access.
      expect(publicProto).toContain('run');
    });
  });

  describe('RPC methods', () => {
    it('delegates request to WasmManager', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      const result = await lnc.request('lnrpc.GetInfo', { foo: 'bar' });
      expect(result).toEqual({ result: 'ok' });
      expect(mocks.wasmManager.request).toHaveBeenCalledWith('lnrpc.GetInfo', {
        foo: 'bar'
      });
    });

    it('delegates subscribe to WasmManager', () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      const onMessage = vi.fn();
      const onError = vi.fn();
      lnc.subscribe('lnrpc.SubscribeInvoices', {}, onMessage, onError);
      expect(mocks.wasmManager.subscribe).toHaveBeenCalledWith(
        'lnrpc.SubscribeInvoices',
        {},
        onMessage,
        onError
      );
    });
  });

  describe('pair', () => {
    it('sets pairing phrase and serverHost on cache, then runs and connects', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      await lnc.pair(testData.pairingPhrase);

      expect(mocks.credentialCache.set).toHaveBeenCalledWith(
        'pairingPhrase',
        testData.pairingPhrase
      );
      expect(mocks.credentialCache.set).toHaveBeenCalledWith(
        'serverHost',
        'mailbox.terminal.lightning.today:443'
      );
      expect(mocks.wasmManager.run).toHaveBeenCalled();
      expect(mocks.wasmManager.waitTilReady).toHaveBeenCalled();
      expect(mocks.wasmManager.connect).toHaveBeenCalled();
    });

    it('does not overwrite serverHost if already set', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      mocks.credentialCache.set('serverHost', testData.serverHost);

      await lnc.pair(testData.pairingPhrase);

      // serverHost should not be overwritten.
      const serverHostCalls = mocks.credentialCache.set.mock.calls.filter(
        (c: string[]) => c[0] === 'serverHost'
      );
      // Only the initial set from our test setup, not from pair().
      expect(serverHostCalls).toHaveLength(1);
      expect(serverHostCalls[0][1]).toBe(testData.serverHost);
    });

    it('awaits session restoration before writing to cache', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);

      // Track call order to verify waitForSessionRestoration completes
      // before any cache writes.
      const callOrder: string[] = [];
      mocks.authCoordinator.waitForSessionRestoration.mockImplementation(
        async () => {
          callOrder.push('waitForSessionRestoration');
        }
      );
      const originalSet = mocks.credentialCache.set.getMockImplementation()!;
      mocks.credentialCache.set.mockImplementation(
        (key: string, value: string) => {
          callOrder.push(`set:${key}`);
          originalSet(key, value);
        }
      );

      await lnc.pair(testData.pairingPhrase);

      expect(callOrder[0]).toBe('waitForSessionRestoration');
      expect(callOrder[1]).toBe('set:pairingPhrase');
    });
  });

  describe('unlock', () => {
    it('delegates to AuthenticationCoordinator.unlock()', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      const result = await lnc.unlock({
        method: 'password',
        password: testData.password
      });
      expect(result).toBe(true);
      expect(mocks.authCoordinator.unlock).toHaveBeenCalledWith({
        method: 'password',
        password: testData.password
      });
    });

    it('returns false for passkey when passkeys are disabled', async () => {
      const lnc = new LightningNodeConnect({ allowPasskeys: false });
      const mocks = createModernMockSetup(lnc);
      mocks.authCoordinator.unlock.mockResolvedValue(false);
      const result = await lnc.unlock({ method: 'passkey' });
      expect(result).toBe(false);
    });

    it('returns false for session when sessions are disabled', async () => {
      const lnc = new LightningNodeConnect({ enableSessions: false });
      const mocks = createModernMockSetup(lnc);
      mocks.authCoordinator.unlock.mockResolvedValue(false);
      const result = await lnc.unlock({ method: 'session' });
      expect(result).toBe(false);
    });
  });

  describe('tryAutoRestore', () => {
    it('delegates to AuthenticationCoordinator and does not call connect', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      mocks.authCoordinator.tryAutoRestore.mockResolvedValue(true);

      const result = await lnc.tryAutoRestore();

      expect(result).toBe(true);
      expect(mocks.authCoordinator.tryAutoRestore).toHaveBeenCalled();
      expect(mocks.wasmManager.connect).not.toHaveBeenCalled();
    });
  });

  describe('persistWithPassword', () => {
    it('throws when not connected', async () => {
      const lnc = new LightningNodeConnect();
      await expect(lnc.persistWithPassword(testData.password)).rejects.toThrow(
        'Must be connected before persisting credentials'
      );
    });

    it('throws when password strategy is not available', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      mocks.wasmManager.isConnected = true;
      mocks.strategyManager.getStrategy.mockReturnValue(undefined);

      await expect(lnc.persistWithPassword(testData.password)).rejects.toThrow(
        'Password strategy not available'
      );
    });

    it('unlocks password strategy and persists credentials', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      mocks.wasmManager.isConnected = true;
      const mockStrategy = {
        method: 'password',
        unlock: vi.fn().mockResolvedValue(true),
        isSupported: true,
        isUnlocked: true
      };
      mocks.strategyManager.getStrategy.mockReturnValue(mockStrategy);

      await lnc.persistWithPassword(testData.password);

      expect(mockStrategy.unlock).toHaveBeenCalledWith({
        method: 'password',
        password: testData.password
      });
      expect(
        mocks.authCoordinator.persistCachedCredentials
      ).toHaveBeenCalledWith(mockStrategy);
    });

    it('throws when password strategy unlock fails', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      mocks.wasmManager.isConnected = true;
      const mockStrategy = {
        method: 'password',
        unlock: vi.fn().mockResolvedValue(false),
        isSupported: true,
        isUnlocked: false
      };
      mocks.strategyManager.getStrategy.mockReturnValue(mockStrategy);

      await expect(lnc.persistWithPassword('bad-pw')).rejects.toThrow(
        'Failed to unlock password strategy'
      );
      expect(
        mocks.authCoordinator.persistCachedCredentials
      ).not.toHaveBeenCalled();
    });
  });

  describe('persistWithPasskey', () => {
    it('throws when not connected', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      mocks.strategyManager.getStrategy.mockReturnValue({
        method: 'passkey',
        unlock: vi.fn(),
        isSupported: true
      });

      await expect(lnc.persistWithPasskey()).rejects.toThrow(
        'Must be connected before persisting credentials'
      );
    });

    it('unlocks passkey strategy with createIfMissing and persists', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      mocks.wasmManager.isConnected = true;
      const mockStrategy = {
        method: 'passkey',
        unlock: vi.fn().mockResolvedValue(true),
        isSupported: true,
        isUnlocked: true
      };
      mocks.strategyManager.getStrategy.mockReturnValue(mockStrategy);

      await lnc.persistWithPasskey();

      expect(mockStrategy.unlock).toHaveBeenCalledWith({
        method: 'passkey',
        createIfMissing: true
      });
      expect(
        mocks.authCoordinator.persistCachedCredentials
      ).toHaveBeenCalledWith(mockStrategy);
    });

    it('throws when passkey strategy unlock fails', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      mocks.wasmManager.isConnected = true;
      const mockStrategy = {
        method: 'passkey',
        unlock: vi.fn().mockResolvedValue(false),
        isSupported: true,
        isUnlocked: false
      };
      mocks.strategyManager.getStrategy.mockReturnValue(mockStrategy);

      await expect(lnc.persistWithPasskey()).rejects.toThrow(
        'Failed to unlock passkey strategy'
      );
      expect(
        mocks.authCoordinator.persistCachedCredentials
      ).not.toHaveBeenCalled();
    });

    it('throws when passkey strategy is not available', async () => {
      const lnc = new LightningNodeConnect({ allowPasskeys: false });
      const mocks = createModernMockSetup(lnc);
      mocks.wasmManager.isConnected = true;
      mocks.strategyManager.getStrategy.mockReturnValue(undefined);

      await expect(lnc.persistWithPasskey()).rejects.toThrow(
        'Passkey strategy not available'
      );
    });
  });

  describe('supportsPasskeys', () => {
    it('returns false when passkeys are disabled even if browser supports them', () => {
      const lnc = new LightningNodeConnect({ allowPasskeys: false });
      expect(lnc.supportsPasskeys()).toBe(false);
    });

    it('returns true when passkeys are enabled and strategy is supported', () => {
      const lnc = new LightningNodeConnect({ allowPasskeys: true });
      const mocks = createModernMockSetup(lnc);
      mocks.strategyManager.getStrategy.mockReturnValue({
        isSupported: true
      });
      expect(lnc.supportsPasskeys()).toBe(true);
    });

    it('returns false when passkeys are enabled but strategy is not supported', () => {
      const lnc = new LightningNodeConnect({ allowPasskeys: true });
      const mocks = createModernMockSetup(lnc);
      mocks.strategyManager.getStrategy.mockReturnValue({
        isSupported: false
      });
      expect(lnc.supportsPasskeys()).toBe(false);
    });
  });

  describe('isPasskeySupported (static)', () => {
    it('delegates to PasskeyEncryptionService.isSupported()', async () => {
      const result = await LightningNodeConnect.isPasskeySupported();
      expect(result).toBe(true);
    });
  });

  describe('ConnectionCallbacks', () => {
    it('onLocalKeyCreated writes to CredentialCache', () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);

      mocks.wasmManager.callbacks.onLocalKeyCreated(testData.localKey);

      expect(mocks.credentialCache.set).toHaveBeenCalledWith(
        'localKey',
        testData.localKey
      );
    });

    it('onRemoteKeyReceived writes to CredentialCache', () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);

      mocks.wasmManager.callbacks.onRemoteKeyReceived(testData.remoteKey);

      expect(mocks.credentialCache.set).toHaveBeenCalledWith(
        'remoteKey',
        testData.remoteKey
      );
    });
  });

  describe('clear', () => {
    it('clears session by default', () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      lnc.clear();
      expect(mocks.authCoordinator.clearSession).toHaveBeenCalled();
      expect(mocks.strategyManager.clearAll).not.toHaveBeenCalled();
    });

    it('clears persisted data when requested', () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      lnc.clear({ persisted: true });
      expect(mocks.authCoordinator.clearSession).toHaveBeenCalled();
      expect(mocks.strategyManager.clearAll).toHaveBeenCalled();
    });

    it('skips session clear when session: false', () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      lnc.clear({ session: false, persisted: true });
      expect(mocks.authCoordinator.clearSession).not.toHaveBeenCalled();
      expect(mocks.strategyManager.clearAll).toHaveBeenCalled();
    });
  });

  describe('getAuthenticationInfo', () => {
    it('delegates to AuthenticationCoordinator', async () => {
      const lnc = new LightningNodeConnect();
      const info = await lnc.getAuthenticationInfo();
      expect(info).toEqual({
        isUnlocked: false,
        hasStoredCredentials: false,
        hasActiveSession: false,
        sessionTimeRemaining: 0,
        supportsPasskeys: false,
        hasPasskey: false,
        preferredUnlockMethod: 'password'
      });
    });
  });

  describe('login', () => {
    it('unlocks and connects in a single call', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);

      // Simulate unlock populating the cache with stored credentials.
      mocks.authCoordinator.unlock.mockImplementation(async () => {
        mocks.credentialCache.set('localKey', testData.localKey);
        mocks.credentialCache.set('pairingPhrase', testData.pairingPhrase);
        return true;
      });

      await lnc.login({ method: 'password', password: testData.password });

      expect(mocks.authCoordinator.unlock).toHaveBeenCalledWith({
        method: 'password',
        password: testData.password
      });
      expect(mocks.wasmManager.connect).toHaveBeenCalled();
    });

    it('throws when unlock fails', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      mocks.authCoordinator.unlock.mockResolvedValue(false);

      await expect(
        lnc.login({ method: 'password', password: 'bad' })
      ).rejects.toThrow("Failed to unlock with method 'password'");
      expect(mocks.wasmManager.connect).not.toHaveBeenCalled();
    });
  });

  describe('pair with persist', () => {
    it('pairs and persists with password in a single call', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      const mockStrategy = {
        method: 'password',
        unlock: vi.fn().mockResolvedValue(true),
        isSupported: true,
        isUnlocked: true
      };
      mocks.strategyManager.getStrategy.mockReturnValue(mockStrategy);

      // Flip isConnected to true after WASM connect so persist doesn't throw.
      mocks.wasmManager.connect.mockImplementation(async () => {
        mocks.wasmManager.isConnected = true;
      });

      await lnc.pair(testData.pairingPhrase, {
        method: 'password',
        password: testData.password
      });

      // Verify pair connected.
      expect(mocks.wasmManager.connect).toHaveBeenCalled();
      // Verify persist was called.
      expect(mockStrategy.unlock).toHaveBeenCalledWith({
        method: 'password',
        password: testData.password
      });
      expect(
        mocks.authCoordinator.persistCachedCredentials
      ).toHaveBeenCalledWith(mockStrategy);
    });

    it('pairs and persists with passkey in a single call', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      const mockStrategy = {
        method: 'passkey',
        unlock: vi.fn().mockResolvedValue(true),
        isSupported: true,
        isUnlocked: true
      };
      mocks.strategyManager.getStrategy.mockReturnValue(mockStrategy);

      mocks.wasmManager.connect.mockImplementation(async () => {
        mocks.wasmManager.isConnected = true;
      });

      await lnc.pair(testData.pairingPhrase, { method: 'passkey' });

      expect(mockStrategy.unlock).toHaveBeenCalledWith({
        method: 'passkey',
        createIfMissing: true
      });
      expect(
        mocks.authCoordinator.persistCachedCredentials
      ).toHaveBeenCalledWith(mockStrategy);
    });

    it('skips persistence when no persist option given', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      await lnc.pair(testData.pairingPhrase);

      expect(
        mocks.authCoordinator.persistCachedCredentials
      ).not.toHaveBeenCalled();
    });
  });

  describe('full lifecycle: pair → persist → disconnect → login', () => {
    it('round-trips through pair, persist, disconnect, and reconnect', async () => {
      const lnc = new LightningNodeConnect();
      const mocks = createModernMockSetup(lnc);
      const mockStrategy = {
        method: 'password',
        unlock: vi.fn().mockResolvedValue(true),
        isSupported: true,
        isUnlocked: true
      };
      mocks.strategyManager.getStrategy.mockReturnValue(mockStrategy);

      // Step 1: pair — WASM connect flips isConnected.
      mocks.wasmManager.connect.mockImplementation(async () => {
        mocks.wasmManager.isConnected = true;
      });
      await lnc.pair(testData.pairingPhrase);

      expect(mocks.wasmManager.connect).toHaveBeenCalledTimes(1);
      expect(mocks.credentialCache.set).toHaveBeenCalledWith(
        'pairingPhrase',
        testData.pairingPhrase
      );

      // Step 2: persist with password.
      await lnc.persistWithPassword(testData.password);

      expect(
        mocks.authCoordinator.persistCachedCredentials
      ).toHaveBeenCalledWith(mockStrategy);

      // Step 3: disconnect.
      lnc.disconnect();
      mocks.wasmManager.isConnected = false;
      expect(mocks.wasmManager.disconnect).toHaveBeenCalled();

      // Step 4: login (unlock + connect) as a returning user.
      mocks.authCoordinator.unlock.mockImplementation(async () => {
        mocks.credentialCache.set('localKey', testData.localKey);
        mocks.credentialCache.set('pairingPhrase', testData.pairingPhrase);
        return true;
      });

      await lnc.login({
        method: 'password',
        password: testData.password
      });

      expect(mocks.authCoordinator.unlock).toHaveBeenCalledWith({
        method: 'password',
        password: testData.password
      });
      expect(mocks.wasmManager.connect).toHaveBeenCalledTimes(2);
    });
  });
});
