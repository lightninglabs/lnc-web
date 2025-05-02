import {
    FaradayApi,
    LitApi,
    LndApi,
    LoopApi,
    PoolApi,
    snakeKeysToCamel,
    TaprootAssetsApi
} from '@lightninglabs/lnc-core';
import { createRpc } from './api/createRpc';
import { CredentialStore, LncConfig, WasmGlobal } from './types/lnc';
import LncCredentialStore from './util/credentialStore';
import { wasmLog as log } from './util/log';

// Define a type for the pending call structure
type PendingMcpCall = {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    // Consider adding sessionID here for more robust cleanup:
    // sessionID: string;
};

export default class LNC {
    go: any;
    result?: {
        module: WebAssembly.Module;
        instance: WebAssembly.Instance;
    };

    _wasmClientCode: any;
    _namespace: string;
    credentials: CredentialStore;

    // Add a map to store pending calls, keyed by callID
    private pendingMcpCalls: Map<string, PendingMcpCall> = new Map();

    // Need to store references to the original Go functions if we override them
    private originalDeliverMCPResult: Function | null = null;
    private originalDeliverMCPError: Function | null = null;

    lnd: LndApi;
    loop: LoopApi;
    pool: PoolApi;
    faraday: FaradayApi;
    tapd: TaprootAssetsApi;
    lit: LitApi;
    constructor(lncConfig?: LncConfig) {
        console.log('lncConfig', lncConfig);
        // merge the passed in config with the defaults

        /** The default values for the LncConfig options */
        const DEFAULT_CONFIG = {
            wasmClientCode: '../public/wasm-client.wasm',
            namespace: 'default',
            serverHost: 'localhost:11110'
        } as Required<LncConfig>;

        const config = Object.assign({}, DEFAULT_CONFIG, lncConfig);

        this._wasmClientCode = config.wasmClientCode;
        this._namespace = config.namespace;

        if (config.credentialStore) {
            this.credentials = config.credentialStore;
        } else {
            this.credentials = new LncCredentialStore(
                config.namespace,
                config.password
            );
            // don't overwrite an existing serverHost if we're already paired
            if (!this.credentials.isPaired)
                this.credentials.serverHost = config.serverHost;
            if (config.pairingPhrase)
                this.credentials.pairingPhrase = config.pairingPhrase;
        }

        // TODO: pull Go off of the global state
        const g = global || window || self;
        this.go = new g.Go();

        this.lnd = new LndApi(createRpc, this);
        this.loop = new LoopApi(createRpc, this);
        this.pool = new PoolApi(createRpc, this);
        this.faraday = new FaradayApi(createRpc, this);
        this.tapd = new TaprootAssetsApi(createRpc, this);
        this.lit = new LitApi(createRpc, this);
    }

    private get wasm(): WasmGlobal {
        return (globalThis as any)[this._namespace];
    }

    private set wasm(value: any) {
        (globalThis as any)[this._namespace] = value;
    }

    get isReady() {
        return (
            this.wasm &&
            this.wasm.wasmClientIsReady &&
            this.wasm.wasmClientIsReady()
        );
    }

    get isConnected() {
        return (
            this.wasm &&
            this.wasm.wasmClientIsConnected &&
            this.wasm.wasmClientIsConnected()
        );
    }

    get status() {
        return (
            this.wasm &&
            this.wasm.wasmClientStatus &&
            this.wasm.wasmClientStatus()
        );
    }

    get expiry(): Date {
        return (
            this.wasm &&
            this.wasm.wasmClientGetExpiry &&
            new Date(this.wasm.wasmClientGetExpiry() * 1000)
        );
    }

    get isReadOnly() {
        return (
            this.wasm &&
            this.wasm.wasmClientIsReadOnly &&
            this.wasm.wasmClientIsReadOnly()
        );
    }

    hasPerms(permission: string) {
        return (
            this.wasm &&
            this.wasm.wasmClientHasPerms &&
            this.wasm.wasmClientHasPerms(permission)
        );
    }

