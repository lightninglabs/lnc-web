import {
    FaradayApi,
    LitApi,
    LndApi,
    LoopApi,
    PoolApi,
    TaprootAssetsApi
} from '@lightninglabs/lnc-core';
import { createRpc } from './api/createRpc';
import { CredentialOrchestrator } from './credentialOrchestrator';
import { PasskeyEncryptionService } from './encryption/passkeyEncryptionService';
import {
    ClearOptions,
    CredentialStore,
    LncConfig,
    UnlockOptions
} from './types/lnc';
import { WasmManager } from './wasmManager';

/**
 * A reference to the global object that is extended with proper typing for the LNC
 * functions that are injected by the WASM client and the Go object. This eliminates the
 * need for casting `globalThis` to `any`.
 */
export const lncGlobal = globalThis as typeof globalThis & {
    Go: new () => GoInstance;
} & {
    [key: string]: unknown;
};

/** The default values for the LncConfig options */
export const DEFAULT_CONFIG = {
    wasmClientCode: 'https://lightning.engineering/lnc-v0.3.4-alpha.wasm',
    namespace: 'default',
    serverHost: 'mailbox.terminal.lightning.today:443'
} as Required<LncConfig>;

export default class LNC {
    // API fields (same as before) - initialized in constructor via initializeApis()
    lnd!: LndApi;
    loop!: LoopApi;
    pool!: PoolApi;
    faraday!: FaradayApi;
    tapd!: TaprootAssetsApi;
    lit!: LitApi;

    // Internal managers
    private wasmManager: WasmManager;
    private credentialOrchestrator: CredentialOrchestrator;

    constructor(lncConfig?: LncConfig) {
        // Merge the passed in config with the defaults
        const config = Object.assign({}, DEFAULT_CONFIG, lncConfig);

        // Create managers
        this.wasmManager = new WasmManager(
            config.namespace,
            config.wasmClientCode
        );

        this.credentialOrchestrator = new CredentialOrchestrator(config);

        // Set credential provider for WASM manager
        this.wasmManager.setCredentialProvider(
            this.credentialOrchestrator.getCredentialStore()
        );

        // Initialize APIs (simple, no factory needed)
        this.initializeApis();
    }

    // Public credentials getter (maintains backward compatibility)
    get credentials(): CredentialStore {
        return this.credentialOrchestrator.getCredentialStore();
    }

    /**
     * Initialize Lightning Network APIs
     */
    private initializeApis(): void {
        this.lnd = new LndApi(createRpc, this);
        this.loop = new LoopApi(createRpc, this);
        this.pool = new PoolApi(createRpc, this);
        this.faraday = new FaradayApi(createRpc, this);
        this.tapd = new TaprootAssetsApi(createRpc, this);
        this.lit = new LitApi(createRpc, this);
    }

    // High-level facade methods that delegate to managers

    async performAutoLogin(): Promise<boolean> {
        return this.credentialOrchestrator.performAutoLogin();
    }

    async clear(options?: ClearOptions): Promise<void> {
        return this.credentialOrchestrator.clear(options);
    }

    async getAuthenticationInfo() {
        return this.credentialOrchestrator.getAuthenticationInfo();
    }

    async unlock(options: UnlockOptions): Promise<boolean> {
        return this.credentialOrchestrator.unlock(options);
    }

    get isUnlocked(): boolean {
        return this.credentialOrchestrator.isUnlocked;
    }

    get isPaired(): boolean {
        return this.credentialOrchestrator.isPaired;
    }

    /**
     * Check if passkeys are supported in the current environment
     */
    static async isPasskeySupported(): Promise<boolean> {
        return await PasskeyEncryptionService.isSupported();
    }

    /**
     * Check if the current configuration supports passkeys
     */
    async supportsPasskeys(): Promise<boolean> {
        return this.credentialOrchestrator.supportsPasskeys();
    }

    // WASM state getters (delegate to WasmManager)
    get isReady(): boolean {
        return this.wasmManager.isReady;
    }

    get isConnected(): boolean {
        return this.wasmManager.isConnected;
    }

    get status(): string {
        return this.wasmManager.status;
    }

    get expiry(): Date {
        return this.wasmManager.expiry;
    }

    get isReadOnly(): boolean {
        return this.wasmManager.isReadOnly;
    }

    hasPerms(permission: string): boolean {
        return this.wasmManager.hasPerms(permission);
    }

    // WASM lifecycle methods (delegate to WasmManager)
    async preload(): Promise<void> {
        return this.wasmManager.preload();
    }

    async run(): Promise<void> {
        return this.wasmManager.run();
    }

    async connect(): Promise<void> {
        return this.wasmManager.connect();
    }

    async pair(pairingPhrase: string): Promise<void> {
        return this.wasmManager.pair(pairingPhrase);
    }

    disconnect(): void {
        this.wasmManager.disconnect();
    }

    // Credential persistence methods (delegate to CredentialOrchestrator)
    async persistWithPassword(password: string): Promise<void> {
        return this.credentialOrchestrator.persistWithPassword(password);
    }

    async persistWithPasskey(): Promise<void> {
        return this.credentialOrchestrator.persistWithPasskey();
    }

    // RPC methods (delegate to WasmManager)
    request<TRes>(method: string, request?: object): Promise<TRes> {
        return this.wasmManager.request<TRes>(method, request);
    }

    subscribe<TRes>(
        method: string,
        request?: object,
        onMessage?: (res: TRes) => void,
        onError?: (res: Error) => void
    ): void {
        return this.wasmManager.subscribe(method, request, onMessage, onError);
    }
}
