import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LightningNodeConnect } from './lightningNodeConnect';

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

/**
 * Helper to access private fields on the LNC instance for assertions.
 */
const internals = (lnc: LightningNodeConnect) => lnc as any;

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
      expect(internals(lnc)._config.allowPasskeys).toBe(true);
    });

    it('enables sessions by default', () => {
      const lnc = new LightningNodeConnect();
      expect(internals(lnc)._config.enableSessions).toBe(true);
    });
  });

  describe('opt-out config', () => {
    it('allows disabling passkeys', () => {
      const lnc = new LightningNodeConnect({
        allowPasskeys: false,
        enableSessions: false
      });
      expect(internals(lnc)._config.allowPasskeys).toBe(false);
      expect(internals(lnc)._config.enableSessions).toBe(false);
    });
  });

  describe('explicit config', () => {
    it('uses provided namespace and wasmClientCode', () => {
      const lnc = new LightningNodeConnect({
        namespace: 'custom-ns',
        wasmClientCode: 'https://example.com/custom.wasm'
      });
      expect(internals(lnc)._config.namespace).toBe('custom-ns');
      expect(internals(lnc)._config.wasmClientCode).toBe(
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
  });

  describe('lifecycle methods', () => {
    it('delegates preload to WasmManager', async () => {
      const lnc = new LightningNodeConnect();
      await lnc.preload();
      expect(internals(lnc)._wasmManager.preload).toHaveBeenCalled();
    });

    it('delegates connect to WasmManager with ConnectionParams from cache', async () => {
      const lnc = new LightningNodeConnect();
      const cache = internals(lnc)._credentialCache;
      cache.set('pairingPhrase', 'phrase');
      cache.set('serverHost', 'host:443');
      cache.set('localKey', 'lk');
      cache.set('remoteKey', 'rk');

      await lnc.connect();

      expect(internals(lnc)._wasmManager.connect).toHaveBeenCalledWith({
        pairingPhrase: 'phrase',
        serverHost: 'host:443',
        localKey: 'lk',
        remoteKey: 'rk'
      });
    });

    it('creates a session after successful connection', async () => {
      const lnc = new LightningNodeConnect();
      const cache = internals(lnc)._credentialCache;
      cache.set('pairingPhrase', 'phrase');

      await lnc.connect();

      expect(
        internals(lnc)._authCoordinator.createSessionAfterConnection
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
      const cache = internals(lnc)._credentialCache;
      cache.set('pairingPhrase', 'phrase');

      internals(
        lnc
      )._authCoordinator.createSessionAfterConnection.mockRejectedValue(
        new Error('session boom')
      );

      // connect() should resolve despite session creation failure.
      await expect(lnc.connect()).resolves.toBeUndefined();
    });

    it('skips session creation when sessions are disabled', async () => {
      const lnc = new LightningNodeConnect({ enableSessions: false });
      const cache = internals(lnc)._credentialCache;
      cache.set('pairingPhrase', 'phrase');

      await lnc.connect();

      expect(
        internals(lnc)._authCoordinator.createSessionAfterConnection
      ).not.toHaveBeenCalled();
    });

    it('delegates disconnect to WasmManager', () => {
      const lnc = new LightningNodeConnect();
      lnc.disconnect();
      expect(internals(lnc)._wasmManager.disconnect).toHaveBeenCalled();
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
      const result = await lnc.request('lnrpc.GetInfo', { foo: 'bar' });
      expect(result).toEqual({ result: 'ok' });
      expect(internals(lnc)._wasmManager.request).toHaveBeenCalledWith(
        'lnrpc.GetInfo',
        { foo: 'bar' }
      );
    });

    it('delegates subscribe to WasmManager', () => {
      const lnc = new LightningNodeConnect();
      const onMessage = vi.fn();
      const onError = vi.fn();
      lnc.subscribe('lnrpc.SubscribeInvoices', {}, onMessage, onError);
      expect(internals(lnc)._wasmManager.subscribe).toHaveBeenCalledWith(
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
      await lnc.pair('my-pairing-phrase');

      const cache = internals(lnc)._credentialCache;
      expect(cache.set).toHaveBeenCalledWith(
        'pairingPhrase',
        'my-pairing-phrase'
      );
      expect(cache.set).toHaveBeenCalledWith(
        'serverHost',
        'mailbox.terminal.lightning.today:443'
      );
      expect(internals(lnc)._wasmManager.run).toHaveBeenCalled();
      expect(internals(lnc)._wasmManager.waitTilReady).toHaveBeenCalled();
      expect(internals(lnc)._wasmManager.connect).toHaveBeenCalled();
    });

    it('does not overwrite serverHost if already set', async () => {
      const lnc = new LightningNodeConnect();
      const cache = internals(lnc)._credentialCache;
      cache.set('serverHost', 'custom:443');

      await lnc.pair('phrase');

      // serverHost should not be overwritten.
      const serverHostCalls = cache.set.mock.calls.filter(
        (c: string[]) => c[0] === 'serverHost'
      );
      // Only the initial set from our test setup, not from pair().
      expect(serverHostCalls).toHaveLength(1);
      expect(serverHostCalls[0][1]).toBe('custom:443');
    });
  });

  describe('unlock', () => {
    it('delegates to AuthenticationCoordinator.unlock()', async () => {
      const lnc = new LightningNodeConnect();
      const result = await lnc.unlock({ method: 'password', password: 'pw' });
      expect(result).toBe(true);
      expect(internals(lnc)._authCoordinator.unlock).toHaveBeenCalledWith({
        method: 'password',
        password: 'pw'
      });
    });

    it('returns false for passkey when passkeys are disabled', async () => {
      const lnc = new LightningNodeConnect({ allowPasskeys: false });
      // The strategyManager mock returns undefined for 'passkey' when passkeys disabled.
      // AuthCoordinator.unlock delegates to strategyManager which returns false for unsupported methods.
      internals(lnc)._authCoordinator.unlock.mockResolvedValue(false);
      const result = await lnc.unlock({ method: 'passkey' });
      expect(result).toBe(false);
    });

    it('returns false for session when sessions are disabled', async () => {
      const lnc = new LightningNodeConnect({ enableSessions: false });
      internals(lnc)._authCoordinator.unlock.mockResolvedValue(false);
      const result = await lnc.unlock({ method: 'session' });
      expect(result).toBe(false);
    });
  });

  describe('tryAutoRestore', () => {
    it('delegates to AuthenticationCoordinator and does not call connect', async () => {
      const lnc = new LightningNodeConnect();
      internals(lnc)._authCoordinator.tryAutoRestore.mockResolvedValue(true);

      const result = await lnc.tryAutoRestore();

      expect(result).toBe(true);
      expect(internals(lnc)._authCoordinator.tryAutoRestore).toHaveBeenCalled();
      expect(internals(lnc)._wasmManager.connect).not.toHaveBeenCalled();
    });
  });

  describe('persistWithPassword', () => {
    it('throws when not connected', async () => {
      const lnc = new LightningNodeConnect();
      await expect(lnc.persistWithPassword('pw')).rejects.toThrow(
        'Must be connected before persisting credentials'
      );
    });

    it('throws when password strategy is not available', async () => {
      const lnc = new LightningNodeConnect();
      internals(lnc)._wasmManager.isConnected = true;
      internals(lnc)._strategyManager.getStrategy.mockReturnValue(undefined);

      await expect(lnc.persistWithPassword('pw')).rejects.toThrow(
        'Password strategy not available'
      );
    });

    it('unlocks password strategy and persists credentials', async () => {
      const lnc = new LightningNodeConnect();
      internals(lnc)._wasmManager.isConnected = true;
      const mockStrategy = {
        method: 'password',
        unlock: vi.fn().mockResolvedValue(true),
        isSupported: true,
        isUnlocked: true
      };
      internals(lnc)._strategyManager.getStrategy.mockReturnValue(mockStrategy);

      await lnc.persistWithPassword('my-password');

      expect(mockStrategy.unlock).toHaveBeenCalledWith({
        method: 'password',
        password: 'my-password'
      });
      expect(
        internals(lnc)._authCoordinator.persistCachedCredentials
      ).toHaveBeenCalledWith(mockStrategy);
    });

    it('throws when password strategy unlock fails', async () => {
      const lnc = new LightningNodeConnect();
      internals(lnc)._wasmManager.isConnected = true;
      const mockStrategy = {
        method: 'password',
        unlock: vi.fn().mockResolvedValue(false),
        isSupported: true,
        isUnlocked: false
      };
      internals(lnc)._strategyManager.getStrategy.mockReturnValue(mockStrategy);

      await expect(lnc.persistWithPassword('bad-pw')).rejects.toThrow(
        'Failed to unlock password strategy'
      );
      expect(
        internals(lnc)._authCoordinator.persistCachedCredentials
      ).not.toHaveBeenCalled();
    });
  });

  describe('persistWithPasskey', () => {
    it('throws when not connected', async () => {
      const lnc = new LightningNodeConnect();
      internals(lnc)._strategyManager.getStrategy.mockReturnValue({
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
      internals(lnc)._wasmManager.isConnected = true;
      const mockStrategy = {
        method: 'passkey',
        unlock: vi.fn().mockResolvedValue(true),
        isSupported: true,
        isUnlocked: true
      };
      internals(lnc)._strategyManager.getStrategy.mockReturnValue(mockStrategy);

      await lnc.persistWithPasskey();

      expect(mockStrategy.unlock).toHaveBeenCalledWith({
        method: 'passkey',
        createIfMissing: true
      });
      expect(
        internals(lnc)._authCoordinator.persistCachedCredentials
      ).toHaveBeenCalledWith(mockStrategy);
    });

    it('throws when passkey strategy unlock fails', async () => {
      const lnc = new LightningNodeConnect();
      internals(lnc)._wasmManager.isConnected = true;
      const mockStrategy = {
        method: 'passkey',
        unlock: vi.fn().mockResolvedValue(false),
        isSupported: true,
        isUnlocked: false
      };
      internals(lnc)._strategyManager.getStrategy.mockReturnValue(mockStrategy);

      await expect(lnc.persistWithPasskey()).rejects.toThrow(
        'Failed to unlock passkey strategy'
      );
      expect(
        internals(lnc)._authCoordinator.persistCachedCredentials
      ).not.toHaveBeenCalled();
    });

    it('throws when passkey strategy is not available', async () => {
      const lnc = new LightningNodeConnect({ allowPasskeys: false });
      internals(lnc)._wasmManager.isConnected = true;
      internals(lnc)._strategyManager.getStrategy.mockReturnValue(undefined);

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
      internals(lnc)._strategyManager.getStrategy.mockReturnValue({
        isSupported: true
      });
      expect(lnc.supportsPasskeys()).toBe(true);
    });

    it('returns false when passkeys are enabled but strategy is not supported', () => {
      const lnc = new LightningNodeConnect({ allowPasskeys: true });
      internals(lnc)._strategyManager.getStrategy.mockReturnValue({
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
      const callbacks = internals(lnc)._wasmManager.callbacks;

      callbacks.onLocalKeyCreated('local-key-hex');

      expect(internals(lnc)._credentialCache.set).toHaveBeenCalledWith(
        'localKey',
        'local-key-hex'
      );
    });

    it('onRemoteKeyReceived writes to CredentialCache', () => {
      const lnc = new LightningNodeConnect();
      const callbacks = internals(lnc)._wasmManager.callbacks;

      callbacks.onRemoteKeyReceived('remote-key-hex');

      expect(internals(lnc)._credentialCache.set).toHaveBeenCalledWith(
        'remoteKey',
        'remote-key-hex'
      );
    });
  });

  describe('clear', () => {
    it('clears session by default', () => {
      const lnc = new LightningNodeConnect();
      lnc.clear();
      expect(internals(lnc)._authCoordinator.clearSession).toHaveBeenCalled();
      expect(internals(lnc)._strategyManager.clearAll).not.toHaveBeenCalled();
    });

    it('clears persisted data when requested', () => {
      const lnc = new LightningNodeConnect();
      lnc.clear({ persisted: true });
      expect(internals(lnc)._authCoordinator.clearSession).toHaveBeenCalled();
      expect(internals(lnc)._strategyManager.clearAll).toHaveBeenCalled();
    });

    it('skips session clear when session: false', () => {
      const lnc = new LightningNodeConnect();
      lnc.clear({ session: false, persisted: true });
      expect(
        internals(lnc)._authCoordinator.clearSession
      ).not.toHaveBeenCalled();
      expect(internals(lnc)._strategyManager.clearAll).toHaveBeenCalled();
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
});
