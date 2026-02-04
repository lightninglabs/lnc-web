import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WasmManager, lncGlobal } from './wasmManager';
import { wasmLog } from './util/log';

type GoInstance = {
  importObject: WebAssembly.Imports;
  argv?: string[];
  run(instance: WebAssembly.Instance): Promise<void>;
};

vi.mock('./util/log', () => ({
  wasmLog: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
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
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const registerNamespace = (namespace: string, wasmNamespace: object) => {
    (lncGlobal as any)[namespace] = wasmNamespace;
    namespaces.push(namespace);
  };

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

  describe('preload', () => {
    it('does not download multiple times when already preloading', async () => {
      const namespace = 'preload-once';
      registerNamespace(
        namespace,
        createWasmNamespace({
          wasmClientIsReady: vi.fn().mockReturnValue(false)
        })
      );

      const instantiateSpy = vi
        .spyOn(globalThis.WebAssembly, 'instantiateStreaming')
        .mockResolvedValue({ module: {} as any, instance: {} as any });
      globalThis.fetch = vi.fn().mockResolvedValue(new Response());

      const manager = new WasmManager(namespace, 'code');

      await Promise.all([manager.preload(), manager.preload()]);

      expect(instantiateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('DEFAULT_WASM_GLOBAL', () => {
    it('throws when calling client methods before initialization', async () => {
      const namespace = 'default-wasm-global';
      // Ensure namespace is not initialized so run() installs DEFAULT_WASM_GLOBAL
      delete (lncGlobal as any)[namespace];

      vi.spyOn(
        globalThis.WebAssembly,
        'instantiateStreaming'
      ).mockResolvedValue({
        module: {} as any,
        instance: {} as any
      });
      vi.spyOn(globalThis.WebAssembly, 'instantiate').mockResolvedValue({
        exports: {}
      } as any);
      globalThis.fetch = vi.fn().mockResolvedValue(new Response());

      const manager = new WasmManager(namespace, 'code');
      await manager.run();

      const wasm = (lncGlobal as any)[namespace];
      expect(() => wasm.wasmClientConnectServer()).toThrow(
        'WASM client not initialized'
      );
      expect(() => wasm.wasmClientDisconnect()).toThrow(
        'WASM client not initialized'
      );
      expect(() => wasm.wasmClientInvokeRPC()).toThrow(
        'WASM client not initialized'
      );

      // Verify constant-return default functions are callable.
      expect(wasm.wasmClientIsReady()).toBe(false);
      expect(wasm.wasmClientIsConnected()).toBe(false);
      expect(wasm.wasmClientHasPerms()).toBe(false);
      expect(wasm.wasmClientIsReadOnly()).toBe(false);
      expect(wasm.wasmClientStatus()).toBe('uninitialized');
      expect(wasm.wasmClientGetExpiry()).toBe(0);
    });

    it('warns when callbacks run without a credential provider', async () => {
      const namespace = 'callbacks-warn';
      delete (lncGlobal as any)[namespace];

      vi.spyOn(
        globalThis.WebAssembly,
        'instantiateStreaming'
      ).mockResolvedValue({
        module: {} as any,
        instance: {} as any
      });
      vi.spyOn(globalThis.WebAssembly, 'instantiate').mockResolvedValue({
        exports: {}
      } as any);
      globalThis.fetch = vi.fn().mockResolvedValue(new Response());

      const manager = new WasmManager(namespace, 'code');
      await manager.run();

      const wasm = (lncGlobal as any)[namespace];
      wasm.onLocalPrivCreate('local-hex');
      wasm.onRemoteKeyReceive('remote-hex');

      expect(wasmLog.warn).toHaveBeenCalledWith(
        'no credential provider available to store local private key'
      );
      expect(wasmLog.warn).toHaveBeenCalledWith(
        'no credential provider available to store remote key'
      );
    });
  });
});
