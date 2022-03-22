import * as POOL from '../../types/generated/trader_pb';
import * as AUCTIONEER from '../../types/generated/auctioneerrpc/auctioneer_pb';
import * as HASHMAIL from '../../types/generated/auctioneerrpc/hashmail_pb';

import { Trader } from '../../types/generated/trader_pb_service';
import { ChannelAuctioneer } from '../../types/generated/auctioneerrpc/auctioneer_pb_service';
import { HashMail } from '../../types/generated/auctioneerrpc/hashmail_pb_service';

import WasmClient from './../../index';
import BaseApi from './../base';

import createRpc from './../createRpc';

/** the names and argument types for the subscription events */
interface PoolEvents {
    cipherBox: HASHMAIL.CipherBox.AsObject;
}

/**
 * An API wrapper to communicate with the Pool node via GRPC
 */
class PoolApi extends BaseApi<PoolEvents> {
    _wasm: WasmClient;
    // sub-services
    trader: any;
    channelAuctioneer: any;
    hashmail: any;

    constructor(wasm: WasmClient) {
        super();

        const hashmailSubscriptions = {
            recvStream: (request: any, callback: Function): void => {
                const req = new HASHMAIL.CipherBoxDesc();
                this.subscribe(HashMail.RecvStream, req, callback);
            }
        };

        this._wasm = wasm;
        this.trader = createRpc(wasm, Trader);
        this.channelAuctioneer = createRpc(wasm, ChannelAuctioneer);
        this.hashmail = createRpc(wasm, HashMail, hashmailSubscriptions);
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
    ): Promise<POOL.GetInfoResponse.AsObject> {
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
            return await this.trader.getInfo();
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

export default PoolApi;