    /**
     * Downloads the WASM client binary
     */
    async preload() {
        this.result = await WebAssembly.instantiateStreaming(
            fetch(this._wasmClientCode),
            this.go.importObject
        );
        log.info('downloaded WASM file');
    }

    /**
     * Loads keys from storage and runs the Wasm client binary
     */
    async run() {
        // make sure the WASM client binary is downloaded first
        if (!this.isReady) await this.preload();

        // create the namespace object in the global scope if it doesn't exist
        // so that we can assign the WASM callbacks to it
        if (typeof this.wasm !== 'object') {
            this.wasm = {};
        }

        // assign the WASM callbacks to the namespace object if they haven't
        // already been assigned by the consuming app
        if (!this.wasm.onLocalPrivCreate) {
            this.wasm.onLocalPrivCreate = (keyHex: string) => {
                log.debug('local private key created: ' + keyHex);
                this.credentials.localKey = keyHex;
            };
        }
        if (!this.wasm.onRemoteKeyReceive) {
            this.wasm.onRemoteKeyReceive = (keyHex: string) => {
                log.debug('remote key received: ' + keyHex);
                this.credentials.remoteKey = keyHex;
            };
        }
        if (!this.wasm.onAuthData) {
            this.wasm.onAuthData = (keyHex: string) => {
                log.debug('auth data received: ' + keyHex);
            };
        }

        this.go.argv = [
            'wasm-client',
            '--debuglevel=debug,GOBN=info,GRPC=info',
            '--namespace=' + this._namespace,
            `--onlocalprivcreate=${this._namespace}.onLocalPrivCreate`,
            `--onremotekeyreceive=${this._namespace}.onRemoteKeyReceive`,
            `--onauthdata=${this._namespace}.onAuthData`
        ];

        if (this.result) {
            this.go.run(this.result.instance);
            await WebAssembly.instantiate(
                this.result.module,
                this.go.importObject
            );
        } else {
            throw new Error("Can't find WASM instance.");
        }
    }

    /**
     * Connects to the LNC proxy server
     * @returns a promise that resolves when the connection is established
     */
    async connect() {
        // do not attempt to connect multiple times
        if (this.isConnected) return;

        // ensure the WASM binary is loaded
        if (!this.isReady) {
            await this.run();
            await this.waitTilReady();
        }

        const { pairingPhrase, localKey, remoteKey, serverHost } =
            this.credentials;

        // connect to the server
        this.wasm.wasmClientConnectServer(
            serverHost,
            false,
            pairingPhrase,
            localKey,
            remoteKey
        );

        // add an event listener to disconnect if the page is unloaded
        if (typeof window !== 'undefined') {
            window.addEventListener('unload', this.wasm.wasmClientDisconnect);
        } else {
            log.info('No unload event listener added. window is not available');
        }

        // repeatedly check if the connection was successful
        return new Promise<void>((resolve, reject) => {
            let counter = 0;
            const interval = setInterval(() => {
                counter++;
                if (this.isConnected) {
                    clearInterval(interval);
                    resolve();
                    log.info('The WASM client is connected to the server');

                    // clear the in-memory credentials after connecting if the
                    // credentials are persisted in local storage
                    if (this.credentials.password) {
                        this.credentials.clear(true);
                    }
                } else if (counter > 20) {
                    clearInterval(interval);
                    reject(
                        new Error(
                            'Failed to connect the WASM client to the proxy server'
                        )
                    );
                }
            }, 500);
        });
    }

    /**
     * Disconnects from the proxy server
     */
    disconnect() {
        this.wasm.wasmClientDisconnect();
    }

    /**
     * Waits until the WASM client is executed and ready to accept connection info
     */
    async waitTilReady() {
        return new Promise<void>((resolve, reject) => {
            let counter = 0;
            const interval = setInterval(() => {
                counter++;
                if (this.isReady) {
                    clearInterval(interval);
                    resolve();
                    log.info('The WASM client is ready');
                } else if (counter > 20) {
                    clearInterval(interval);
                    reject(new Error('Failed to load the WASM client'));
                }
            }, 500);
        });
    }

