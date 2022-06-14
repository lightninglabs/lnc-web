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
                callback: (data: any) => void,
                errCallback?: (data: any) => void
            ): void => {
                this.subscribe(
                    Invoices.SubscribeSingleInvoice,
                    request,
                    callback,
                    errCallback
                );
            }
        };

        const lightningSubscriptions = {
            closeChannel: (
                request: any,
                callback: (data: any) => void,
                errCallback?: (data: any) => void
            ): void => {
                this.subscribe(
                    Lightning.CloseChannel,
                    request,
                    callback,
                    errCallback
                );
            },
            subscribeChannelBackups: (
                request: any,
                callback: (data: any) => void,
                errCallback?: (data: any) => void
            ): void => {
                this.subscribe(
                    Lightning.SubscribeChannelBackups,
                    request,
                    callback,
                    errCallback
                );
            },
            subscribeChannelEvents: (
                request: any,
                callback: (data: any) => void,
                errCallback?: (data: any) => void
            ): void => {
                this.subscribe(
                    Lightning.SubscribeChannelEvents,
                    request,
                    callback,
                    errCallback
                );
            },
            subscribeChannelGraph: (
                request: any,
                callback: (data: any) => void,
                errCallback?: (data: any) => void
            ): void => {
                this.subscribe(
                    Lightning.SubscribeChannelGraph,
                    request,
                    callback,
                    errCallback
                );
            },
            subscribeCustomMessages: (
                request: any,
                callback: (data: any) => void,
                errCallback?: (data: any) => void
            ): void => {
                this.subscribe(
                    Lightning.SubscribeCustomMessages,
                    request,
                    callback,
                    errCallback
                );
            },
            subscribeInvoices: (
                request: any,
                callback: (data: any) => void,
                errCallback?: (data: any) => void
            ): void => {
                this.subscribe(
                    Lightning.SubscribeInvoices,
                    request,
                    callback,
                    errCallback
                );
            },
            subscribePeerEvents: (
                request: any,
                callback: (data: any) => void,
                errCallback?: (data: any) => void
            ): void => {
                this.subscribe(
                    Lightning.SubscribePeerEvents,
                    request,
                    callback,
                    errCallback
                );
            },
            subscribeTransactions: (
                request: any,
                callback: (data: any) => void,
                errCallback?: (data: any) => void
            ): void => {
                this.subscribe(
                    Lightning.SubscribeTransactions,
                    request,
                    callback,
                    errCallback
                );
            }
        };

        const routerSubscriptions = {
            subscribeHtlcEvents: (
                request: any,
                callback: (data: any) => void,
                errCallback?: (data: any) => void
            ): void => {
                this.subscribe(
                    Router.SubscribeHtlcEvents,
                    request,
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
            {},
            (transaction: any) =>
                this.emit('transaction', transaction.toObject())
        );
        this.subscribe(
            Lightning.SubscribeChannelEvents,
            {},
            (channelEvent: any) => this.emit('channel', channelEvent.toObject())
        );
        this.subscribe(Lightning.SubscribeInvoices, {}, (invoiceEvent: any) =>
            this.emit('invoice', invoiceEvent.toObject())
        );
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

export default LndApi;
