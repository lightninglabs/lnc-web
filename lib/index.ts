// tslint:disable-next-line
require('./wasm_exec');

import LNC from './lnc';

// polyfill
if (!WebAssembly.instantiateStreaming) {
    WebAssembly.instantiateStreaming = async (resp, importObject) => {
        const source = await (await resp).arrayBuffer();
        return await WebAssembly.instantiate(source, importObject);
    };
}

export type {
    LncConfig,
    CredentialStore,
    SessionCredentialStoreConfig,
    AuthenticationState,
    UnlockMethod,
    UnlockOptions,
    AuthenticationInfo
} from './types/lnc';

// Export main classes
export { default as LncCredentialStore } from './util/credentialStore';
export { default as UnifiedCredentialStore } from './stores/unifiedCredentialStore';

// Export new repository pattern architecture
export { PasswordEncryptionService } from './encryption/passwordEncryptionService';
export { PasskeyEncryptionService } from './encryption/passkeyEncryptionService';
export type { EncryptionService } from './encryption/encryptionService';

export type { CredentialRepository } from './repositories/credentialRepository';
export { PasswordCredentialRepository } from './repositories/passwordCredentialRepository';
export { PasskeyCredentialRepository } from './repositories/passkeyCredentialRepository';

// Export session management
export { default as SessionManager } from './sessions/sessionManager';
export { default as SessionRefreshManager } from './sessions/sessionRefreshManager';

export * from '@lightninglabs/lnc-core';
export default LNC;
