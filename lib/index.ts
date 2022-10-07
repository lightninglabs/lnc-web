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

export type { LncConfig, CredentialStore } from './types/lnc';

export default LNC;