    /**
     * Emulates a GRPC request but uses the WASM client instead to communicate with the LND node
     * @param method the GRPC method to call on the service
     * @param request The GRPC request message to send
     */
    request<TRes>(method: string, request?: object): Promise<TRes> {
        return new Promise((resolve, reject) => {
            log.debug(`${method} request`, request);
            const reqJSON = JSON.stringify(request || {});
            this.wasm.wasmClientInvokeRPC(
                method,
                reqJSON,
                (response: string) => {
                    try {
                        const rawRes = JSON.parse(response);
                        // log.debug(`${method} raw response`, rawRes);
                        const res = snakeKeysToCamel(rawRes);
                        log.debug(`${method} response`, res);
                        resolve(res as TRes);
                    } catch (error) {
                        log.debug(`${method} raw response`, response);
                        reject(new Error(response));
                        return;
                    }
                }
            );
        });
    }

    /**
     * Subscribes to a GRPC server-streaming endpoint and executes the `onMessage` handler
     * when a new message is received from the server
     * @param method the GRPC method to call on the service
     * @param request the GRPC request message to send
     * @param onMessage the callback function to execute when a new message is received
     * @param onError the callback function to execute when an error is received
     */
    subscribe<TRes>(
        method: string,
        request?: object,
        onMessage?: (res: TRes) => void,
        onError?: (res: Error) => void
    ) {
        log.debug(`${method} request`, request);
        const reqJSON = JSON.stringify(request || {});
        this.wasm.wasmClientInvokeRPC(method, reqJSON, (response: string) => {
            try {
                const rawRes = JSON.parse(response);
                const res = snakeKeysToCamel(rawRes);
                log.debug(`${method} response`, res);
                if (onMessage) onMessage(res as TRes);
            } catch (error) {
                log.debug(`${method} error`, error);
                const err = new Error(response);
                if (onError) onError(err);
            }
        });
    }

    // Add an initialization step (e.g., in your connect or init method AFTER WASM is ready)
    // This wires up the Go callbacks to our internal handlers
    private setupMcpCallbacks() {
        if (!this.wasm || !this.mcpIsAvailable()) {
             // Check if MCP functions (like DeliverMCPResult) are present before warning
             const mcpFuncsPresent = this.wasm && typeof this.wasm.DeliverMCPResult === 'function' && typeof this.wasm.DeliverMCPError === 'function';
             if (!mcpFuncsPresent) {
                 log.debug('MCP callback functions (DeliverMCPResult/DeliverMCPError) not found on wasm object. MCP might not be fully enabled in this build.');
             } else {
                log.warn('Attempted to set up MCP callbacks before WASM or base MCP functions are ready.');
             }
             return; // Don't proceed if essential functions aren't there
        }

        // Ensure WASM object and expected functions exist before accessing them
        if (!this.wasm || typeof this.wasm.DeliverMCPResult !== 'function' || typeof this.wasm.DeliverMCPError !== 'function') {
            log.error('Cannot set up MCP callbacks: DeliverMCPResult or DeliverMCPError function is missing from WASM exports.');
            return;
        }


        // Store original functions if not already stored
        if (!this.originalDeliverMCPResult) {
            this.originalDeliverMCPResult = this.wasm.DeliverMCPResult;
        }
         if (!this.originalDeliverMCPError) {
            this.originalDeliverMCPError = this.wasm.DeliverMCPError;
        }

        // Override the functions on the wasm object to point to our class methods
        // Use .bind(this) to ensure 'this' context is correct inside the handlers
        this.wasm.DeliverMCPResult = this._handleMCPResult.bind(this);
        this.wasm.DeliverMCPError = this._handleMCPError.bind(this);
        log.debug('MCP result/error callbacks overridden by TypeScript client.');
    }

