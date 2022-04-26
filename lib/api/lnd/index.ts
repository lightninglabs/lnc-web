import * as LND from '../../types/generated/lightning_pb';
import * as InvoicesRPC from '../../types/generated/invoicesrpc/invoices_pb';
import * as RouterRPC from '../../types/generated/routerrpc/router_pb';

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
    channel: LND.ChannelEventUpdate.AsObject;
    channelBackupSnapshot: LND.ChanBackupSnapshot.AsObject;
    customMessage: LND.CustomMessage.AsObject;
    graphTopologyUpdate: LND.GraphTopologyUpdate.AsObject;
    invoice: LND.Invoice.AsObject;
    peerEvent: LND.PeerEvent.AsObject;
    transaction: LND.Transaction.AsObject;
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

        const invoicesSubscriptions = {
            subscribeSingleInvoice: (
                request: any,
                callback: Function,
                errCallback?: Function
            ): void => {
                const req = new InvoicesRPC.SubscribeSingleInvoiceRequest();
                if (request.r_hash) req.setRHash(request.r_hash);
                this.subscribe(
                    Invoices.SubscribeSingleInvoice,
                    req,
                    callback,
                    errCallback
                );
            }
        };

        const lightningSubscriptions = {
            subscribeChannelBackups: (
                request: any,
                callback: Function,
                errCallback?: Function
            ): void => {
                this.subscribe(
                    Lightning.SubscribeChannelBackups,
                    new LND.ChannelBackupSubscription(),
                    callback,
                    errCallback
                );
            },
            subscribeChannelEvents: (
                request: any,
                callback: Function,
                errCallback?: Function
            ): void => {
                this.subscribe(
                    Lightning.SubscribeChannelEvents,
                    new LND.ChannelEventSubscription(),
                    callback,
                    errCallback
                );
            },
            subscribeChannelGraph: (
                request: any,
                callback: Function,
                errCallback?: Function
            ): void => {
                this.subscribe(
                    Lightning.SubscribeChannelGraph,
                    new LND.GraphTopologySubscription(),
                    callback,
                    errCallback
                );
            },
            subscribeCustomMessages: (
                request: any,
                callback: Function,
                errCallback?: Function
            ): void => {
                this.subscribe(
                    Lightning.SubscribeCustomMessages,
                    new LND.SubscribeCustomMessagesRequest(),
                    callback,
                    errCallback
                );
            },
            subscribeInvoices: (
                request: any,
                callback: Function,
                errCallback?: Function
            ): void => {
                const req = new LND.InvoiceSubscription();
                if (request.add_index) req.setAddIndex(request.add_index);
                if (request.settle_index)
                    req.setSettleIndex(request.settle_index);
                this.subscribe(
                    Lightning.SubscribeInvoices,
                    req,
                    callback,
                    errCallback
                );
            },
            subscribePeerEvents: (
                request: any,
                callback: Function,
                errCallback?: Function
            ): void => {
                this.subscribe(
                    Lightning.SubscribePeerEvents,
                    new LND.PeerEventSubscription(),
                    callback,
                    errCallback
                );
            },
            subscribeTransactions: (
                request: any,
                callback: Function,
                errCallback?: Function
            ): void => {
                const req = new LND.GetTransactionsRequest();
                if (request.start_height)
                    req.setStartHeight(request.start_height);
                if (request.end_height) req.setEndHeight(request.end_height);
                if (request.account) req.setAccount(request.account);
                this.subscribe(
                    Lightning.SubscribeTransactions,
                    req,
                    callback,
                    errCallback
                );
            }
        };

        const routerSubscriptions = {
            subscribeHtlcEvents: (
                request: any,
                callback: Function,
                errCallback?: Function
            ): void => {
                const req = new RouterRPC.SubscribeHtlcEventsRequest();
                this.subscribe(
                    Router.SubscribeHtlcEvents,
                    req,
                    callback,
                    errCallback
                );
            }
        };

        this.autopilot = createRpc(wasm, Autopilot);
        this.chainNotifier = createRpc(wasm, ChainNotifier);
        this.invoices = createRpc(wasm, Invoices, invoicesSubscriptions);
        this.lightning = createRpc(wasm, Lightning, lightningSubscriptions);
        this.router = createRpc(wasm, Router, routerSubscriptions);
        this.signer = createRpc(wasm, Signer);
        this.walletKit = createRpc(wasm, WalletKit);
        this.walletUnlocker = createRpc(wasm, WalletUnlocker);
        this.watchtower = createRpc(wasm, Watchtower);
        this.watchtowerClient = createRpc(wasm, WatchtowerClient);
    }

    /**
     * Connect to the LND streaming endpoints
     */
    connectStreams() {
        this.subscribe(
            Lightning.SubscribeTransactions,
            new LND.GetTransactionsRequest(),
            (transaction: any) =>
                this.emit('transaction', transaction.toObject())
        );
        this.subscribe(
            Lightning.SubscribeChannelEvents,
            new LND.ChannelEventSubscription(),
            (channelEvent: any) => this.emit('channel', channelEvent.toObject())
        );
        this.subscribe(
            Lightning.SubscribeInvoices,
            new LND.InvoiceSubscription(),
            (invoiceEvent: any) => this.emit('invoice', invoiceEvent.toObject())
        );
    }

    subscribe(
        call: any,
        request: any,
        callback?: Function,
        errCallback?: Function
    ) {
        this._wasm.subscribe(
            call,
            request,
            (event) => callback && callback(event.toObject()),
            (event) => errCallback && errCallback(event)
        );
    }
}

export default LndApi;
