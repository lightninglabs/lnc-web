import LNC from '../lnc';
import { ChannelAuctioneer } from '../types/proto/pool/auctioneerrpc/auctioneer';
import { HashMail } from '../types/proto/pool/auctioneerrpc/hashmail';
import { Trader } from '../types/proto/pool/trader';
import { serviceNames as sn } from '../types/proto/schema';
import { createRpc } from './createRpc';

/**
 * An API wrapper to communicate with the Pool node via GRPC
 */
class PoolApi {
    trader: Trader;
    channelAuctioneer: ChannelAuctioneer;
    hashmail: HashMail;

    constructor(lnc: LNC) {
        this.trader = createRpc(sn.poolrpc.Trader, lnc);
        this.channelAuctioneer = createRpc(sn.poolrpc.ChannelAuctioneer, lnc);
        this.hashmail = createRpc(sn.poolrpc.HashMail, lnc);
    }
}

export default PoolApi;
