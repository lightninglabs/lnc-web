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

        const swapSubscriptions = {
            monitor: (request: any, callback: Function): void => {
                const req = new LOOP.MonitorRequest();
                this.subscribe(SwapClient.Monitor, req, callback);
            }
        };

        this._wasm = wasm;
        this.swapClient = createRpc(wasm, SwapClient, swapSubscriptions);
        this.debug = createRpc(wasm, Debug);
    }

    /**
     * Downloads the WASM binary and initializes the executable
     */
    async load() {
        if (!this._wasm.isReady) {
            await this._wasm.load();
        }
    }

    /**
     * Uses the WasmClient to connect to the backend LND node via a Terminal
     * Connect proxy server
     * @param server the proxy server to connect to
     * @param phrase the secret pairing phrase to use
     */
    async connect(
        server: string,
        phrase: string
    ): Promise<LOOP.SwapResponse.AsObject> {
        let connecting = true;

        // terminate the connection after a 15sec timeout
        setTimeout(() => {
            if (connecting) this.disconnect();
        }, 15 * 1000);

        await this._wasm.connect(server, phrase);

        try {
            // attempt to fetch data from the proxy to confirm it's functioning. if the
            // phrase is not valid, the getInfo request will hang until the timeout above
            // is reached. then an error will be thrown
            return await this.swapClient.listSwaps();
        } catch {
            throw new Error(
                'Try reloading the page or obtaining a new pairing phrase.'
            );
        } finally {
            connecting = false;
        }
    }

    /**
     * Disconnects from the proxy server
     */
    disconnect() {
        this._wasm.disconnect();
    }

    subscribe(call: any, request: any, callback?: Function) {
        this._wasm.subscribe(
            call,
            request,
            (event) => callback && callback(event.toObject())
        );
    }
}

export default LoopApi;
