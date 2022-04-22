import * as FARADAY from '../../types/generated/faraday_pb';

import { FaradayServer } from '../../types/generated/faraday_pb_service';

import WasmClient from './../../index';
import BaseApi from './../base';

import createRpc from './../createRpc';

/** the names and argument types for the subscription events */
interface FaradayEvents {}

/**
 * An API wrapper to communicate with the Faraday node via GRPC
 */
class FaradayApi extends BaseApi<FaradayEvents> {
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
