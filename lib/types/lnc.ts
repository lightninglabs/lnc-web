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
    /**
     * Enable session-based authentication. When enabled, credentials are stored
     * in sessionStorage with device binding for passwordless login during the
     * browser session. Defaults to false for backward compatibility.
     */
    enableSessions?: boolean;
    /**
     * Session duration in milliseconds. Only used when enableSessions is true.
     * Defaults to 24 hours (24 * 60 * 60 * 1000).
     */
    sessionTTL?: number;
    /**
     * Enable passkey-based encryption. When enabled, credentials are encrypted
     * using hardware-backed passkeys instead of passwords. Requires WebAuthn support.
     * Defaults to false for backward compatibility.
     */
    allowPasskeys?: boolean;
}

/**
 * Authentication information returned by getAuthenticationInfo()
 */
export interface AuthenticationInfo {
    isUnlocked: boolean;
    hasStoredCredentials: boolean;
    hasActiveSession: boolean;
    supportsPasskeys: boolean;
    hasPasskey: boolean;
    preferredUnlockMethod: UnlockMethod;
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

    // Enhanced authentication methods (optional - for backward compatibility)
    /**
     * Unlocks the credential store using the specified method and options
     * @param options Unlock options specifying the method and required parameters
     * @returns Promise that resolves to true if unlock was successful
     */
    unlock?(options: UnlockOptions): Promise<boolean>;

    /**
     * Gets information about the current authentication state
     * @returns Promise that resolves to authentication information including unlock status and available methods
     */
    getAuthenticationInfo?(): Promise<AuthenticationInfo>;

    /**
     * Gets the list of supported unlock methods for this store
     * @returns Array of supported unlock method names
     */
    getSupportedUnlockMethods?(): UnlockMethod[];

    /**
     * Checks if the store can automatically restore/unlock without user interaction
     * @returns Promise that resolves to true if auto-restore is possible (e.g., active session)
     */
    canAutoRestore?(): Promise<boolean>;

    /**
     * Attempts to automatically restore/unlock the store without user interaction
     * @returns Promise that resolves to true if auto-restore was successful
     */
    tryAutoRestore?(): Promise<boolean>;

    /**
     * Checks if there is an active session (for session-enabled stores)
     * @returns true if there is an active session
     */
    hasActiveSession?(): boolean;

    /**
     * Gets the remaining time for the current session in milliseconds
     * @returns Promise that resolves to remaining session time in milliseconds, or 0 if no active session
     */
    getSessionTimeRemaining?(): Promise<number>;

    /**
     * Refreshes/extends the current session
     * @returns Promise that resolves to true if session refresh was successful
     */
    refreshSession?(): Promise<boolean>;

    /**
     * Creates a session after connection is confirmed to be working
     * This should be called after a successful connection, not during credential setting
     * @returns Promise that resolves when session creation is complete
     */
    createSessionAfterConnection?(): Promise<void>;
}

/**
 * Configuration options for session-based credential management
 */
export interface SessionCredentialStoreConfig {
    /** Session expiry time in milliseconds (default: 24 hours) */
    sessionDuration?: number;
    /** Require user interaction for crypto operations (default: false) */
    requireUserGesture?: boolean;
    /** Enable automatic session refresh based on activity (default: true) */
    enableActivityRefresh?: boolean;
    /** Minutes of activity required for refresh (default: 30) */
    activityThreshold?: number;
    /** Seconds to throttle activity updates (default: 30) */
    activityThrottleInterval?: number;
    /** Hours remaining when refresh triggers (default: 4) */
    refreshTrigger?: number;
    /** Minutes between refresh condition checks (default: 5) */
    refreshCheckInterval?: number;
    /** Pause refresh timer when page is hidden (default: true) */
    pauseOnHidden?: boolean;
    /** Maximum refreshes per session (default: 10) */
    maxRefreshes?: number;
    /** Absolute maximum session age in milliseconds (default: 7 days) */
    maxSessionAge?: number;
}

/**
 * Authentication state information for consumer apps
 */
export interface AuthenticationState {
    isReady: boolean; // Can connect to Lightning node
    isConnected: boolean; // Currently connected
    authMethod: 'none' | 'password' | 'passkey' | 'session';
    needsUnlock: boolean; // Requires user interaction to unlock
    availableMethods: string[]; // Available unlock methods
    sessionInfo?: {
        hasSession: boolean;
        timeRemaining: number;
        canRefresh: boolean;
    };
}

/**
 * Available unlock methods
 */
export type UnlockMethod = 'password' | 'passkey' | 'session';

/**
 * Unlock options for different authentication methods
 */
export type UnlockOptions =
    | { method: 'password'; password: string; salt?: string; cipher?: string }
    | { method: 'passkey'; createIfMissing?: boolean; credentialId?: string }
    | { method: 'session' };

export interface ClearOptions {
    /** clear the short-term credentials saved in session storage (default: true) */
    session?: boolean;
    /** clear the long-term pairing credentials saved in local storage (default: false) */
    persisted?: boolean;
}
