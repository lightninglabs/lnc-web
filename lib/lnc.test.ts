import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  Mocked,
  vi
} from 'vitest';
import { createMockSetup, MockSetup } from '../test/utils/mock-factory';
import { globalAccess, testData } from '../test/utils/test-helpers';
import LNC from './lnc';
import LncCredentialStore from './util/credentialStore';
import { WasmGlobal } from './types/lnc';

describe('LNC Core Class', () => {
  let mockSetup: MockSetup;
  let wasmGlobal: Mocked<WasmGlobal>;

  beforeEach(() => {
    // Create fresh mocks for each test (without WASM global by default)
    mockSetup = createMockSetup('default', false);
    wasmGlobal = globalAccess.setupWasmGlobal();
    wasmGlobal.wasmClientIsReady.mockReturnValue(true);
    wasmGlobal.wasmClientIsConnected.mockReturnValue(false);
  });

  afterEach(() => {
    mockSetup.cleanup();
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with default configuration', () => {
      const lnc = new LNC();

      expect(lnc).toBeInstanceOf(LNC);
      expect(lnc.credentials).toBeDefined();
      expect(lnc.lnd).toBeDefined();
      expect(lnc.loop).toBeDefined();
      expect(lnc.pool).toBeDefined();
      expect(lnc.faraday).toBeDefined();
      expect(lnc.tapd).toBeDefined();
      expect(lnc.lit).toBeDefined();
    });

    it('should merge custom config with defaults', () => {
      const lnc = new LNC({ namespace: 'custom_namespace' });

      expect(lnc).toBeInstanceOf(LNC);
      expect(lnc.credentials).toBeDefined();
    });

    it('should create credential store with correct namespace and password', () => {
      const config = {
        namespace: 'test_namespace',
        password: testData.password
      };

      const lnc = new LNC(config);

      expect(lnc.credentials).toBeDefined();
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        'lnc-web:test_namespace',
        expect.any(String)
      );
    });

    it('should use custom credential store if provided', () => {
      const customCredentialStore = {
        password: testData.password,
        pairingPhrase: testData.pairingPhrase,
        serverHost: testData.serverHost,
        localKey: testData.localKey,
        remoteKey: testData.remoteKey,
        isPaired: true,
        clear: vi.fn()
      };

      const lnc = new LNC({ credentialStore: customCredentialStore });

      expect(lnc.credentials).toBe(customCredentialStore);
    });

    it('should set serverHost from config if not already paired', () => {
      globalThis.localStorage.setItem(
        'lnc-web:test',
        JSON.stringify({
          salt: 'salt',
          cipher: 'cipher',
          serverHost: 'existing.server:443',
          remoteKey: '',
          pairingPhrase: '',
          localKey: ''
        })
      );

      const lnc = new LNC({
        serverHost: 'custom.server:9000',
        namespace: 'test'
      });

      expect(lnc.credentials.serverHost).toBe('custom.server:9000');
    });

    it('should set pairingPhrase on credential store if provided', () => {
      const lnc = new LNC({
        pairingPhrase: 'test_pairing_phrase',
        namespace: 'test'
      });

      expect(lnc.credentials.pairingPhrase).toBe('test_pairing_phrase');
    });

    it('should use LncCredentialStore by default', () => {
      const lnc = new LNC({ namespace: 'test-legacy-default' });

      expect(lnc.credentials).toBeInstanceOf(LncCredentialStore);
    });

    it('should handle undefined config gracefully', () => {
      const lnc = new LNC(undefined);

      expect(lnc).toBeInstanceOf(LNC);
      expect(lnc.credentials).toBeDefined();
    });

    it('should handle empty config object gracefully', () => {
      const lnc = new LNC({});

      expect(lnc).toBeInstanceOf(LNC);
      expect(lnc.credentials).toBeDefined();
    });

    it('should fall back to default namespace and wasmClientCode when falsy values are provided', () => {
      const lnc = new LNC({
        namespace: '',
        wasmClientCode: ''
      });

      expect(lnc).toBeInstanceOf(LNC);
      expect(lnc.credentials).toBeDefined();
    });
  });

  describe('Legacy API surface', () => {
    it('does not expose modern authentication helpers', () => {
      const lnc = new LNC();
      for (const key of [
        'pair',
        'unlock',
        'persistWithPassword',
        'persistWithPasskey',
        'tryAutoRestore',
        'getAuthenticationInfo',
        'supportsPasskeys',
        'clear',
        'clearCredentials'
      ]) {
        expect((lnc as any)[key]).toBeUndefined();
      }
      expect((LNC as any).isPasskeySupported).toBeUndefined();
    });
  });

  describe('WebAssembly Integration', () => {
    it('should preload WASM client successfully', async () => {
      const lnc = new LNC();

      const mockSource = {
        module: { exports: {} },
        instance: { exports: {} }
      };
      const instantiateSpy = vi
        .spyOn(globalThis.WebAssembly, 'instantiateStreaming')
        .mockResolvedValue(mockSource);

      globalThis.fetch = vi.fn().mockResolvedValue(new Response());

      await lnc.preload();

      expect(instantiateSpy).toHaveBeenCalled();
    });

    it('should run WASM client successfully', async () => {
      const lnc = new LNC();

      const mockResult = {
        module: { exports: {} },
        instance: { exports: {} }
      };
      vi.spyOn(lnc, 'preload').mockResolvedValue();

      const instantiateMock = vi.fn().mockResolvedValue({
        exports: {}
      });
      globalThis.WebAssembly.instantiate = instantiateMock;

      globalThis.fetch = vi.fn().mockResolvedValue(new Response());
      vi.spyOn(
        globalThis.WebAssembly,
        'instantiateStreaming'
      ).mockResolvedValue(mockResult);

      wasmGlobal.wasmClientIsReady.mockReturnValue(false);

      await lnc.run();

      expect(instantiateMock).toHaveBeenCalled();
    });

    it('should throw error if WASM instance not found during run', async () => {
      const lnc = new LNC();

      vi.spyOn(lnc, 'preload').mockResolvedValue();

      await expect(lnc.run()).rejects.toThrow("Can't find WASM instance.");
    });

    it('should set up WASM callbacks correctly', async () => {
      const lnc = new LNC();

      globalAccess.clearWasmGlobal('default');

      const mockResult = {
        module: { exports: {} },
        instance: { exports: {} }
      };

      const instantiateMock = vi.fn().mockResolvedValue({
        exports: {}
      });
      globalThis.WebAssembly.instantiate = instantiateMock;

      wasmGlobal.wasmClientIsReady.mockReturnValue(false);
      globalThis.fetch = vi.fn().mockResolvedValue(new Response());
      vi.spyOn(
        globalThis.WebAssembly,
        'instantiateStreaming'
      ).mockResolvedValue(mockResult);

      await lnc.run();

      const namespace = globalAccess.getWasmGlobal('default');
      expect(namespace.onLocalPrivCreate).toBeDefined();
      expect(namespace.onRemoteKeyReceive).toBeDefined();
      expect(namespace.onAuthData).toBeDefined();
    });

    it('should delegate waitTilReady to the underlying WasmManager', async () => {
      const lnc = new LNC();

      const waitSpy = vi
        .spyOn((lnc as any).wasmManager, 'waitTilReady')
        .mockResolvedValue(undefined);

      await lnc.waitTilReady();

      expect(waitSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Status and Permission Getters', () => {
    it('should return true for isReady when WASM is ready', () => {
      const lnc = new LNC();
      wasmGlobal.wasmClientIsReady.mockReturnValue(true);
      expect(lnc.isReady).toBe(true);
    });

    it('should return true for isConnected when connected', () => {
      const lnc = new LNC();
      wasmGlobal.wasmClientIsConnected.mockReturnValue(true);
      expect(lnc.isConnected).toBe(true);
    });

    it('should return undefined for status when WASM not available', () => {
      const lnc = new LNC();
      globalAccess.clearWasmGlobal('default');
      expect(lnc.status).toBeUndefined();
      wasmGlobal = globalAccess.setupWasmGlobal();
    });

    it('should return correct expiry date from WASM', () => {
      const lnc = new LNC();
      const timestamp = Date.now() / 1000;
      wasmGlobal.wasmClientGetExpiry.mockReturnValue(timestamp);
      expect(lnc.expiry).toEqual(new Date(timestamp * 1000));
    });

    it('should return correct status from WASM', () => {
      const lnc = new LNC();
      wasmGlobal.wasmClientStatus.mockReturnValue('connected');
      expect(lnc.status).toBe('connected');
    });

    it('should return correct readOnly status from WASM', () => {
      const lnc = new LNC();
      wasmGlobal.wasmClientIsReadOnly.mockReturnValue(true);
      expect(lnc.isReadOnly).toBe(true);
    });

    it('should return correct permission status from WASM', () => {
      const lnc = new LNC();
      wasmGlobal.wasmClientHasPerms.mockReturnValue(true);
      expect(lnc.hasPerms('test.permission')).toBe(true);
      expect(wasmGlobal.wasmClientHasPerms).toHaveBeenCalledWith(
        'test.permission'
      );
    });
  });

  describe('Connection Management', () => {
    const originalWindow = globalAccess.window;
    const mockWindow = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    } as any;

    beforeEach(() => {
      vi.useFakeTimers();
      globalAccess.window = mockWindow;
    });

    afterEach(() => {
      vi.useRealTimers();
      globalAccess.window = originalWindow;
    });

    it('should connect successfully when not already connected', async () => {
      const lnc = new LNC();

      setTimeout(() => {
        wasmGlobal.wasmClientIsConnected.mockReturnValue(true);
      }, 10);

      const connectPromise = lnc.connect();
      vi.runAllTimers();
      await connectPromise;

      expect(wasmGlobal.wasmClientConnectServer).toHaveBeenCalled();
    });

    it('should pass correct parameters to connectServer', async () => {
      const lnc = new LNC();

      lnc.credentials.serverHost = 'test.host:443';
      lnc.credentials.pairingPhrase = 'test_phrase';
      lnc.credentials.localKey = 'test_local_key';
      lnc.credentials.remoteKey = 'test_remote_key';

      setTimeout(() => {
        wasmGlobal.wasmClientIsConnected.mockReturnValue(true);
      }, 10);

      const connectPromise = lnc.connect();
      vi.runAllTimers();
      await connectPromise;

      expect(wasmGlobal.wasmClientConnectServer).toHaveBeenCalledWith(
        'test.host:443',
        false,
        'test_phrase',
        'test_local_key',
        'test_remote_key'
      );
    });

    it('should add unload event listener in browser environment', async () => {
      const lnc = new LNC();

      setTimeout(() => {
        wasmGlobal.wasmClientIsConnected.mockReturnValue(true);
      }, 10);

      const connectPromise = lnc.connect();
      vi.runAllTimers();
      await connectPromise;

      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'unload',
        wasmGlobal.wasmClientDisconnect
      );
    });

    it('should timeout connection after 20 attempts', async () => {
      const lnc = new LNC();

      const connectPromise = lnc.connect();
      vi.advanceTimersByTime(11 * 1000);

      await expect(connectPromise).rejects.toThrow(
        'Failed to connect the WASM client to the proxy server'
      );
    });

    it('should clear in-memory credentials after successful connection when password is set', async () => {
      const lnc = new LNC();

      lnc.credentials.localKey = 'test_local_key';
      lnc.credentials.remoteKey = 'test_remote_key';
      lnc.credentials.serverHost = 'test.host:443';
      lnc.credentials.pairingPhrase = 'test_phrase';
      lnc.credentials.password = 'test_password';
      lnc.credentials.password = 'test_password';

      const clearSpy = vi.spyOn(lnc.credentials, 'clear');

      setTimeout(() => {
        wasmGlobal.wasmClientIsConnected.mockReturnValue(true);
      }, 10);

      const connectPromise = lnc.connect();
      vi.runAllTimers();
      await connectPromise;

      expect(clearSpy).toHaveBeenCalledWith(true);

      clearSpy.mockRestore();
    });

    it('should disconnect successfully', () => {
      const lnc = new LNC();

      lnc.disconnect();

      expect(wasmGlobal.wasmClientDisconnect).toHaveBeenCalled();
    });
  });

  describe('RPC Communication', () => {
    it('should make RPC request successfully', async () => {
      const lnc = new LNC();

      const testRequest = { field: 'value' };
      const testResponse = { result: 'success' };

      wasmGlobal.wasmClientInvokeRPC.mockImplementation(
        (method, request, callback) => {
          callback(JSON.stringify(testResponse));
        }
      );

      const result = await lnc.request('TestMethod', testRequest);

      expect(result).toEqual(testResponse);
    });

    it('should handle RPC request error', async () => {
      const lnc = new LNC();

      wasmGlobal.wasmClientInvokeRPC.mockImplementation(
        (method, request, callback) => {
          callback('RPC Error');
        }
      );

      await expect(lnc.request('TestMethod')).rejects.toThrow('RPC Error');
    });

    it('should subscribe to RPC stream successfully', () => {
      const lnc = new LNC();

      const testResponse = { result: 'success' };
      const onMessage = vi.fn();

      wasmGlobal.wasmClientInvokeRPC.mockImplementation(
        (method, request, callback) => {
          callback(JSON.stringify(testResponse));
        }
      );

      lnc.subscribe('TestMethod', {}, onMessage);

      expect(onMessage).toHaveBeenCalledWith(testResponse);
    });

    it('should handle subscribe without callbacks', () => {
      const lnc = new LNC();

      wasmGlobal.wasmClientInvokeRPC.mockImplementation(
        (method, request, callback) => {
          callback(JSON.stringify({ result: 'success' }));
        }
      );

      expect(() => {
        lnc.subscribe('TestMethod');
      }).not.toThrow();
    });
  });

  describe('WASM Callback Functions', () => {
    it('provides ConnectionCallbacks that write keys into the credential store', async () => {
      const lnc = new LNC();

      const mockResult = {
        module: { exports: {} },
        instance: { exports: {} }
      };

      globalThis.WebAssembly.instantiate = vi
        .fn()
        .mockResolvedValue({ exports: {} });
      wasmGlobal.wasmClientIsReady.mockReturnValue(false);
      globalThis.fetch = vi.fn().mockResolvedValue(new Response());
      vi.spyOn(
        globalThis.WebAssembly,
        'instantiateStreaming'
      ).mockResolvedValue(mockResult);

      await lnc.run();

      // Get the callback functions from the WASM global
      const wasm = globalAccess.getWasmGlobal('default');

      wasm.onLocalPrivCreate!('test_local_key_hex');
      wasm.onRemoteKeyReceive!('test_remote_key_hex');

      expect(lnc.credentials.localKey).toBe('test_local_key_hex');
      expect(lnc.credentials.remoteKey).toBe('test_remote_key_hex');
    });
  });

  describe('Legacy pairing replacement path', () => {
    it('supports pairing through credentials.pairingPhrase plus connect', async () => {
      vi.useFakeTimers();
      const originalWindow = globalAccess.window;
      globalAccess.window = { addEventListener: vi.fn() } as any;

      const lnc = new LNC();
      lnc.credentials.pairingPhrase = 'phrase';

      setTimeout(() => {
        wasmGlobal.wasmClientIsConnected.mockReturnValue(true);
      }, 10);

      const connectPromise = lnc.connect();
      vi.runAllTimers();
      await connectPromise;

      expect(wasmGlobal.wasmClientConnectServer).toHaveBeenCalled();

      vi.useRealTimers();
      globalAccess.window = originalWindow;
    });
  });
});
