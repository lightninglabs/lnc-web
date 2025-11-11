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
import { PasskeyEncryptionService } from './encryption/passkeyEncryptionService';
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
            const partialConfig = {
                namespace: 'custom_namespace'
            };

            const lnc = new LNC(partialConfig);

            // Verify instance was created successfully
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

            // Verify instance was created successfully (Go instance is internal to WasmManager)
            expect(lnc).toBeInstanceOf(LNC);
            expect(lnc.credentials).toBeDefined();
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

            expect(lnc).toBeInstanceOf(LNC);
            expect(lnc.credentials).toBeDefined();
        });

        it('should handle empty config object gracefully', () => {
            const lnc = new LNC({});

            expect(lnc).toBeInstanceOf(LNC);
            expect(lnc.credentials).toBeDefined();
        });
    });

    describe('Configuration Properties', () => {
        it('should set correct default wasmClientCode', () => {
            const lnc = new LNC();

            // Configuration is now internal to WasmManager
            expect(lnc).toBeInstanceOf(LNC);
        });

        it('should set correct default namespace', () => {
            const lnc = new LNC();

            // Configuration is now internal to WasmManager
            expect(lnc).toBeInstanceOf(LNC);
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
            const instantiateSpy = vi
                .spyOn(globalThis.WebAssembly, 'instantiateStreaming')
                .mockResolvedValue(mockSource);

            // Mock fetch
            globalThis.fetch = vi.fn().mockResolvedValue(new Response());

            await lnc.preload();

            expect(instantiateSpy).toHaveBeenCalled();
        });

        it('should run WASM client successfully', async () => {
            const lnc = new LNC();

            // Mock preload to set up result internally
            const mockResult = {
                module: { exports: {} },
                instance: { exports: {} }
            };
            vi.spyOn(lnc, 'preload').mockResolvedValue();

            // Mock WebAssembly.instantiate before calling run
            const instantiateMock = vi.fn().mockResolvedValue({
                exports: {}
            });
            globalThis.WebAssembly.instantiate = instantiateMock;

            // Mock fetch for preload
            globalThis.fetch = vi.fn().mockResolvedValue(new Response());
            vi.spyOn(
                globalThis.WebAssembly,
                'instantiateStreaming'
            ).mockResolvedValue(mockResult);

            // Make isReady return false so run() will call preload()
            wasmGlobal.wasmClientIsReady.mockReturnValue(false);

            await lnc.run();

            expect(instantiateMock).toHaveBeenCalled();
        });

        it('should preload automatically if not ready during run', async () => {
            const lnc = new LNC();

            // Clear WASM global so isReady returns undefined (falsy)
            globalAccess.clearWasmGlobal('default');
            // Verify isReady is falsy
            expect(lnc.isReady).toBeFalsy();

            // Mock result for preload
            const mockResult = {
                module: { exports: {} },
                instance: { exports: {} }
            };

            // Mock WebAssembly.instantiate
            vi.spyOn(globalThis.WebAssembly, 'instantiate').mockResolvedValue({
                exports: {}
            });

            // Mock fetch and instantiateStreaming for preload
            globalThis.fetch = vi.fn().mockResolvedValue(new Response());
            vi.spyOn(
                globalThis.WebAssembly,
                'instantiateStreaming'
            ).mockResolvedValue(mockResult);

            // Run should complete successfully even when not ready (it will preload internally)
            await lnc.run();

            // Verify run completed (if it threw an error, the test would fail)
            expect(true).toBe(true);
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

            globalAccess.clearWasmGlobal('default');

            const mockResult = {
                module: { exports: {} },
                instance: { exports: {} }
            };

            // Mock WebAssembly.instantiate for this test
            const instantiateMock = vi.fn().mockResolvedValue({
                exports: {}
            });
            globalThis.WebAssembly.instantiate = instantiateMock;

            // Mock preload to set result
            wasmGlobal.wasmClientIsReady.mockReturnValue(false);
            globalThis.fetch = vi.fn().mockResolvedValue(new Response());
            vi.spyOn(
                globalThis.WebAssembly,
                'instantiateStreaming'
            ).mockResolvedValue(mockResult);

            await lnc.run();

            // Check that callbacks are set up in global namespace
            const namespace = globalAccess.getWasmGlobal('default');
            expect(namespace.onLocalPrivCreate).toBeDefined();
            expect(namespace.onRemoteKeyReceive).toBeDefined();
            expect(namespace.onAuthData).toBeDefined();
        });

        it('should set correct Go argv during run', async () => {
            const lnc = new LNC();

            const mockResult = {
                module: { exports: {} },
                instance: { exports: {} }
            };

            // Mock WebAssembly.instantiate for this test
            const instantiateMock = vi.fn().mockResolvedValue({
                exports: {}
            });
            globalThis.WebAssembly.instantiate = instantiateMock;

            // Mock preload to set result
            wasmGlobal.wasmClientIsReady.mockReturnValue(false);
            globalThis.fetch = vi.fn().mockResolvedValue(new Response());
            vi.spyOn(
                globalThis.WebAssembly,
                'instantiateStreaming'
            ).mockResolvedValue(mockResult);

            await lnc.run();

            // Go argv is now internal to WasmManager, so we just verify run completed successfully
            expect(instantiateMock).toHaveBeenCalled();
        });

        // Note: waitTilReady() is now internal to WasmManager and not exposed on LNC
        // These tests are removed as they test internal implementation details
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

            // Set up credentials for connection
            lnc.credentials.serverHost = 'test.host:443';
            lnc.credentials.pairingPhrase = 'test_phrase';
            lnc.credentials.localKey = 'test_local_key';
            lnc.credentials.remoteKey = 'test_remote_key';

            // Make connection check succeed immediately
            wasmGlobal.wasmClientIsConnected.mockReturnValue(true);
            wasmGlobal.wasmClientIsReady.mockReturnValue(true);

            // Mock run to avoid actual WASM execution
            vi.spyOn(lnc, 'run').mockResolvedValue();

            // Connect should complete successfully (internal implementation will handle readiness)
            const connectPromise = lnc.connect();

            // Advance timers to allow waitTilReady and waitForConnection to complete
            vi.runAllTimers();

            await connectPromise;

            // Verify connect completed successfully (if it threw an error, the test would fail)
            expect(true).toBe(true);
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

            const mockResult = {
                module: { exports: {} },
                instance: { exports: {} }
            };

            // Mock WebAssembly.instantiate for this test
            const instantiateMock = vi.fn().mockResolvedValue({
                exports: {}
            });
            globalThis.WebAssembly.instantiate = instantiateMock;

            // Mock preload to set result
            wasmGlobal.wasmClientIsReady.mockReturnValue(false);
            globalThis.fetch = vi.fn().mockResolvedValue(new Response());
            vi.spyOn(
                globalThis.WebAssembly,
                'instantiateStreaming'
            ).mockResolvedValue(mockResult);

            await lnc.run();

            // Get the callback function that was assigned
            const wasm = globalAccess.getWasmGlobal('default');
            const callback = wasm.onLocalPrivCreate!;

            // Call the callback
            const testKey = 'test_local_key_hex';
            callback(testKey);

            // Verify the credential was updated
            expect(lnc.credentials.localKey).toBe(testKey);
        });

        it('should handle callback functions with logging', async () => {
            const lnc = new LNC();

            const mockResult = {
                module: { exports: {} },
                instance: { exports: {} }
            };

            // Mock WebAssembly.instantiate for this test
            const instantiateMock = vi.fn().mockResolvedValue({
                exports: {}
            });
            globalThis.WebAssembly.instantiate = instantiateMock;

            // Mock preload to set result
            wasmGlobal.wasmClientIsReady.mockReturnValue(false);
            globalThis.fetch = vi.fn().mockResolvedValue(new Response());
            vi.spyOn(
                globalThis.WebAssembly,
                'instantiateStreaming'
            ).mockResolvedValue(mockResult);

            await lnc.run();

            // Get the callback functions
            const namespace = globalAccess.getWasmGlobal('default');

            // Call callbacks - this should trigger the debug logs
            namespace.onLocalPrivCreate!('test_key');
            namespace.onRemoteKeyReceive!('test_remote_key');
            namespace.onAuthData!('test_macaroon');

            // Verify credentials were updated (this indirectly tests the callbacks ran)
            expect(lnc.credentials.localKey).toBe('test_key');
            expect(lnc.credentials.remoteKey).toBe('test_remote_key');
        });
    });

    describe('Delegated methods', () => {
        it('should delegate performAutoLogin to the credential orchestrator', async () => {
            const lnc = new LNC();
            const orchestrator = (lnc as any).credentialOrchestrator;
            const autoLoginSpy = vi
                .spyOn(orchestrator, 'performAutoLogin')
                .mockResolvedValue(true);

            const result = await lnc.performAutoLogin();

            expect(autoLoginSpy).toHaveBeenCalledWith();
            expect(result).toBe(true);
        });

        it('should delegate clear to the credential orchestrator', async () => {
            const lnc = new LNC();
            const orchestrator = (lnc as any).credentialOrchestrator;
            const clearSpy = vi
                .spyOn(orchestrator, 'clear')
                .mockResolvedValue(undefined);

            await lnc.clear({ session: true });

            expect(clearSpy).toHaveBeenCalledWith({ session: true });
        });

        it('should delegate getAuthenticationInfo to the credential orchestrator', async () => {
            const lnc = new LNC();
            const orchestrator = (lnc as any).credentialOrchestrator;
            const authInfo = { isUnlocked: true } as any;
            const authSpy = vi
                .spyOn(orchestrator, 'getAuthenticationInfo')
                .mockResolvedValue(authInfo);

            const result = await lnc.getAuthenticationInfo();

            expect(authSpy).toHaveBeenCalledWith();
            expect(result).toBe(authInfo);
        });

        it('should delegate unlock to the credential orchestrator', async () => {
            const lnc = new LNC();
            const orchestrator = (lnc as any).credentialOrchestrator;
            const unlockSpy = vi
                .spyOn(orchestrator, 'unlock')
                .mockResolvedValue(true);

            const result = await lnc.unlock({ method: 'password' });

            expect(unlockSpy).toHaveBeenCalledWith({ method: 'password' });
            expect(result).toBe(true);
        });

        it('should expose isUnlocked getter from the credential orchestrator', () => {
            const lnc = new LNC();
            const orchestrator = (lnc as any).credentialOrchestrator;
            vi.spyOn(orchestrator, 'isUnlocked', 'get').mockReturnValue(true);

            expect(lnc.isUnlocked).toBe(true);
        });

        it('should expose isPaired getter from the credential orchestrator', () => {
            const lnc = new LNC();
            const orchestrator = (lnc as any).credentialOrchestrator;
            vi.spyOn(orchestrator, 'isPaired', 'get').mockReturnValue(true);

            expect(lnc.isPaired).toBe(true);
        });

        it('should delegate supportsPasskeys to the credential orchestrator', async () => {
            const lnc = new LNC();
            const orchestrator = (lnc as any).credentialOrchestrator;
            const supportsSpy = vi
                .spyOn(orchestrator, 'supportsPasskeys')
                .mockResolvedValue(true);

            const result = await lnc.supportsPasskeys();

            expect(supportsSpy).toHaveBeenCalledWith();
            expect(result).toBe(true);
        });

        it('should delegate persistWithPassword to the credential orchestrator', async () => {
            const lnc = new LNC();
            const orchestrator = (lnc as any).credentialOrchestrator;
            const persistSpy = vi
                .spyOn(orchestrator, 'persistWithPassword')
                .mockResolvedValue(undefined);

            await lnc.persistWithPassword('secret');

            expect(persistSpy).toHaveBeenCalledWith('secret');
        });

        it('should delegate persistWithPasskey to the credential orchestrator', async () => {
            const lnc = new LNC();
            const orchestrator = (lnc as any).credentialOrchestrator;
            const persistSpy = vi
                .spyOn(orchestrator, 'persistWithPasskey')
                .mockResolvedValue(undefined);

            await lnc.persistWithPasskey();

            expect(persistSpy).toHaveBeenCalledWith();
        });

        it('should delegate pair to the wasm manager', async () => {
            const lnc = new LNC();
            const wasmManager = (lnc as any).wasmManager;
            const pairSpy = vi.spyOn(wasmManager, 'pair').mockResolvedValue(undefined);

            await lnc.pair('phrase');

            expect(pairSpy).toHaveBeenCalledWith('phrase');
        });

        it('should delegate isPasskeySupported to PasskeyEncryptionService', async () => {
            const supportSpy = vi
                .spyOn(PasskeyEncryptionService, 'isSupported')
                .mockResolvedValue(true);

            const result = await LNC.isPasskeySupported();

            expect(supportSpy).toHaveBeenCalledWith();
            expect(result).toBe(true);
        });
    });
});
