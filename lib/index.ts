// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./wasm_exec');

import { CredentialOrchestrator } from './credentialOrchestrator';
import LNC from './lnc';
import { WasmManager } from './wasmManager';

// polyfill
if (!WebAssembly.instantiateStreaming) {
  WebAssembly.instantiateStreaming = async (resp, importObject) => {
    const source = await (await resp).arrayBuffer();
    return await WebAssembly.instantiate(source, importObject);
  };
}

export type { LncConfig, CredentialStore } from './types/lnc';
export type {
  SessionConfig,
  UnlockMethod,
  UnlockOptions,
  AuthenticationInfo,
  ClearOptions
} from './types/lightningNodeConnect';
export * from '@lightninglabs/lnc-core';
export default LNC;
export { CredentialOrchestrator, WasmManager };
