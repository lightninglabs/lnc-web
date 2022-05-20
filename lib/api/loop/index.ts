import * as LOOP from '../../types/generated/client_pb';

import { SwapClient } from '../../types/generated/client_pb_service';
import { Debug } from '../../types/generated/debug_pb_service';

import WasmClient from './../../index';
import BaseApi from './../base';

import createRpc from './../createRpc';

/** the names and argument types for the subscription events */
interface LoopEvents {
    status: LOOP.SwapStatus.AsObject;
}

/**
 * An API wrapper to communicate with the Loop node via GRPC
 */
class LoopApi extends BaseApi<LoopEvents> {
    _wasm: WasmClient;
    // sub-services
    swapClient: any;
    debug: any;

    constructor(wasm: WasmClient) {
        super();

        this._wasm = wasm;

        const swapSubscriptions = {
            monitor: (
                request: any,
                callback: (data: any) => void,
                errCallback?: (data: any) => void
            ): void => {
                const req = new LOOP.MonitorRequest();
                this.subscribe(SwapClient.Monitor, req, callback, errCallback);
            }
        };

        this.swapClient = createRpc(wasm, SwapClient, swapSubscriptions);
        this.debug = createRpc(wasm, Debug);
    }

    subscribe(
        call: any,
        request: any,
        callback?: (data: any) => void,
        errCallback?: (data: any) => void
    ) {
        this._wasm.subscribe(
            call,
            request,
            (event) => callback && callback(event.toObject()),
            (event) => errCallback && errCallback(event)
        );
    }
}

export default LoopApi;
