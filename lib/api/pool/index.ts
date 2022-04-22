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

    subscribe(call: any, request: any, callback?: Function) {
        this._wasm.subscribe(
            call,
            request,
            (event) => callback && callback(event.toObject())
        );
    }
}

export default PoolApi;
