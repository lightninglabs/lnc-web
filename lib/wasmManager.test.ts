import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { wasmLog } from './util/log';
import { lncGlobal, WasmManager } from './wasmManager';

type GoInstance = {
  importObject: WebAssembly.Imports;
  argv?: string[];
  run(instance: WebAssembly.Instance): Promise<void>;
};

vi.mock('./util/log', () => ({
  wasmLog: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('@lightninglabs/lnc-core', () => ({
  snakeKeysToCamel: (value: unknown) => value
}));

class FakeGo implements GoInstance {
  importObject: WebAssembly.Imports = {};
  argv: string[] = [];
  run = vi.fn().mockResolvedValue(undefined);
}

type WasmNamespace = {
  wasmClientIsReady: ReturnType<typeof vi.fn>;
  wasmClientIsConnected: ReturnType<typeof vi.fn>;
  wasmClientConnectServer: ReturnType<typeof vi.fn>;
  wasmClientDisconnect: ReturnType<typeof vi.fn>;
  onLocalPrivCreate?: ReturnType<typeof vi.fn>;
  onRemoteKeyReceive?: ReturnType<typeof vi.fn>;
  onAuthData?: ReturnType<typeof vi.fn>;
};

const createWasmNamespace = (overrides: Partial<WasmNamespace> = {}) => ({
  wasmClientIsReady: vi.fn().mockReturnValue(true),
  wasmClientIsConnected: vi.fn().mockReturnValue(true),
  wasmClientConnectServer: vi.fn(),
  wasmClientDisconnect: vi.fn(),
  wasmClientInvokeRPC: vi.fn(),
  wasmClientStatus: vi.fn(),
  wasmClientGetExpiry: vi.fn(),
  wasmClientIsReadOnly: vi.fn(),
  wasmClientHasPerms: vi.fn(),
  onLocalPrivCreate: undefined,
  onRemoteKeyReceive: undefined,
  onAuthData: undefined,
  ...overrides
});

const restoreWindow = (originalWindow: typeof window | undefined) => {
  if (originalWindow === undefined) {
    delete (globalThis as any).window;
  } else {
    (globalThis as any).window = originalWindow;
  }
};

describe('WasmManager', () => {
  const namespaces: string[] = [];
  let originalWindow: typeof window | undefined;
  const originalFetch = global.fetch;
  const originalWebAssembly = global.WebAssembly;

  beforeEach(() => {
    vi.clearAllMocks();
    (lncGlobal as any).Go = FakeGo as unknown as typeof lncGlobal.Go;
    originalWindow = (globalThis as any).window;
  });

  afterEach(() => {
    namespaces.forEach((ns) => {
      delete (lncGlobal as any)[ns];
    });
    namespaces.length = 0;
    restoreWindow(originalWindow);
    global.fetch = originalFetch;
    global.WebAssembly = originalWebAssembly;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const registerNamespace = (namespace: string, wasmNamespace: object) => {
    (lncGlobal as any)[namespace] = wasmNamespace;
    namespaces.push(namespace);
  };

  describe('run', () => {
    it('uses default implementations that throw or return default values', async () => {
      const namespace = 'default-global-test';
      const manager = new WasmManager(namespace, 'code');

      // Mock necessary globals for run() to succeed without doing real WASM work
      global.fetch = vi.fn().mockResolvedValue({} as Response);
      global.WebAssembly = {
        instantiateStreaming: vi.fn().mockResolvedValue({
          module: {},
          instance: {}
        }),
        instantiate: vi.fn().mockResolvedValue({})
      } as any;

      // Execute run() which populates DEFAULT_WASM_GLOBAL
      await manager.run();
      namespaces.push(namespace); // Ensure cleanup

      // Get the reference to the global object (which should be DEFAULT_WASM_GLOBAL)
      const wasm = (lncGlobal as any)[namespace];

      expect(wasm).toBeDefined();

      // Test value returning functions
      expect(wasm.wasmClientIsReady()).toBe(false);
      expect(wasm.wasmClientIsConnected()).toBe(false);
      expect(wasm.wasmClientStatus()).toBe('uninitialized');
      expect(wasm.wasmClientGetExpiry()).toBe(0);
      expect(wasm.wasmClientHasPerms()).toBe(false);
      expect(wasm.wasmClientIsReadOnly()).toBe(false);

      // Test throwing functions
      expect(() => wasm.wasmClientConnectServer()).toThrow(
        'WASM client not initialized'
      );
      expect(() => wasm.wasmClientDisconnect()).toThrow(
        'WASM client not initialized'
      );
      expect(() => wasm.wasmClientInvokeRPC()).toThrow(
        'WASM client not initialized'
      );
    });
  });

  describe('preload', () => {
    it('reuses an in-flight download instead of re-fetching', async () => {
      const namespace = 'preload-reuse';
      const manager = new WasmManager(namespace, 'code');

      const instantiateStreaming = vi
        .fn()
        .mockResolvedValue({ module: {}, instance: {} });
      global.fetch = vi.fn().mockResolvedValue({} as Response);
      global.WebAssembly = {
        instantiateStreaming
      } as any;

      await Promise.all([manager.preload(), manager.preload()]);

      expect(instantiateStreaming).toHaveBeenCalledTimes(1);
    });
  });

  describe('waitTilReady', () => {
    it('resolves once the WASM client reports ready', async () => {
      vi.useFakeTimers();
      const namespace = 'ready-namespace';
      let ready = false;
      const wasm = createWasmNamespace({
        wasmClientIsReady: vi.fn().mockImplementation(() => {
          if (!ready) {
            ready = true;
            return false;
          }
          return true;
        })
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code');
      const promise = manager.waitTilReady();

      vi.advanceTimersByTime(500); // first check - not ready
      await Promise.resolve();
      vi.advanceTimersByTime(500); // second check - ready

      await expect(promise).resolves.toBeUndefined();
      expect(wasm.wasmClientIsReady).toHaveBeenCalledTimes(2);
      expect(wasmLog.info).toHaveBeenCalledWith('The WASM client is ready');
    });

    it('rejects when readiness times out', async () => {
      vi.useFakeTimers();
      const namespace = 'timeout-namespace';
      const wasm = createWasmNamespace({
        wasmClientIsReady: vi.fn().mockReturnValue(false)
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code');
      const promise = manager.waitTilReady();

      vi.advanceTimersByTime(21 * 500);

      await expect(promise).rejects.toThrow('Failed to load the WASM client');
    });
  });

  describe('connect', () => {
    it('throws when no credential provider is available', async () => {
      const namespace = 'no-credentials';
      const wasm = createWasmNamespace();
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code');

      await expect(manager.connect()).rejects.toThrow(
        'No credential provider available'
      );
    });

    it('runs setup when WASM is not ready and window is unavailable', async () => {
      vi.useFakeTimers();
      const namespace = 'connect-flow';
      let connected = false;
      const wasm = createWasmNamespace({
        wasmClientIsReady: vi.fn().mockReturnValue(false),
        wasmClientIsConnected: vi.fn().mockImplementation(() => connected)
      });
      registerNamespace(namespace, wasm);
      delete (globalThis as any).window;

      const manager = new WasmManager(namespace, 'code');
      const runSpy = vi.spyOn(manager, 'run').mockResolvedValue(undefined);
      const waitSpy = vi
        .spyOn(manager, 'waitTilReady')
        .mockResolvedValue(undefined);

      const credentials = {
        pairingPhrase: 'pair',
        localKey: 'local',
        remoteKey: 'remote',
        serverHost: 'server',
        password: 'secret',
        clear: vi.fn()
      };

      const connectPromise = manager.connect(credentials);

      await vi.advanceTimersByTimeAsync(500);
      connected = true;
      await vi.advanceTimersByTimeAsync(500);

      await expect(connectPromise).resolves.toBeUndefined();

      expect(runSpy).toHaveBeenCalled();
      expect(waitSpy).toHaveBeenCalled();
      expect(wasm.wasmClientConnectServer).toHaveBeenCalledWith(
        'server',
        false,
        'pair',
        'local',
        'remote'
      );
      expect(credentials.clear).toHaveBeenCalledWith(true);
      expect(wasmLog.info).toHaveBeenCalledWith(
        'No unload event listener added. window is not available'
      );
    });

    it('adds unload listener when window is available', async () => {
      vi.useFakeTimers();
      const namespace = 'window-connect';
      let connected = false;
      const wasm = createWasmNamespace({
        wasmClientIsConnected: vi.fn().mockImplementation(() => connected)
      });
      registerNamespace(namespace, wasm);

      const addEventListener = vi.fn();
      (globalThis as any).window = { addEventListener } as any;

      const manager = new WasmManager(namespace, 'code');
      const credentials = {
        pairingPhrase: 'phrase',
        localKey: 'local',
        remoteKey: 'remote',
        serverHost: 'server',
        clear: vi.fn()
      };

      const promise = manager.connect(credentials);

      vi.advanceTimersByTime(500);
      connected = true;
      vi.advanceTimersByTime(500);

      await expect(promise).resolves.toBeUndefined();
      expect(addEventListener).toHaveBeenCalledWith(
        'unload',
        wasm.wasmClientDisconnect
      );
    });

    it('rejects when connection cannot be established in time', async () => {
      vi.useFakeTimers();
      const namespace = 'connect-timeout';
      const wasm = createWasmNamespace({
        wasmClientIsConnected: vi.fn().mockReturnValue(false)
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code');
      const credentials = {
        pairingPhrase: 'pair',
        localKey: 'local',
        remoteKey: 'remote',
        serverHost: 'server',
        clear: vi.fn()
      };

      const promise = manager.connect(credentials);
      vi.advanceTimersByTime(21 * 500);

      await expect(promise).rejects.toThrow(
        'Failed to connect the WASM client to the proxy server'
      );
    });
  });

  describe('setupWasmCallbacks', () => {
    it('logs a warning when no credential provider is available', () => {
      const namespace = 'callback-warnings';
      const wasm = createWasmNamespace({
        wasmClientIsReady: vi.fn().mockReturnValue(true),
        wasmClientIsConnected: vi.fn().mockReturnValue(true)
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code');

      // Invoke private method to register callbacks without a credential provider
      (manager as any).setupWasmCallbacks();

      wasm.onLocalPrivCreate?.('local-key');
      wasm.onRemoteKeyReceive?.('remote-key');

      expect(wasmLog.warn).toHaveBeenCalledWith(
        'no credential provider available to store local private key'
      );
      expect(wasmLog.warn).toHaveBeenCalledWith(
        'no credential provider available to store remote key'
      );
    });
  });

  describe('pair', () => {
    it('throws when no credential provider is configured', async () => {
      const namespace = 'pair-error';
      const wasm = createWasmNamespace();
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code');

      await expect(manager.pair('test')).rejects.toThrow(
        'No credential provider available'
      );
    });

    it('delegates to connect after setting the pairing phrase', async () => {
      const namespace = 'pair-success';
      const wasm = createWasmNamespace();
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code');
      const credentials = {
        pairingPhrase: '',
        localKey: 'local',
        remoteKey: 'remote',
        serverHost: 'server',
        clear: vi.fn()
      };
      manager.setCredentialProvider(credentials);

      const connectSpy = vi
        .spyOn(manager, 'connect')
        .mockResolvedValue(undefined);

      await manager.pair('new-phrase');

      expect(credentials.pairingPhrase).toBe('new-phrase');
      expect(connectSpy).toHaveBeenCalledWith(credentials);
    });
  });
});
