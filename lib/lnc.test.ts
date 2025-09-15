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
import LNC, { DEFAULT_CONFIG } from './lnc';
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
            expect(lnc._wasmClientCode).toBe(DEFAULT_CONFIG.wasmClientCode);
            expect(lnc._namespace).toBe('default');
            expect(lnc.credentials).toBeDefined();
            expect(lnc.go).toBeDefined();
            expect(lnc.lnd).toBeDefined();
            expect(lnc.loop).toBeDefined();
            expect(lnc.pool).toBeDefined();
            expect(lnc.faraday).toBeDefined();
            expect(lnc.tapd).toBeDefined();
            expect(lnc.lit).toBeDefined();
        });

        it('should merge custom config with defaults', () => {
            const partialConfig = {
                namespace: 'custom_namespace'
            };

            const lnc = new LNC(partialConfig);

            // Custom value should be used
            expect(lnc._namespace).toBe('custom_namespace');
            // Default values should be preserved
            expect(lnc._wasmClientCode).toBe(DEFAULT_CONFIG.wasmClientCode);
        });

        it('should create credential store with correct namespace and password', () => {
            const config = {
                namespace: 'test_namespace',
                password: testData.password
            };

            const lnc = new LNC(config);

            expect(lnc.credentials).toBeDefined();
            // The credential store should have been created with the namespace and password
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

            const config = {
                credentialStore: customCredentialStore
            };

            const lnc = new LNC(config);

            expect(lnc.credentials).toBe(customCredentialStore);
        });

        it('should set serverHost from config if not already paired', () => {
            const config = {
                serverHost: 'custom.server:9000',
                namespace: 'test'
            };

            // Pre-populate with non-paired data
            globalThis.localStorage.setItem(
                'lnc-web:test',
                JSON.stringify({
                    salt: 'salt',
                    cipher: 'cipher',
                    serverHost: 'existing.server:443',
                    remoteKey: '', // No remote key = not paired
                    pairingPhrase: '',
                    localKey: ''
                })
            );

            const lnc = new LNC(config);

            // Server host should be set from config since not paired
            expect(lnc.credentials.serverHost).toBe('custom.server:9000');
        });

        it('should set pairingPhrase on credential store if provided', () => {
            const config = {
                pairingPhrase: 'test_pairing_phrase',
                namespace: 'test'
            };

            const lnc = new LNC(config);

            expect(lnc.credentials.pairingPhrase).toBe('test_pairing_phrase');
        });

        it('should create Go instance correctly', () => {
            const lnc = new LNC();

            expect(lnc.go).toBeDefined();
            expect(typeof lnc.go).toBe('object');
            expect(lnc.go.importObject).toBeDefined();
        });

        it('should initialize all API instances', () => {
            const lnc = new LNC();

            // All API instances should be created
            expect(lnc.lnd).toBeDefined();
            expect(lnc.loop).toBeDefined();
            expect(lnc.pool).toBeDefined();
            expect(lnc.faraday).toBeDefined();
            expect(lnc.tapd).toBeDefined();
            expect(lnc.lit).toBeDefined();
        });

        it('should handle undefined config gracefully', () => {
            const lnc = new LNC(undefined);

            expect(lnc._wasmClientCode).toBe(DEFAULT_CONFIG.wasmClientCode);
            expect(lnc._namespace).toBe(DEFAULT_CONFIG.namespace);
        });

        it('should handle empty config object gracefully', () => {
            const lnc = new LNC({});

            expect(lnc._wasmClientCode).toBe(DEFAULT_CONFIG.wasmClientCode);
            expect(lnc._namespace).toBe(DEFAULT_CONFIG.namespace);
        });
    });

    describe('Configuration Properties', () => {
        it('should set correct default wasmClientCode', () => {
            const lnc = new LNC();

            expect(lnc._wasmClientCode).toBe(DEFAULT_CONFIG.wasmClientCode);
        });

        it('should set correct default namespace', () => {
            const lnc = new LNC();

            expect(lnc._namespace).toBe('default');
        });
    });

    describe('WebAssembly Integration', () => {
        it('should preload WASM client successfully', async () => {
            const lnc = new LNC();

            // Mock WebAssembly.instantiateStreaming
            const mockSource = {
                module: { exports: {} },
                instance: { exports: {} }
            };
            vi.spyOn(
                globalThis.WebAssembly,
                'instantiateStreaming'
            ).mockResolvedValue(mockSource);

            // Mock fetch
            globalThis.fetch = vi.fn().mockResolvedValue(new Response());

            await lnc.preload();

            expect(
                globalThis.WebAssembly.instantiateStreaming
            ).toHaveBeenCalledWith(expect.any(Promise), lnc.go.importObject);
            expect(lnc.result).toEqual(mockSource);
        });

        it('should run WASM client successfully', async () => {
            const lnc = new LNC();

            // Set up WASM result first
            lnc.result = {
                module: { exports: {} },
                instance: { exports: {} }
            };

            // Mock WebAssembly.instantiate before calling run
            const instantiateMock = vi.fn().mockResolvedValue({
                exports: {}
            });
            globalThis.WebAssembly.instantiate = instantiateMock;

            await lnc.run();

            expect(lnc.go.run).toHaveBeenCalledWith(lnc.result.instance);
            expect(instantiateMock).toHaveBeenCalledWith(
                lnc.result.module,
                lnc.go.importObject
            );
        });

        it('should preload automatically if not ready during run', async () => {
            const lnc = new LNC();

            wasmGlobal.wasmClientIsReady.mockReturnValue(false);

            // Mock preload to set result
            const preloadSpy = vi.spyOn(lnc, 'preload').mockResolvedValue();
            lnc.result = {
                module: { exports: {} },
                instance: { exports: {} }
            };

            // Mock WebAssembly.instantiate
            vi.spyOn(globalThis.WebAssembly, 'instantiate').mockResolvedValue({
                exports: {}
            });

            await lnc.run();

            expect(preloadSpy).toHaveBeenCalled();
        });

        it('should throw error if WASM instance not found during run', async () => {
            const lnc = new LNC();

            // Mock the preload to avoid network errors and ensure no result
            const preloadSpy = vi.spyOn(lnc, 'preload').mockResolvedValue();

            await expect(lnc.run()).rejects.toThrow(
                "Can't find WASM instance."
            );

            preloadSpy.mockRestore();
        });

        it('should set up WASM callbacks correctly', async () => {
            const lnc = new LNC();

            globalAccess.clearWasmGlobal(lnc._namespace);

            lnc.result = {
                module: { exports: {} },
                instance: { exports: {} }
            };

            // Mock WebAssembly.instantiate for this test
            const instantiateMock = vi.fn().mockResolvedValue({
                exports: {}
            });
            globalThis.WebAssembly.instantiate = instantiateMock;

            await lnc.run();

            // Check that callbacks are set up in global namespace
            const namespace = globalAccess.getWasmGlobal(lnc._namespace);
            expect(namespace.onLocalPrivCreate).toBeDefined();
            expect(namespace.onRemoteKeyReceive).toBeDefined();
            expect(namespace.onAuthData).toBeDefined();
        });

        it('should set correct Go argv during run', async () => {
            const lnc = new LNC();

            lnc.result = {
                module: { exports: {} },
                instance: { exports: {} }
            };

            // Mock WebAssembly.instantiate for this test
            const instantiateMock = vi.fn().mockResolvedValue({
                exports: {}
            });
            globalThis.WebAssembly.instantiate = instantiateMock;

            await lnc.run();

            expect(lnc.go.argv).toEqual([
                'wasm-client',
                '--debuglevel=debug,GOBN=info,GRPC=info',
                '--namespace=default',
                '--onlocalprivcreate=default.onLocalPrivCreate',
                '--onremotekeyreceive=default.onRemoteKeyReceive',
                '--onauthdata=default.onAuthData'
            ]);
        });

        it('should wait until WASM client is ready successfully', async () => {
            vi.useFakeTimers();
            const lnc = new LNC();

            // Set up WASM global
            // WASM global already set up in beforeEach
            wasmGlobal.wasmClientIsReady.mockReturnValue(false);

            // Mock successful ready state after delay
            setTimeout(() => {
                wasmGlobal.wasmClientIsReady.mockReturnValue(true);
            }, 10);

            const waitPromise = lnc.waitTilReady();
            vi.runAllTimers();

            await waitPromise;

            expect(wasmGlobal.wasmClientIsReady).toHaveBeenCalled();
            vi.useRealTimers();
        });

        it('should timeout if WASM client never becomes ready', async () => {
            vi.useFakeTimers();
            const lnc = new LNC();

            // Set up WASM global that never becomes ready
            // WASM global already set up in beforeEach
            wasmGlobal.wasmClientIsReady.mockReturnValue(false);

            const waitPromise = lnc.waitTilReady();

            // Fast-forward past the timeout (20 * 500ms = 10 seconds)
            vi.advanceTimersByTime(11 * 1000);

            await expect(waitPromise).rejects.toThrow(
                'Failed to load the WASM client'
            );
            vi.useRealTimers();
        });

        it('should handle undefined WASM global gracefully', async () => {
            vi.useFakeTimers();
            const lnc = new LNC();

            // Don't set up WASM global - should timeout
            globalAccess.clearWasmGlobal('default');

            const waitPromise = lnc.waitTilReady();

            // Fast-forward past the timeout
            vi.advanceTimersByTime(11 * 1000);

            await expect(waitPromise).rejects.toThrow(
                'Failed to load the WASM client'
            );
            vi.useRealTimers();
        });

        it('should handle WASM global without wasmClientIsReady method', async () => {
            vi.useFakeTimers();
            const lnc = new LNC();

            // Set up incomplete WASM global
            globalAccess.setWasmGlobal('default', {} as any);

            const waitPromise = lnc.waitTilReady();

            // Fast-forward past the timeout
            vi.advanceTimersByTime(11 * 1000);

            await expect(waitPromise).rejects.toThrow(
                'Failed to load the WASM client'
            );
            vi.useRealTimers();
        });

        it('should check ready status multiple times before succeeding', async () => {
            vi.useFakeTimers();
            const lnc = new LNC();

            // Mock the ready state to become true after several checks
            let callCount = 0;
            wasmGlobal.wasmClientIsReady.mockImplementation(() => {
                callCount++;
                return callCount > 3; // Become ready after 4 calls
            });

            const waitPromise = lnc.waitTilReady();

            // Advance time to allow multiple checks
            vi.advanceTimersByTime(2000); // 4 * 500ms intervals

            await waitPromise;

            expect(callCount).toBeGreaterThan(3);
            vi.useRealTimers();
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

            // Clean up the WASM global for this test
            globalAccess.clearWasmGlobal('default');

            expect(lnc.status).toBeUndefined();

            // Restore for other tests
            wasmGlobal = globalAccess.setupWasmGlobal();
        });

        it('should return undefined for expiry when WASM not available', () => {
            const lnc = new LNC();

            // Clean up the WASM global for this test
            globalAccess.clearWasmGlobal('default');

            expect(lnc.expiry).toBeUndefined();

            // Restore for other tests
            wasmGlobal = globalAccess.setupWasmGlobal();
        });

        it('should return correct expiry date from WASM', () => {
            const lnc = new LNC();
            const timestamp = Date.now() / 1000;

            wasmGlobal.wasmClientGetExpiry.mockReturnValue(timestamp);

            const expectedDate = new Date(timestamp * 1000);
            expect(lnc.expiry).toEqual(expectedDate);
        });

        it('should return undefined for hasPerms when WASM not available', () => {
            const lnc = new LNC();

            // Clean up the WASM global for this test
            globalAccess.clearWasmGlobal('default');

            expect(lnc.hasPerms('test.permission')).toBeUndefined();

            // Restore for other tests
            wasmGlobal = globalAccess.setupWasmGlobal();
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
        const mockWindow = { addEventListener: vi.fn() } as any;

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

            // Mock successful connection after delay
            setTimeout(() => {
                wasmGlobal.wasmClientIsConnected.mockReturnValue(true);
            }, 10);

            const connectPromise = lnc.connect();

            // Advance timers to make the connection succeed immediately
            vi.runAllTimers();

            await connectPromise;

            expect(wasmGlobal.wasmClientConnectServer).toHaveBeenCalled();
        });

        it('should run WASM if not ready during connect', async () => {
            const lnc = new LNC();

            // Override default setup for this test - WASM not ready
            wasmGlobal.wasmClientIsReady.mockReturnValue(false);

            // Mock run and waitTilReady
            const runSpy = vi
                .spyOn(lnc, 'run')
                .mockImplementation(() => Promise.resolve());

            let waitRan = false;
            const waitSpy = vi
                .spyOn(lnc, 'waitTilReady')
                .mockImplementation(() => {
                    waitRan = true;
                    return Promise.resolve();
                });

            const connectPromise = lnc.connect();

            // Wait for the waitTilReady promise to resolve to ensure the `runAllTimers`
            // call below will exhaust all setInterval callbacks.
            await vi.waitFor(() => {
                expect(waitRan).toBe(true);
            });

            // Mock successful connection after delay
            setTimeout(() => {
                wasmGlobal.wasmClientIsConnected.mockReturnValue(true);
            }, 100);

            vi.runAllTimers();

            await connectPromise;

            expect(runSpy).toHaveBeenCalled();
            expect(waitSpy).toHaveBeenCalled();
        });

        it('should pass correct parameters to connectServer', async () => {
            const lnc = new LNC();

            // Set up credentials
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

            // Fast-forward past the timeout (20 * 500ms = 10 seconds)
            vi.advanceTimersByTime(11 * 1000);

            await expect(connectPromise).rejects.toThrow(
                'Failed to connect the WASM client to the proxy server'
            );
        });

        it('should handle connection attempts that exceed counter limit', async () => {
            const lnc = new LNC();

            let connectionCheckCount = 0;
            wasmGlobal.wasmClientIsConnected.mockImplementation(() => {
                connectionCheckCount++;
                return false; // Always return false
            });

            const connectPromise = lnc.connect();

            // Advance timers to trigger all 20 attempts
            vi.advanceTimersByTime(11 * 1000);

            await expect(connectPromise).rejects.toThrow();

            // Verify we made exactly 22 connection checks
            expect(connectionCheckCount).toBe(22);
        });

        it('should handle connection when window object is undefined', async () => {
            const lnc = new LNC();

            // Mock window as undefined to simulate non-browser environment
            globalAccess.window = undefined as any;

            // Mock successful connection
            setTimeout(() => {
                wasmGlobal.wasmClientIsConnected.mockReturnValue(true);
            }, 10);

            const connectPromise = lnc.connect();
            vi.runAllTimers();
            await connectPromise;

            // Verify connection still works without window
            expect(wasmGlobal.wasmClientConnectServer).toHaveBeenCalled();

            // Cleanup
            globalAccess.window = originalWindow;
        });

        it('should clear in-memory credentials after successful connection when password is set', async () => {
            const lnc = new LNC();

            // Set up credentials with password to encrypt the data in localStorage
            lnc.credentials.localKey = 'test_local_key';
            lnc.credentials.remoteKey = 'test_remote_key';
            lnc.credentials.serverHost = 'test.host:443';
            lnc.credentials.pairingPhrase = 'test_phrase';
            lnc.credentials.password = 'test_password';

            // Set the password again to the same value to decrypt the data from storage
            // and set the password in memory
            lnc.credentials.password = 'test_password';

            // Mock clear method
            const clearSpy = vi.spyOn(lnc.credentials, 'clear');

            // Mock successful connection after delay
            setTimeout(() => {
                wasmGlobal.wasmClientIsConnected.mockReturnValue(true);
            }, 10);

            const connectPromise = lnc.connect();
            vi.runAllTimers();
            await connectPromise;

            // Verify clear was called with memoryOnly=true
            expect(clearSpy).toHaveBeenCalledWith(true);

            // Cleanup
            globalAccess.window = originalWindow;
            clearSpy.mockRestore();
        });

        it('should clear credentials when password is truthy', async () => {
            const lnc = new LNC();

            // Set up credentials with password to encrypt the data in localStorage
            lnc.credentials.localKey = 'test_local_key';
            lnc.credentials.remoteKey = 'test_remote_key';
            lnc.credentials.serverHost = 'test.host:443';
            lnc.credentials.pairingPhrase = 'test_phrase';
            lnc.credentials.password = 'test_password';

            // Set the password again to the same value to decrypt the data from storage
            // and set the password in memory
            lnc.credentials.password = 'test_password';

            // Mock the clear method on the credential store instance
            const clearSpy = vi.spyOn(lnc.credentials, 'clear');

            // Mock successful connection
            setTimeout(() => {
                wasmGlobal.wasmClientIsConnected.mockReturnValue(true);
            }, 10);

            const connectPromise = lnc.connect();
            vi.runAllTimers();
            await connectPromise;

            // Verify clear was called
            expect(clearSpy).toHaveBeenCalledWith(true);

            // Cleanup
            globalAccess.window = originalWindow;
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
            expect(wasmGlobal.wasmClientInvokeRPC).toHaveBeenCalledWith(
                'TestMethod',
                JSON.stringify(testRequest),
                expect.any(Function)
            );
        });

        it('should convert snake_case to camelCase in RPC response', async () => {
            const lnc = new LNC();

            const snakeResponse = {
                snake_field: 'value',
                nested: { another_field: 'nested' }
            };
            const camelResponse = {
                snakeField: 'value',
                nested: { anotherField: 'nested' }
            };

            wasmGlobal.wasmClientInvokeRPC.mockImplementation(
                (method, request, callback) => {
                    callback(JSON.stringify(snakeResponse));
                }
            );

            const result = await lnc.request('TestMethod');

            expect(result).toEqual(camelResponse);
        });

        it('should handle RPC request error', async () => {
            const lnc = new LNC();

            const errorMessage = 'RPC Error';

            wasmGlobal.wasmClientInvokeRPC.mockImplementation(
                (method, request, callback) => {
                    callback(errorMessage);
                }
            );

            await expect(lnc.request('TestMethod')).rejects.toThrow(
                errorMessage
            );
        });

        it('should handle malformed JSON in RPC response', async () => {
            const lnc = new LNC();

            const malformedResponse = '{ invalid json }';

            wasmGlobal.wasmClientInvokeRPC.mockImplementation(
                (method, request, callback) => {
                    callback(malformedResponse);
                }
            );

            await expect(lnc.request('TestMethod')).rejects.toThrow(
                malformedResponse
            );
        });

        it('should subscribe to RPC stream successfully', () => {
            const lnc = new LNC();

            const testRequest = { field: 'value' };
            const testResponse = { result: 'success' };
            const onMessage = vi.fn();
            const onError = vi.fn();

            wasmGlobal.wasmClientInvokeRPC.mockImplementation(
                (method, request, callback) => {
                    callback(JSON.stringify(testResponse));
                }
            );

            lnc.subscribe('TestMethod', testRequest, onMessage, onError);

            expect(wasmGlobal.wasmClientInvokeRPC).toHaveBeenCalledWith(
                'TestMethod',
                JSON.stringify(testRequest),
                expect.any(Function)
            );
            expect(onMessage).toHaveBeenCalledWith(testResponse);
        });

        it('should handle subscribe error', () => {
            const lnc = new LNC();

            const errorMessage = 'Subscribe Error';
            const onError = vi.fn();

            wasmGlobal.wasmClientInvokeRPC.mockImplementation(
                (method, request, callback) => {
                    callback(errorMessage);
                }
            );

            lnc.subscribe('TestMethod', {}, undefined, onError);

            expect(onError).toHaveBeenCalledWith(expect.any(Error));
            expect(onError.mock.calls[0][0].message).toBe(errorMessage);
        });

        it('should handle subscribe without callbacks', () => {
            const lnc = new LNC();

            const testResponse = { result: 'success' };

            wasmGlobal.wasmClientInvokeRPC.mockImplementation(
                (method, request, callback) => {
                    callback(JSON.stringify(testResponse));
                }
            );

            // Should not throw when no callbacks provided
            expect(() => {
                lnc.subscribe('TestMethod');
            }).not.toThrow();
        });
    });

    describe('WASM Callback Functions', () => {
        it('should call onLocalPrivCreate callback and update credentials', async () => {
            const lnc = new LNC();

            lnc.result = {
                module: { exports: {} },
                instance: { exports: {} }
            };

            // Mock WebAssembly.instantiate for this test
            const instantiateMock = vi.fn().mockResolvedValue({
                exports: {}
            });
            globalThis.WebAssembly.instantiate = instantiateMock;

            await lnc.run();

            // Get the callback function that was assigned
            const wasm = globalAccess.getWasmGlobal(lnc._namespace);
            const callback = wasm.onLocalPrivCreate!;

            // Call the callback
            const testKey = 'test_local_key_hex';
            callback(testKey);

            // Verify the credential was updated
            expect(lnc.credentials.localKey).toBe(testKey);
        });

        it('should handle callback functions with logging', async () => {
            const lnc = new LNC();

            lnc.result = {
                module: { exports: {} },
                instance: { exports: {} }
            };

            // Mock WebAssembly.instantiate for this test
            const instantiateMock = vi.fn().mockResolvedValue({
                exports: {}
            });
            globalThis.WebAssembly.instantiate = instantiateMock;

            await lnc.run();

            // Get the callback functions
            const namespace = globalAccess.getWasmGlobal(lnc._namespace);

            // Call callbacks - this should trigger the debug logs
            namespace.onLocalPrivCreate!('test_key');
            namespace.onRemoteKeyReceive!('test_remote_key');
            namespace.onAuthData!('test_macaroon');

            // Verify credentials were updated (this indirectly tests the callbacks ran)
            expect(lnc.credentials.localKey).toBe('test_key');
            expect(lnc.credentials.remoteKey).toBe('test_remote_key');
        });
    });
});
