import * as LND from '../../types/generated/lightning_pb';
import { Lightning } from '../../types/generated/lightning_pb_service';
import { WalletUnlocker } from '../../types/generated/walletunlocker_pb_service';

import { Autopilot } from '../../types/generated/autopilotrpc/autopilot_pb_service';
import { ChainNotifier } from '../../types/generated/chainrpc/chainnotifier_pb_service';
import { Invoices } from '../../types/generated/invoicesrpc/invoices_pb_service';
import { Router } from '../../types/generated/routerrpc/router_pb_service';
import { Signer } from '../../types/generated/signrpc/signer_pb_service';
import { WalletKit } from '../../types/generated/walletrpc/walletkit_pb_service';
import { Watchtower } from '../../types/generated/watchtowerrpc/watchtower_pb_service';
import { WatchtowerClient } from '../../types/generated/wtclientrpc/wtclient_pb_service';

import WasmClient from './../../index';
import BaseApi from './../base';

import createRpc from './../createRpc';

/** the names and argument types for the subscription events */
interface LndEvents {
    transaction: LND.Transaction.AsObject;
    channel: LND.ChannelEventUpdate.AsObject;
    invoice: LND.Invoice.AsObject;
    peerevent: LND.PeerEvent.AsObject;
}

/**
 * An API wrapper to communicate with the LND node via GRPC
 */
class LndApi extends BaseApi<LndEvents> {
    _wasm: WasmClient;
    // sub-services
    autopilot: any;
    chainNotifier: any;
    invoices: any;
    lightning: any;
    router: any;
    signer: any;
    walletKit: any;
    walletUnlocker: any;
    watchtower: any;
    watchtowerClient: any;

    constructor(wasm: WasmClient) {
        super();
        this._wasm = wasm;
        this.autopilot = createRpc(wasm, Autopilot);
        this.chainNotifier = createRpc(wasm, ChainNotifier);
        this.invoices = createRpc(wasm, Invoices);
        this.lightning = createRpc(wasm, Lightning);
        this.router = createRpc(wasm, Router);
        this.signer = createRpc(wasm, Signer);
        this.walletKit = createRpc(wasm, WalletKit);
        this.walletUnlocker = createRpc(wasm, WalletUnlocker);
        this.watchtower = createRpc(wasm, Watchtower);
        this.watchtowerClient = createRpc(wasm, WatchtowerClient);
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
    ): Promise<LND.GetInfoResponse.AsObject> {
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
            return await this.lightning.getInfo();
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

    /**
     * Connect to the LND streaming endpoints
     */
    connectStreams() {
        this._wasm.subscribe(
            Lightning.SubscribeTransactions,
            new LND.GetTransactionsRequest(),
            (transaction) => this.emit('transaction', transaction.toObject())
        );
        this._wasm.subscribe(
            Lightning.SubscribeChannelEvents,
            new LND.ChannelEventSubscription(),
            (channelEvent) => this.emit('channel', channelEvent.toObject())
        );
        this._wasm.subscribe(
            Lightning.SubscribeInvoices,
            new LND.InvoiceSubscription(),
            (invoiceEvent) => this.emit('invoice', invoiceEvent.toObject())
        );
    }

    //
    // Util funcs
    //

    parseLightningAddress(addr: string): LND.LightningAddress {
        if (!addr.includes('@')) throw new Error('Invalid Lightning Address');
        const [pubkey, host] = addr.split('@');
        const lnAddr = new LND.LightningAddress();
        lnAddr.setPubkey(pubkey);
        lnAddr.setHost(host);
        return lnAddr;
    }
}

export default LndApi;
