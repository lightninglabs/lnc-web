import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { wasmLog } from './util/log';
import {
  ConnectionCallbacks,
  ConnectionParams,
  lncGlobal,
  WasmManager
} from './wasmManager';

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
  wasmClientInvokeRPC: ReturnType<typeof vi.fn>;
  wasmClientStatus: ReturnType<typeof vi.fn>;
  wasmClientGetExpiry: ReturnType<typeof vi.fn>;
  wasmClientIsReadOnly: ReturnType<typeof vi.fn>;
  wasmClientHasPerms: ReturnType<typeof vi.fn>;
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

const createCallbacks = (): ConnectionCallbacks => ({
  onLocalKeyCreated: vi.fn(),
  onRemoteKeyReceived: vi.fn()
});

const createParams = (
  overrides: Partial<ConnectionParams> = {}
): ConnectionParams => ({
  pairingPhrase: 'pair',
  serverHost: 'server',
  localKey: 'local',
  remoteKey: 'remote',
  ...overrides
});

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
      const manager = new WasmManager(namespace, 'code', createCallbacks());

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
      const manager = new WasmManager(namespace, 'code', createCallbacks());

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

      const manager = new WasmManager(namespace, 'code', createCallbacks());
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

      const manager = new WasmManager(namespace, 'code', createCallbacks());
      const promise = manager.waitTilReady();

      vi.advanceTimersByTime(21 * 500);

      await expect(promise).rejects.toThrow('Failed to load the WASM client');
    });
  });

  describe('connect', () => {
    it('connects successfully with ConnectionParams', async () => {
      vi.useFakeTimers();
      const namespace = 'connect-params';
      let connected = false;
      const wasm = createWasmNamespace({
        wasmClientIsConnected: vi.fn().mockImplementation(() => connected)
      });
      registerNamespace(namespace, wasm);

      const addEventListener = vi.fn();
      (globalThis as any).window = { addEventListener } as any;

      const manager = new WasmManager(namespace, 'code', createCallbacks());
      const params = createParams();

      const promise = manager.connect(params);

      vi.advanceTimersByTime(500);
      connected = true;
      vi.advanceTimersByTime(500);

      await expect(promise).resolves.toBeUndefined();
      expect(wasm.wasmClientConnectServer).toHaveBeenCalledWith(
        'server',
        false,
        'pair',
        'local',
        'remote'
      );
      expect(addEventListener).toHaveBeenCalledWith(
        'unload',
        wasm.wasmClientDisconnect
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

      const manager = new WasmManager(namespace, 'code', createCallbacks());

      const runSpy = vi.spyOn(manager, 'run').mockResolvedValue(undefined);
      const waitSpy = vi
        .spyOn(manager, 'waitTilReady')
        .mockResolvedValue(undefined);

      const connectPromise = manager.connect(createParams());

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
      expect(wasmLog.info).toHaveBeenCalledWith(
        'No unload event listener added. window is not available'
      );
    });

    it('does not perform post-connect credential cleanup', async () => {
      vi.useFakeTimers();
      const namespace = 'no-cleanup';
      let connected = false;
      const wasm = createWasmNamespace({
        wasmClientIsConnected: vi.fn().mockImplementation(() => connected)
      });
      registerNamespace(namespace, wasm);
      (globalThis as any).window = { addEventListener: vi.fn() } as any;

      const manager = new WasmManager(namespace, 'code', createCallbacks());

      const promise = manager.connect(createParams());
      vi.advanceTimersByTime(500);
      connected = true;
      vi.advanceTimersByTime(500);

      await expect(promise).resolves.toBeUndefined();
      // WasmManager no longer does post-connect cleanup.
      expect(wasmLog.info).toHaveBeenCalledWith(
        'The WASM client is connected to the server'
      );
    });

    it('rejects when connection cannot be established in time', async () => {
      vi.useFakeTimers();
      const namespace = 'connect-timeout';
      const wasm = createWasmNamespace({
        wasmClientIsConnected: vi.fn().mockReturnValue(false)
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code', createCallbacks());

      const promise = manager.connect(createParams());
      vi.advanceTimersByTime(21 * 500);

      await expect(promise).rejects.toThrow(
        'Failed to connect the WASM client to the proxy server'
      );
    });
  });

  describe('setupWasmCallbacks', () => {
    it('invokes ConnectionCallbacks when WASM key callbacks fire', async () => {
      const namespace = 'callback-invocation';
      const callbacks = createCallbacks();
      const manager = new WasmManager(namespace, 'code', callbacks);

      global.fetch = vi.fn().mockResolvedValue({} as Response);
      global.WebAssembly = {
        instantiateStreaming: vi.fn().mockResolvedValue({
          module: {},
          instance: {}
        }),
        instantiate: vi.fn().mockResolvedValue({})
      } as any;

      await manager.run();
      namespaces.push(namespace);

      const wasm = (lncGlobal as any)[namespace];

      wasm.onLocalPrivCreate?.('local-key-hex');
      wasm.onRemoteKeyReceive?.('remote-key-hex');

      expect(callbacks.onLocalKeyCreated).toHaveBeenCalledWith('local-key-hex');
      expect(callbacks.onRemoteKeyReceived).toHaveBeenCalledWith(
        'remote-key-hex'
      );
    });

    it('invokes callbacks set via constructor when setupWasmCallbacks is called directly', () => {
      const namespace = 'callback-via-constructor';
      const wasm = createWasmNamespace({
        wasmClientIsReady: vi.fn().mockReturnValue(true),
        wasmClientIsConnected: vi.fn().mockReturnValue(true)
      });
      registerNamespace(namespace, wasm);

      const callbacks = createCallbacks();
      const manager = new WasmManager(namespace, 'code', callbacks);

      // Invoke private method to register WASM callbacks.
      (manager as any).setupWasmCallbacks();

      wasm.onLocalPrivCreate?.('local-key');
      wasm.onRemoteKeyReceive?.('remote-key');

      expect(callbacks.onLocalKeyCreated).toHaveBeenCalledWith('local-key');
      expect(callbacks.onRemoteKeyReceived).toHaveBeenCalledWith('remote-key');
    });

    it('logs auth data when onAuthData fires', async () => {
      const namespace = 'callback-authdata';
      const callbacks = createCallbacks();
      const manager = new WasmManager(namespace, 'code', callbacks);

      global.fetch = vi.fn().mockResolvedValue({} as Response);
      global.WebAssembly = {
        instantiateStreaming: vi.fn().mockResolvedValue({
          module: {},
          instance: {}
        }),
        instantiate: vi.fn().mockResolvedValue({})
      } as any;

      await manager.run();
      namespaces.push(namespace);

      const wasm = (lncGlobal as any)[namespace];
      wasm.onAuthData?.('auth-data-hex');

      expect(wasmLog.debug).toHaveBeenCalledWith(
        'auth data received: auth-data-hex'
      );
    });
  });

  describe('state getters', () => {
    it('returns status from WASM namespace', () => {
      const namespace = 'getter-status';
      const wasm = createWasmNamespace({
        wasmClientStatus: vi.fn().mockReturnValue('connected')
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code', createCallbacks());
      expect(manager.status).toBe('connected');
    });

    it('returns expiry as Date from WASM namespace', () => {
      const namespace = 'getter-expiry';
      const wasm = createWasmNamespace({
        wasmClientGetExpiry: vi.fn().mockReturnValue(1700000000)
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code', createCallbacks());
      expect(manager.expiry).toEqual(new Date(1700000000 * 1000));
    });

    it('returns isReadOnly from WASM namespace', () => {
      const namespace = 'getter-readonly';
      const wasm = createWasmNamespace({
        wasmClientIsReadOnly: vi.fn().mockReturnValue(true)
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code', createCallbacks());
      expect(manager.isReadOnly).toBe(true);
    });

    it('returns hasPerms from WASM namespace', () => {
      const namespace = 'getter-perms';
      const wasm = createWasmNamespace({
        wasmClientHasPerms: vi.fn().mockReturnValue(true)
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code', createCallbacks());
      expect(manager.hasPerms('lnrpc.Lightning.GetInfo')).toBe(true);
      expect(wasm.wasmClientHasPerms).toHaveBeenCalledWith(
        'lnrpc.Lightning.GetInfo'
      );
    });
  });

  describe('disconnect', () => {
    it('removes unload listener and calls wasmClientDisconnect', () => {
      const namespace = 'disconnect-test';
      const wasm = createWasmNamespace();
      registerNamespace(namespace, wasm);

      const removeEventListener = vi.fn();
      (globalThis as any).window = { removeEventListener } as any;

      const manager = new WasmManager(namespace, 'code', createCallbacks());
      manager.disconnect();

      expect(removeEventListener).toHaveBeenCalledWith(
        'unload',
        wasm.wasmClientDisconnect
      );
      expect(wasm.wasmClientDisconnect).toHaveBeenCalled();
    });
  });

  describe('connect edge cases', () => {
    it('returns immediately when already connected', async () => {
      const namespace = 'already-connected';
      const wasm = createWasmNamespace({
        wasmClientIsConnected: vi.fn().mockReturnValue(true)
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code', createCallbacks());
      await manager.connect(createParams());

      expect(wasm.wasmClientConnectServer).not.toHaveBeenCalled();
    });

    it('coerces undefined localKey and remoteKey to empty strings', async () => {
      vi.useFakeTimers();
      const namespace = 'undefined-keys';
      let connected = false;
      const wasm = createWasmNamespace({
        wasmClientIsConnected: vi.fn().mockImplementation(() => connected)
      });
      registerNamespace(namespace, wasm);
      (globalThis as any).window = { addEventListener: vi.fn() } as any;

      const manager = new WasmManager(namespace, 'code', createCallbacks());
      const promise = manager.connect(
        createParams({ localKey: undefined, remoteKey: undefined })
      );

      vi.advanceTimersByTime(500);
      connected = true;
      vi.advanceTimersByTime(500);

      await expect(promise).resolves.toBeUndefined();
      expect(wasm.wasmClientConnectServer).toHaveBeenCalledWith(
        'server',
        false,
        'pair',
        '',
        ''
      );
    });
  });

  describe('request', () => {
    it('resolves with camelCased response on success', async () => {
      const namespace = 'request-success';
      const wasm = createWasmNamespace({
        wasmClientInvokeRPC: vi
          .fn()
          .mockImplementation(
            (_method: string, _req: string, cb: (res: string) => void) => {
              cb(JSON.stringify({ some_field: 'value' }));
            }
          )
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code', createCallbacks());
      const result = await manager.request('lnrpc.GetInfo', { key: 'val' });

      expect(result).toEqual({ some_field: 'value' });
      expect(wasm.wasmClientInvokeRPC).toHaveBeenCalledWith(
        'lnrpc.GetInfo',
        '{"key":"val"}',
        expect.any(Function)
      );
    });

    it('rejects when response is not valid JSON', async () => {
      const namespace = 'request-error';
      const wasm = createWasmNamespace({
        wasmClientInvokeRPC: vi
          .fn()
          .mockImplementation(
            (_method: string, _req: string, cb: (res: string) => void) => {
              cb('not valid json');
            }
          )
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code', createCallbacks());
      await expect(manager.request('lnrpc.GetInfo')).rejects.toThrow(
        'not valid json'
      );
    });
  });

  describe('subscribe', () => {
    it('calls onMessage with camelCased response on success', () => {
      const namespace = 'subscribe-success';
      const wasm = createWasmNamespace({
        wasmClientInvokeRPC: vi
          .fn()
          .mockImplementation(
            (_method: string, _req: string, cb: (res: string) => void) => {
              cb(JSON.stringify({ channel_id: '123' }));
            }
          )
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code', createCallbacks());
      const onMessage = vi.fn();
      manager.subscribe('lnrpc.SubscribeChannelEvents', {}, onMessage);

      expect(onMessage).toHaveBeenCalledWith({ channel_id: '123' });
    });

    it('calls onError when response is not valid JSON', () => {
      const namespace = 'subscribe-error';
      const wasm = createWasmNamespace({
        wasmClientInvokeRPC: vi
          .fn()
          .mockImplementation(
            (_method: string, _req: string, cb: (res: string) => void) => {
              cb('bad json');
            }
          )
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code', createCallbacks());
      const onError = vi.fn();
      manager.subscribe('lnrpc.Subscribe', {}, undefined, onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toBe('bad json');
    });

    it('does not throw when onMessage and onError are omitted', () => {
      const namespace = 'subscribe-no-handlers';
      const wasm = createWasmNamespace({
        wasmClientInvokeRPC: vi
          .fn()
          .mockImplementation(
            (_method: string, _req: string, cb: (res: string) => void) => {
              cb(JSON.stringify({ ok: true }));
            }
          )
      });
      registerNamespace(namespace, wasm);

      const manager = new WasmManager(namespace, 'code', createCallbacks());

      expect(() => manager.subscribe('lnrpc.Subscribe')).not.toThrow();
    });
  });

  describe('run error path', () => {
    it('throws when WASM instance is missing after preload', async () => {
      const namespace = 'run-no-instance';
      const manager = new WasmManager(namespace, 'code', createCallbacks());

      // Mock preload to succeed but not set result.
      global.fetch = vi.fn().mockResolvedValue({} as Response);
      global.WebAssembly = {
        instantiateStreaming: vi.fn().mockResolvedValue(undefined)
      } as any;

      await expect(manager.run()).rejects.toThrow("Can't find WASM instance.");
      namespaces.push(namespace);
    });
  });
});