    /**
     * Initializes an MCP server for a specific LNC session
     * @param sessionID Unique identifier for the session
     * @param name Name of the MCP server
     * @param version Version of the MCP server
     * @returns The result of the operation (as returned by Go)
     */
    mcpInitializeSession(sessionID: string, name: string, version: string): { success: boolean; data?: any; error?: string } {
        // Check readiness first
        if (!this.isReady) {
            log.error('WASM client not ready for mcpInitializeSession');
            return { success: false, error: 'WASM client not ready' };
        }
        // Check if the specific function exists on the wasm object
        if (!this.wasm?.mcpInitializeSession) {
             log.error('mcpInitializeSession function not found in this WASM build.');
             return { success: false, error: 'MCP functionality (mcpInitializeSession) is not available in this WASM build' };
        }

        // Ensure callbacks are set up whenever a session might be active
        // It's generally safe to call this multiple times if needed.
        this.setupMcpCallbacks();

        log.debug(`Initializing MCP session ${sessionID}`);
        try {
             // Call the WASM function
            return this.wasm.mcpInitializeSession(sessionID, name, version);
        } catch (error) {
            log.error(`Error calling wasm.mcpInitializeSession for session ${sessionID}: ${error}`);
            // Return a consistent error object
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }

    /**
     * Registers a tool with the MCP server for a specific session
     * @param sessionID Identifier for the session
     * @param toolName Name of the tool
     * @param description Description of the tool
     * @param handler JavaScript function that implements the tool (must eventually call DeliverMCPResult/Error via Go)
     * @param parameters Optional parameters definition for the tool
     * @returns The result of the operation (as returned by Go)
     */
    mcpRegisterTool(
        sessionID: string,
        toolName: string,
        description: string,
        handler: Function, // Crucial: This handler's implementation dictates interaction with Go
        parameters: object = {}
    ): { success: boolean; data?: any; error?: string } {
         // Check readiness first
        if (!this.isReady) {
            log.error('WASM client not ready for mcpRegisterTool');
            return { success: false, error: 'WASM client not ready' };
        }
         // Check if the specific function exists
        if (!this.wasm?.mcpRegisterTool) {
            log.error('mcpRegisterTool function not found in this WASM build.');
            return { success: false, error: 'MCP functionality (mcpRegisterTool) is not available in this WASM build' };
        }

        log.debug(`Registering MCP tool ${toolName} for session ${sessionID}`);
        try {
            // The handler function is passed to Go. Go needs to know how to invoke it
            // and provide means for it to call back DeliverMCPResult/DeliverMCPError.
            return this.wasm.mcpRegisterTool(sessionID, toolName, description, handler, parameters);
        } catch (error) {
             log.error(`Error calling wasm.mcpRegisterTool for tool ${toolName} in session ${sessionID}: ${error}`);
             return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }

    /**
     * Calls a tool within a specific MCP session asynchronously.
     * Returns a Promise that resolves with the tool's result or rejects with an error.
     * @param sessionID Identifier for the session
     * @param toolName Name of the tool to call
     * @param args Arguments to pass to the tool
     * @returns A Promise resolving with the tool's result or rejecting with an error.
     */
    mcpCallTool(sessionID: string, toolName: string, args: object = {}): Promise<any> {
        // Check readiness first
        if (!this.isReady) {
            const errorMsg = 'WASM client not ready for mcpCallTool';
            log.error(errorMsg);
            return Promise.reject(new Error(errorMsg));
        }
        // Check if the specific function exists
        if (!this.wasm?.mcpCallTool) {
            const errorMsg = 'mcpCallTool function not found in this WASM build.';
            log.error(errorMsg);
            return Promise.reject(new Error(errorMsg));
        }

        // Ensure callbacks are set up in case they weren't (e.g., direct call after init)
        this.setupMcpCallbacks();

        log.debug(`Calling MCP tool ${toolName} for session ${sessionID}`, args);

        return new Promise((resolve, reject) => {
            try {
                // Call the Go function, expecting an immediate result indicating success/failure
                // and potentially a callID if asynchronous.
                const immediateResult = this.wasm && this.wasm.mcpCallTool && this.wasm.mcpCallTool(sessionID, toolName, args);

                log.debug(`Immediate result from wasm.mcpCallTool (Session: ${sessionID}, Tool: ${toolName}):`, immediateResult);

                // Basic validation of the immediate result structure
                if (typeof immediateResult !== 'object' || immediateResult === null) {
                     throw new Error('Invalid immediate result structure received from wasm.mcpCallTool');
                }

                // Check if the initial synchronous call failed
                if (!immediateResult.success) {
                    const errorMsg = immediateResult.error || `Unknown synchronous error initiating tool call '${toolName}'`;
                    log.error(`Failed to initiate MCP tool call synchronously: ${errorMsg}`);
                    reject(new Error(errorMsg));
                    return; // Stop processing
                }

                // Check if the call is pending and we received a valid callID in the data field
                const resultData = immediateResult.data;
                if (typeof resultData === 'object' && resultData !== null && resultData.status === 'pending' && typeof resultData.callID === 'string' && resultData.callID.length > 0) {
                    const callID = resultData.callID;
                    log.debug(`MCP tool call initiated successfully. Pending callID: ${callID} (Session: ${sessionID})`);
                    // Store the resolve/reject handlers for this callID
                    // Consider adding sessionID here if needed for cleanup: { resolve, reject, sessionID }
                    this.pendingMcpCalls.set(callID, { resolve, reject });

                    // Optional: Implement a timeout mechanism here if desired
                    // setTimeout(() => { ... }, timeoutDuration);

                } else {
                    // Handle cases where the call succeeded synchronously but didn't return
                    // the expected pending status and callID. This might indicate:
                    // 1. A tool that *can* complete synchronously (resolve immediately?)
                    // 2. An unexpected response structure from the Go layer.
                    // For now, treat it as an unexpected state.
                    log.error(`Unexpected immediate result structure from successful mcpCallTool call (Session: ${sessionID}, Tool: ${toolName}): Expected { success: true, data: { status: 'pending', callID: '...' } }, Received:`, immediateResult);
                    reject(new Error(`Tool call '${toolName}' succeeded immediately but did not return expected pending status or callID`));
                }

            } catch (invocationError) {
                // Catch errors during the initial wasm.mcpCallTool invocation itself
                log.error(`Error invoking wasm.mcpCallTool (Session: ${sessionID}, Tool: ${toolName}):`, invocationError);
                reject(invocationError instanceof Error ? invocationError : new Error(String(invocationError)));
            }
        });
    }

    /**
     * Gets the list of available tools for a specific MCP session
     * @param sessionID Identifier for the session
     * @returns Object with success status and data (list of tool names) or error message
     */
    mcpGetAvailableTools(sessionID: string): { success: boolean; data?: string[]; error?: string } {
        // Check readiness first
        if (!this.isReady) {
            log.error('WASM client not ready for mcpGetAvailableTools');
            return { success: false, error: 'WASM client not ready' };
        }
         // Check if the specific function exists
        if (!this.wasm?.mcpGetAvailableTools) {
             log.error('mcpGetAvailableTools function not found in this WASM build.');
             return { success: false, error: 'MCP functionality (mcpGetAvailableTools) is not available in this WASM build' };
        }

        log.debug(`Getting available MCP tools for session ${sessionID}`);
        try {
            return this.wasm.mcpGetAvailableTools(sessionID);
        } catch (error) {
             log.error(`Error calling wasm.mcpGetAvailableTools for session ${sessionID}: ${error}`);
             return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }

    /**
     * Closes an MCP session
     * @param sessionID Identifier for the session to close
     * @returns The result of the operation (as returned by Go)
     */
    mcpCloseSession(sessionID: string): { success: boolean; data?: any; error?: string } {
         // Check readiness first
        if (!this.isReady) {
            log.error('WASM client not ready for mcpCloseSession');
            return { success: false, error: 'WASM client not ready' };
        }
        // Check if the specific function exists
        if (!this.wasm?.mcpCloseSession) {
             log.error('mcpCloseSession function not found in this WASM build.');
            return { success: false, error: 'MCP functionality (mcpCloseSession) is not available in this WASM build' };
        }

        log.debug(`Closing MCP session ${sessionID}`);

        // --- Robust Cleanup Needed ---
        // To properly clean up pending calls ONLY for this sessionID,
        // the sessionID needs to be stored with the pending call info
        // when mcpCallTool stores it in this.pendingMcpCalls.
        // Example (requires PendingMcpCall type update and mcpCallTool update):
        // const callsToReject: string[] = [];
        // this.pendingMcpCalls.forEach((callInfo, callID) => {
        //     if (callInfo.sessionID === sessionID) {
        //         callsToReject.push(callID);
        //     }
        // });
        // callsToReject.forEach(callID => {
        //     const pendingCall = this.pendingMcpCalls.get(callID);
        //     if (pendingCall) {
        //         log.warn(`Rejecting pending MCP call ${callID} due to session ${sessionID} closure.`);
        //         pendingCall.reject(new Error(`MCP session ${sessionID} closed`));
        //         this.pendingMcpCalls.delete(callID);
        //     }
        // });
        // --- End Robust Cleanup Example ---


        try {
            const result = this.wasm.mcpCloseSession(sessionID);
            // If cleanup logic is added above, it should ideally happen *after*
            // confirming the session close was successful from Go.
            // if (result.success) { /* perform cleanup */ }
            return result;
        } catch (error) {
             log.error(`Error calling wasm.mcpCloseSession for session ${sessionID}: ${error}`);
             return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }

    /**
     * Checks if essential MCP functionality (base functions and callbacks) seems available.
     * Note: This checks for the *presence* of functions, not guarantee they work correctly.
     * @returns True if essential MCP functions are detected, false otherwise.
     */
    mcpIsAvailable(): boolean {
        // Check for base functions AND the necessary delivery functions expected from Go
        const baseFuncsAvailable = !!(
            this.wasm &&
            this.wasm.mcpInitializeSession &&
            this.wasm.mcpRegisterTool &&
            this.wasm.mcpCallTool &&
            this.wasm.mcpGetAvailableTools &&
            this.wasm.mcpCloseSession
        );
        // Check if the functions Go is supposed to call back *exist* on the wasm object
        const callbackFuncsAvailable = !!(
             this.wasm &&
             typeof this.wasm.DeliverMCPResult === 'function' &&
             typeof this.wasm.DeliverMCPError === 'function'
        );

        if (baseFuncsAvailable && !callbackFuncsAvailable) {
            log.warn("Base MCP functions found, but DeliverMCPResult/DeliverMCPError callbacks are missing. Asynchronous calls (mcpCallTool) will likely fail.");
        }

        return baseFuncsAvailable && callbackFuncsAvailable;
    }


    /**
     * Generates a unique session ID using crypto.randomUUID if available.
     * @returns A unique session ID string.
     */
    mcpGenerateSessionId(): string {
        // Use crypto.randomUUID for better uniqueness if available (modern browsers, Node.js)
        // Use type assertion (as any) to bypass TS error when type defs are missing randomUUID
        if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
            return `mcp-${this._namespace}-${(crypto as any).randomUUID()}`;
        }
        // Fallback for environments without crypto.randomUUID
        log.warn("crypto.randomUUID not available, falling back to less unique Date+Math.random based session ID.");
        const randomPart = Math.random().toString(16).substring(2, 10); // Slightly more random part
        return `mcp-${this._namespace}-${Date.now()}-${randomPart}`;
    }

    /**
     * Creates a deterministic session ID based on connection details (serverHost, pairingPhrase).
     * Uses a simple, non-cryptographic hash. Prone to collisions.
     * @returns A session ID string derived from connection, or a random one if details are missing.
     */
    mcpGetSessionIdFromConnection(): string {
        // Ensure credentials object and necessary properties exist
        if (!this.credentials?.serverHost || !this.credentials?.pairingPhrase) {
            log.warn('Cannot generate deterministic session ID from connection: missing serverHost or pairingPhrase. Falling back to random ID.');
            return this.mcpGenerateSessionId(); // Fallback to random generation
        }
        const { serverHost, pairingPhrase } = this.credentials;
        // Basic check for non-empty strings
        if (serverHost.length === 0 || pairingPhrase.length === 0) {
             log.warn('Cannot generate deterministic session ID from connection: serverHost or pairingPhrase is empty. Falling back to random ID.');
             return this.mcpGenerateSessionId();
        }

        const connectionString = `${serverHost}-${pairingPhrase}`;

        // Simple hash function (djb2 variant - reasonably distributed for basic use)
        let hash = 5381;
        for (let i = 0; i < connectionString.length; i++) {
            hash = (hash * 33) ^ connectionString.charCodeAt(i);
            // Convert to 32bit integer (using >>> 0 for unsigned)
            hash = hash >>> 0;
        }

        // Using 'conn' prefix to distinguish from purely random ones
        return `mcp-${this._namespace}-conn-${hash.toString(16)}`; // Use unsigned hash hex representation
    }


    /**
     * Creates a new MCP session, ensuring connection and WASM readiness.
     * @param name Name for the MCP session server instance (default: 'LNC MCP Server')
     * @param version Version for the MCP session server instance (default: '1.0.0')
     * @returns The session ID string if successful, otherwise null.
     */
    async createMcpSession(name = 'LNC MCP Server', version = '1.0.0'): Promise<string | null> {
        try {
            // 1. Ensure connection is established (connect handles WASM run/wait)
            if (!this.isConnected) {
                 log.info('Not connected, attempting to connect before creating MCP session...');
                await this.connect(); // connect should throw if it fails catastrophically
                 log.info('Connection established.');
            } else {
                // 2. Even if connected, double-check WASM readiness (belt-and-suspenders)
                if (!this.isReady) {
                    log.warn('Connected but WASM reports not ready, attempting run/wait...');
                    await this.run(); // May throw if WASM instance is missing
                    await this.waitTilReady(); // May throw if timeout occurs
                    if (!this.isReady) {
                         throw new Error("Failed to get WASM client ready after attempting run/wait.");
                    }
                     log.info('WASM client is now ready.');
                }
            }

            // 3. Check if MCP functionality is available *after* ensuring WASM is ready
            if (!this.mcpIsAvailable()) {
                // Log details about what might be missing
                const baseFuncs = this.wasm && this.wasm.mcpInitializeSession;
                const callbackFuncs = this.wasm && typeof this.wasm.DeliverMCPResult === 'function';
                log.error(`MCP functionality check failed. Base funcs present: ${!!baseFuncs}, Callback funcs present: ${!!callbackFuncs}`);
                throw new Error('MCP functionality (including necessary callback functions) is not available in this WASM build');
            }

            // 4. Generate a session ID (choose strategy: deterministic or random)
            const sessionId = this.mcpGenerateSessionId();
            // const sessionId = this.mcpGetSessionIdFromConnection();

            // 5. Initialize the session (this calls setupMcpCallbacks internally)
            log.info(`Attempting to initialize MCP session: ${sessionId}`);
            const result = this.mcpInitializeSession(sessionId, name, version);

            // 6. Check initialization result
            if (!result || !result.success) {
                // Log the specific error if available from Go
                throw new Error(`Failed to initialize MCP session '${sessionId}': ${result?.error || 'Unknown initialization error'}`);
            }

            log.info(`MCP session created successfully: ${sessionId}`);
            return sessionId; // Return the session ID on success

        } catch (err) {
            // Catch errors from connect(), run(), waitTilReady(), mcpIsAvailable(), or mcpInitializeSession()
            log.error(`Error during MCP session creation: ${err instanceof Error ? err.message : String(err)}`, err);
            return null; // Return null on any failure during the process
        }
    }


    // --- Internal handlers called by the overridden Go callbacks ---

    /**
     * Handles successful results delivered from Go WASM via DeliverMCPResult.
     * Resolves the corresponding Promise stored in pendingMcpCalls.
     * @param callID The unique ID for the tool call
     * @param sessionID The session ID associated with the call (for context/logging)
     * @param resultData The result data from the Go tool execution (type depends on tool)
     */
    private _handleMCPResult(callID: string, sessionID: string, resultData: any): void {
        log.debug(`Received MCP result via callback for callID ${callID} (Session: ${sessionID})`, { resultData }); // Log raw data for inspection
        const pendingCall = this.pendingMcpCalls.get(callID);

        if (pendingCall) {
            try {
                // Attempt to parse if it's a JSON string, otherwise pass raw data
                let finalResult = resultData;
                if (typeof resultData === 'string') {
                    // Basic check if it looks like JSON before trying to parse
                    const trimmedData = resultData.trim();
                    if ((trimmedData.startsWith('{') && trimmedData.endsWith('}')) || (trimmedData.startsWith('[') && trimmedData.endsWith(']'))) {
                        try {
                            finalResult = JSON.parse(resultData);
                            log.debug(`Successfully parsed JSON result for callID ${callID}`);
                        } catch (parseError) {
                            log.warn(`Result for callID ${callID} looked like JSON but failed to parse. Resolving with raw string. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`, resultData);
                            // Keep finalResult as the original string
                        }
                    } else {
                         log.debug(`Result for callID ${callID} is a non-JSON string. Resolving with raw string.`);
                         // Keep finalResult as the original string
                    }
                } else {
                     log.debug(`Result for callID ${callID} is not a string. Resolving with raw data. Type: ${typeof resultData}`);
                }

                // Resolve the promise with the (potentially parsed) result
                pendingCall.resolve(finalResult);

            } catch (resolveError) {
                // Catch errors that might occur *within the promise's resolve handler* downstream
                log.error(`Error occurred during promise resolution handler for callID ${callID}:`, resolveError);
                // Reject the original promise if the downstream handler fails
                pendingCall.reject(resolveError instanceof Error ? resolveError : new Error(`Error in resolve handler: ${String(resolveError)}`));
            } finally {
                // IMPORTANT: Always clean up the pending call map
                this.pendingMcpCalls.delete(callID);
                log.debug(`Removed pending call entry for callID: ${callID}`);
            }
        } else {
            // This might happen if:
            // 1. The call timed out and was already rejected/cleaned up.
            // 2. Go sent a result for a callID that TS doesn't know (error state).
            // 3. Go sent the result twice (potential race condition or Go bug).
            log.warn(`Received MCP result for unknown or already handled callID: ${callID} (Session: ${sessionID}). This may indicate a timeout, duplicate response, or error.`);
        }
    }

    /**
     * Handles errors delivered from Go WASM via DeliverMCPError.
     * Rejects the corresponding Promise stored in pendingMcpCalls.
     * @param callID The unique ID for the tool call
     * @param sessionID The session ID associated with the call (for context/logging)
     * @param errorMsg The error message string provided by Go
     */
    private _handleMCPError(callID: string, sessionID: string, errorMsg: string): void {
        log.error(`Received MCP error via callback for callID ${callID} (Session: ${sessionID}): ${errorMsg}`);
        const pendingCall = this.pendingMcpCalls.get(callID);

        if (pendingCall) {
            try {
                // Create a proper Error object for rejection
                const error = new Error(errorMsg);
                // Optionally add more context if available
                // error.context = { callID, sessionID };
                pendingCall.reject(error);
            } catch (rejectError) {
                 // This should ideally not happen if reject is a standard Promise.reject
                 log.error(`Internal error occurred during promise rejection for callID ${callID}:`, rejectError);
            } finally {
                 // IMPORTANT: Always clean up the pending call map
                this.pendingMcpCalls.delete(callID);
                 log.debug(`Removed pending call entry for callID: ${callID}`);
            }
        } else {
             // Similar reasons as in _handleMCPResult for why this might happen
            log.warn(`Received MCP error for unknown or already handled callID: ${callID} (Session: ${sessionID}). This may indicate a timeout, duplicate response, or error.`);
        }
    }

} // End of LNC class
