import * as LND from '../../types/generated/lightning_pb';
import WasmClient from './../../index';
import BaseApi from './../base';
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
declare class LndApi extends BaseApi<LndEvents> {
    _wasm: WasmClient;
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
    constructor(wasm: WasmClient);
    /**
     * Downloads the WASM binary and initializes the executable
     */
    load(): Promise<void>;
    /**
     * Uses the WasmClient to connect to the backend LND node via a Terminal
     * Connect proxy server
     * @param server the proxy server to connect to
     * @param phrase the secret pairing phrase to use
     */
    connect(server: string, phrase: string): Promise<LND.GetInfoResponse.AsObject>;
    /**
     * Disconnects from the proxy server
     */
    disconnect(): void;
    subscribe(call: any, request: any, callback?: Function): void;
    /**
     * Connect to the LND streaming endpoints
     */
    connectStreams(): void;
}
export default LndApi;
