import * as FARADAY from '../../types/generated/faraday_pb';

import { FaradayServer } from '../../types/generated/faraday_pb_service';

import WasmClient from './../../index';
import BaseApi from './../base';

import createRpc from './../createRpc';

/**
 * An API wrapper to communicate with the Faraday node via GRPC
 */
class FaradayApi extends BaseApi<{}> {
    _wasm: WasmClient;
    // sub-services
    faradayServer: any;

    constructor(wasm: WasmClient) {
        super();
        this._wasm = wasm;
        this.faradayServer = createRpc(wasm, FaradayServer);
    }
}

export default FaradayApi;
