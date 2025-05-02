export interface WasmGlobal {
    /**
     * Returns true if the WASM client has been started and is ready to accept
     * connections
     */
    wasmClientIsReady: () => boolean;
    /**
     * Returns true if the WASM client is currently connected to the proxy server
     */
    wasmClientIsConnected: () => boolean;
    /**
     * Attempts to connect to the proxy server
     */
    wasmClientConnectServer: (
        serverHost: string,
        isDevServer: boolean,
        pairingPhrase: string,
        localKey?: string,
        remoteKey?: string
    ) => void;
    /**
     * disconnects from the proxy server
     */
    wasmClientDisconnect: () => void;
    /**
     * Invokes an RPC command with a request object and executes the provided callback
     * with the response
     */
    wasmClientInvokeRPC: (
        rpcName: string,
        request: any,
        callback: (response: string) => any
    ) => void;
    /**
     * Returns true if client has specific permissions
     * e.g. 'lnrpc.Lightning.GetInfo'
     */
    wasmClientHasPerms: (permission: string) => boolean;
    /**
     * Returns true if the WASM client is read only
     */
    wasmClientIsReadOnly: () => boolean;
    /**
     * Returns the WASM client status
     */
    wasmClientStatus: () => string;
    /**
     * Returns the WASM client expiry time
     */
    wasmClientGetExpiry: () => number;
    /**
     * The callback that is called when the WASM client generates a new local private
     * key. This is used to reestablish subsequent connections to the proxy server.
     * @param keyHex the hex encoded private key of the local WASM client
     */
    onLocalPrivCreate?: (keyHex: string) => void;
    /**
     * The callback that is called when the WASM client receives the remote node's
     * public key. This is used to reestablish subsequent connections to the proxy
     * server.
     * @param keyHex the hex encoded public key of the remote node
     */
    onRemoteKeyReceive?: (keyHex: string) => void;
    /**
     * The callback that is called when the WASM client receives the macaroon
     * associated with the LNC session.
     * @param macaroonHex the hex encoded macaroon associated with the LNC session
     */
    onAuthData?: (macaroonHex: string) => void;

    // --- MCP Function Signatures expected from Go WASM ---

    /**
     * Initializes an MCP server session.
     */
    mcpInitializeSession?: (sessionID: string, name: string, version: string) => { success: boolean; data?: any; error?: string };
    /**
     * Registers a tool handler with the MCP server.
     */
    mcpRegisterTool?: (sessionID: string, toolName: string, description: string, handler: Function, parameters: object) => { success: boolean; data?: any; error?: string };
    /**
     * Calls a tool within an MCP session. Expected to return immediately,
     * with the actual result delivered via DeliverMCPResult/DeliverMCPError callbacks.
     */
    mcpCallTool?: (sessionID: string, toolName: string, args: object) => { success: boolean; data?: { status: 'pending'; callID: string }; error?: string };
    /**
     * Retrieves the list of available tools for an MCP session.
     */
    mcpGetAvailableTools?: (sessionID: string) => { success: boolean; data?: string[]; error?: string };
    /**
     * Closes an MCP session.
     */
    mcpCloseSession?: (sessionID: string) => { success: boolean; data?: any; error?: string };

    /**
     * Callback *from* Go to deliver the result of an asynchronous tool call.
     * This function will be *overridden* by the TypeScript client.
     */
    DeliverMCPResult?: (callID: string, sessionID: string, resultData: any) => void;
    /**
     * Callback *from* Go to deliver an error from an asynchronous tool call.
     * This function will be *overridden* by the TypeScript client.
     */
    DeliverMCPError?: (callID: string, sessionID: string, errorMsg: string) => void;
}

export interface LncConfig {
    /**
     * Specify a custom Lightning Node Connect proxy server. If not specified we'll
     * default to `mailbox.terminal.lightning.today:443`.
     */
    serverHost?: string;
    /**
     * Custom location for the WASM client code. Can be remote or local. If not
     * specified we'll default to our instance on our CDN.
     */
    wasmClientCode?: any; // URL or WASM client object
    /**
     * JavaScript namespace used for the main WASM calls. You can maintain multiple
     * connections if you use different namespaces. If not specified we'll default
     * to `default`.
     */
    namespace?: string;
    /**
     * The LNC pairing phrase used to initialize the connection to the LNC proxy.
     * This value will be passed along to the credential store.
     */
    pairingPhrase?: string;
    /**
     * By default, this module will handle storage of your local and remote keys
     * for you in local storage. This password ise used to encrypt the keys for
     * future use. If the password is not provided here, it must be
     * set directly via `lnc.credentials.password` in order to persist data
     * across page loads
     */
    password?: string;
    /**
     * Custom store used to save & load the pairing phrase and keys needed to
     * connect to the proxy server. The default store persists data in the
     * browser's `localStorage`
     */
    credentialStore?: CredentialStore;
}

/**
 * The interface that must be implemented to provide `LNC` instances with storage
 * for its persistent data. These fields will be read and written to during the
 * authentication and connection process.
 */
export interface CredentialStore {
    /**
     * Stores the optional password to use for encryption of the data. LNC does not
     * read or write the password. This is just exposed publicly to simplify access
     * to the field via `lnc.credentials.password`
     */
    password?: string;
    /** Stores the LNC pairing phrase used to initialize the connection to the LNC proxy */
    pairingPhrase: string;
    /** Stores the host:port of the Lightning Node Connect proxy server to connect to */
    serverHost: string;
    /** Stores the local private key which LNC uses to reestablish a connection */
    localKey: string;
    /** Stores the remote static key which LNC uses to reestablish a connection */
    remoteKey: string;
    /**
     * Read-only field which should return `true` if the client app has prior
     * credentials persisted in the store
     */
    isPaired: boolean;
    /**
     * Clears the in-memory and persisted data in the store.
     * @param memoryOnly If `true`, only the in-memory data will be cleared. If
     * `false` or `undefined`, the persisted data will be cleared as well.
     * The default is `undefined`.
     */
    clear(memoryOnly?: boolean): void;
}
