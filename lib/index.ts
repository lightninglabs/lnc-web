// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./wasm_exec');

import LNC from './lnc';
import { CredentialOrchestrator } from './credentialOrchestrator';
import { WasmManager } from './wasmManager';

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
  UnlockMethod,
  UnlockOptions
} from './types/lnc';
export type { AuthenticationInfo } from './stores/unifiedCredentialStore';
export * from '@lightninglabs/lnc-core';
export default LNC;
export { CredentialOrchestrator, WasmManager };
