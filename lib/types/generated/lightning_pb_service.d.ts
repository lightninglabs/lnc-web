// package: lnrpc
// file: lightning.proto

import * as lightning_pb from "./lightning_pb";
import {grpc} from "@improbable-eng/grpc-web";

type LightningWalletBalance = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.WalletBalanceRequest;
  readonly responseType: typeof lightning_pb.WalletBalanceResponse;
};

type LightningChannelBalance = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ChannelBalanceRequest;
  readonly responseType: typeof lightning_pb.ChannelBalanceResponse;
};

type LightningGetTransactions = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.GetTransactionsRequest;
  readonly responseType: typeof lightning_pb.TransactionDetails;
};

type LightningEstimateFee = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.EstimateFeeRequest;
  readonly responseType: typeof lightning_pb.EstimateFeeResponse;
};

type LightningSendCoins = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.SendCoinsRequest;
  readonly responseType: typeof lightning_pb.SendCoinsResponse;
};

type LightningListUnspent = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ListUnspentRequest;
  readonly responseType: typeof lightning_pb.ListUnspentResponse;
};

type LightningSubscribeTransactions = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof lightning_pb.GetTransactionsRequest;
  readonly responseType: typeof lightning_pb.Transaction;
};

type LightningSendMany = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.SendManyRequest;
  readonly responseType: typeof lightning_pb.SendManyResponse;
};

type LightningNewAddress = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.NewAddressRequest;
  readonly responseType: typeof lightning_pb.NewAddressResponse;
};

type LightningSignMessage = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.SignMessageRequest;
  readonly responseType: typeof lightning_pb.SignMessageResponse;
};

type LightningVerifyMessage = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.VerifyMessageRequest;
  readonly responseType: typeof lightning_pb.VerifyMessageResponse;
};

type LightningConnectPeer = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ConnectPeerRequest;
  readonly responseType: typeof lightning_pb.ConnectPeerResponse;
};

type LightningDisconnectPeer = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.DisconnectPeerRequest;
  readonly responseType: typeof lightning_pb.DisconnectPeerResponse;
};

type LightningListPeers = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ListPeersRequest;
  readonly responseType: typeof lightning_pb.ListPeersResponse;
};

type LightningSubscribePeerEvents = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof lightning_pb.PeerEventSubscription;
  readonly responseType: typeof lightning_pb.PeerEvent;
};

type LightningGetInfo = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.GetInfoRequest;
  readonly responseType: typeof lightning_pb.GetInfoResponse;
};

type LightningGetRecoveryInfo = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.GetRecoveryInfoRequest;
  readonly responseType: typeof lightning_pb.GetRecoveryInfoResponse;
};

type LightningPendingChannels = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.PendingChannelsRequest;
  readonly responseType: typeof lightning_pb.PendingChannelsResponse;
};

type LightningListChannels = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ListChannelsRequest;
  readonly responseType: typeof lightning_pb.ListChannelsResponse;
};

type LightningSubscribeChannelEvents = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof lightning_pb.ChannelEventSubscription;
  readonly responseType: typeof lightning_pb.ChannelEventUpdate;
};

type LightningClosedChannels = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ClosedChannelsRequest;
  readonly responseType: typeof lightning_pb.ClosedChannelsResponse;
};

type LightningOpenChannelSync = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.OpenChannelRequest;
  readonly responseType: typeof lightning_pb.ChannelPoint;
};

type LightningOpenChannel = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof lightning_pb.OpenChannelRequest;
  readonly responseType: typeof lightning_pb.OpenStatusUpdate;
};

type LightningBatchOpenChannel = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.BatchOpenChannelRequest;
  readonly responseType: typeof lightning_pb.BatchOpenChannelResponse;
};

type LightningFundingStateStep = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.FundingTransitionMsg;
  readonly responseType: typeof lightning_pb.FundingStateStepResp;
};

type LightningChannelAcceptor = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: true;
  readonly responseStream: true;
  readonly requestType: typeof lightning_pb.ChannelAcceptResponse;
  readonly responseType: typeof lightning_pb.ChannelAcceptRequest;
};

type LightningCloseChannel = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof lightning_pb.CloseChannelRequest;
  readonly responseType: typeof lightning_pb.CloseStatusUpdate;
};

type LightningAbandonChannel = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.AbandonChannelRequest;
  readonly responseType: typeof lightning_pb.AbandonChannelResponse;
};

type LightningSendPayment = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: true;
  readonly responseStream: true;
  readonly requestType: typeof lightning_pb.SendRequest;
  readonly responseType: typeof lightning_pb.SendResponse;
};

type LightningSendPaymentSync = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.SendRequest;
  readonly responseType: typeof lightning_pb.SendResponse;
};

type LightningSendToRoute = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: true;
  readonly responseStream: true;
  readonly requestType: typeof lightning_pb.SendToRouteRequest;
  readonly responseType: typeof lightning_pb.SendResponse;
};

type LightningSendToRouteSync = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.SendToRouteRequest;
  readonly responseType: typeof lightning_pb.SendResponse;
};

type LightningAddInvoice = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.Invoice;
  readonly responseType: typeof lightning_pb.AddInvoiceResponse;
};

type LightningListInvoices = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ListInvoiceRequest;
  readonly responseType: typeof lightning_pb.ListInvoiceResponse;
};

type LightningLookupInvoice = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.PaymentHash;
  readonly responseType: typeof lightning_pb.Invoice;
};

type LightningSubscribeInvoices = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof lightning_pb.InvoiceSubscription;
  readonly responseType: typeof lightning_pb.Invoice;
};

type LightningDecodePayReq = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.PayReqString;
  readonly responseType: typeof lightning_pb.PayReq;
};

type LightningListPayments = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ListPaymentsRequest;
  readonly responseType: typeof lightning_pb.ListPaymentsResponse;
};

type LightningDeletePayment = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.DeletePaymentRequest;
  readonly responseType: typeof lightning_pb.DeletePaymentResponse;
};

type LightningDeleteAllPayments = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.DeleteAllPaymentsRequest;
  readonly responseType: typeof lightning_pb.DeleteAllPaymentsResponse;
};

type LightningDescribeGraph = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ChannelGraphRequest;
  readonly responseType: typeof lightning_pb.ChannelGraph;
};

type LightningGetNodeMetrics = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.NodeMetricsRequest;
  readonly responseType: typeof lightning_pb.NodeMetricsResponse;
};

type LightningGetChanInfo = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ChanInfoRequest;
  readonly responseType: typeof lightning_pb.ChannelEdge;
};

type LightningGetNodeInfo = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.NodeInfoRequest;
  readonly responseType: typeof lightning_pb.NodeInfo;
};

type LightningQueryRoutes = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.QueryRoutesRequest;
  readonly responseType: typeof lightning_pb.QueryRoutesResponse;
};

type LightningGetNetworkInfo = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.NetworkInfoRequest;
  readonly responseType: typeof lightning_pb.NetworkInfo;
};

type LightningStopDaemon = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.StopRequest;
  readonly responseType: typeof lightning_pb.StopResponse;
};

type LightningSubscribeChannelGraph = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof lightning_pb.GraphTopologySubscription;
  readonly responseType: typeof lightning_pb.GraphTopologyUpdate;
};

type LightningDebugLevel = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.DebugLevelRequest;
  readonly responseType: typeof lightning_pb.DebugLevelResponse;
};

type LightningFeeReport = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.FeeReportRequest;
  readonly responseType: typeof lightning_pb.FeeReportResponse;
};

type LightningUpdateChannelPolicy = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.PolicyUpdateRequest;
  readonly responseType: typeof lightning_pb.PolicyUpdateResponse;
};

type LightningForwardingHistory = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ForwardingHistoryRequest;
  readonly responseType: typeof lightning_pb.ForwardingHistoryResponse;
};

type LightningExportChannelBackup = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ExportChannelBackupRequest;
  readonly responseType: typeof lightning_pb.ChannelBackup;
};

type LightningExportAllChannelBackups = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ChanBackupExportRequest;
  readonly responseType: typeof lightning_pb.ChanBackupSnapshot;
};

type LightningVerifyChanBackup = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ChanBackupSnapshot;
  readonly responseType: typeof lightning_pb.VerifyChanBackupResponse;
};

type LightningRestoreChannelBackups = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.RestoreChanBackupRequest;
  readonly responseType: typeof lightning_pb.RestoreBackupResponse;
};

type LightningSubscribeChannelBackups = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof lightning_pb.ChannelBackupSubscription;
  readonly responseType: typeof lightning_pb.ChanBackupSnapshot;
};

type LightningBakeMacaroon = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.BakeMacaroonRequest;
  readonly responseType: typeof lightning_pb.BakeMacaroonResponse;
};

type LightningListMacaroonIDs = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ListMacaroonIDsRequest;
  readonly responseType: typeof lightning_pb.ListMacaroonIDsResponse;
};

type LightningDeleteMacaroonID = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.DeleteMacaroonIDRequest;
  readonly responseType: typeof lightning_pb.DeleteMacaroonIDResponse;
};

type LightningListPermissions = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.ListPermissionsRequest;
  readonly responseType: typeof lightning_pb.ListPermissionsResponse;
};

type LightningCheckMacaroonPermissions = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.CheckMacPermRequest;
  readonly responseType: typeof lightning_pb.CheckMacPermResponse;
};

type LightningRegisterRPCMiddleware = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: true;
  readonly responseStream: true;
  readonly requestType: typeof lightning_pb.RPCMiddlewareResponse;
  readonly responseType: typeof lightning_pb.RPCMiddlewareRequest;
};

type LightningSendCustomMessage = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof lightning_pb.SendCustomMessageRequest;
  readonly responseType: typeof lightning_pb.SendCustomMessageResponse;
};

type LightningSubscribeCustomMessages = {
  readonly methodName: string;
  readonly service: typeof Lightning;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof lightning_pb.SubscribeCustomMessagesRequest;
  readonly responseType: typeof lightning_pb.CustomMessage;
};

export class Lightning {
  static readonly serviceName: string;
  static readonly WalletBalance: LightningWalletBalance;
  static readonly ChannelBalance: LightningChannelBalance;
  static readonly GetTransactions: LightningGetTransactions;
  static readonly EstimateFee: LightningEstimateFee;
  static readonly SendCoins: LightningSendCoins;
  static readonly ListUnspent: LightningListUnspent;
  static readonly SubscribeTransactions: LightningSubscribeTransactions;
  static readonly SendMany: LightningSendMany;
  static readonly NewAddress: LightningNewAddress;
  static readonly SignMessage: LightningSignMessage;
  static readonly VerifyMessage: LightningVerifyMessage;
  static readonly ConnectPeer: LightningConnectPeer;
  static readonly DisconnectPeer: LightningDisconnectPeer;
  static readonly ListPeers: LightningListPeers;
  static readonly SubscribePeerEvents: LightningSubscribePeerEvents;
  static readonly GetInfo: LightningGetInfo;
  static readonly GetRecoveryInfo: LightningGetRecoveryInfo;
  static readonly PendingChannels: LightningPendingChannels;
  static readonly ListChannels: LightningListChannels;
  static readonly SubscribeChannelEvents: LightningSubscribeChannelEvents;
  static readonly ClosedChannels: LightningClosedChannels;
  static readonly OpenChannelSync: LightningOpenChannelSync;
  static readonly OpenChannel: LightningOpenChannel;
  static readonly BatchOpenChannel: LightningBatchOpenChannel;
  static readonly FundingStateStep: LightningFundingStateStep;
  static readonly ChannelAcceptor: LightningChannelAcceptor;
  static readonly CloseChannel: LightningCloseChannel;
  static readonly AbandonChannel: LightningAbandonChannel;
  static readonly SendPayment: LightningSendPayment;
  static readonly SendPaymentSync: LightningSendPaymentSync;
  static readonly SendToRoute: LightningSendToRoute;
  static readonly SendToRouteSync: LightningSendToRouteSync;
  static readonly AddInvoice: LightningAddInvoice;
  static readonly ListInvoices: LightningListInvoices;
  static readonly LookupInvoice: LightningLookupInvoice;
  static readonly SubscribeInvoices: LightningSubscribeInvoices;
  static readonly DecodePayReq: LightningDecodePayReq;
  static readonly ListPayments: LightningListPayments;
  static readonly DeletePayment: LightningDeletePayment;
  static readonly DeleteAllPayments: LightningDeleteAllPayments;
  static readonly DescribeGraph: LightningDescribeGraph;
  static readonly GetNodeMetrics: LightningGetNodeMetrics;
  static readonly GetChanInfo: LightningGetChanInfo;
  static readonly GetNodeInfo: LightningGetNodeInfo;
  static readonly QueryRoutes: LightningQueryRoutes;
  static readonly GetNetworkInfo: LightningGetNetworkInfo;
  static readonly StopDaemon: LightningStopDaemon;
  static readonly SubscribeChannelGraph: LightningSubscribeChannelGraph;
  static readonly DebugLevel: LightningDebugLevel;
  static readonly FeeReport: LightningFeeReport;
  static readonly UpdateChannelPolicy: LightningUpdateChannelPolicy;
  static readonly ForwardingHistory: LightningForwardingHistory;
  static readonly ExportChannelBackup: LightningExportChannelBackup;
  static readonly ExportAllChannelBackups: LightningExportAllChannelBackups;
  static readonly VerifyChanBackup: LightningVerifyChanBackup;
  static readonly RestoreChannelBackups: LightningRestoreChannelBackups;
  static readonly SubscribeChannelBackups: LightningSubscribeChannelBackups;
  static readonly BakeMacaroon: LightningBakeMacaroon;
  static readonly ListMacaroonIDs: LightningListMacaroonIDs;
  static readonly DeleteMacaroonID: LightningDeleteMacaroonID;
  static readonly ListPermissions: LightningListPermissions;
  static readonly CheckMacaroonPermissions: LightningCheckMacaroonPermissions;
  static readonly RegisterRPCMiddleware: LightningRegisterRPCMiddleware;
  static readonly SendCustomMessage: LightningSendCustomMessage;
  static readonly SubscribeCustomMessages: LightningSubscribeCustomMessages;
}

export type ServiceError = { message: string, code: number; metadata: grpc.Metadata }
export type Status = { details: string, code: number; metadata: grpc.Metadata }

interface UnaryResponse {
  cancel(): void;
}
interface ResponseStream<T> {
  cancel(): void;
  on(type: 'data', handler: (message: T) => void): ResponseStream<T>;
  on(type: 'end', handler: (status?: Status) => void): ResponseStream<T>;
  on(type: 'status', handler: (status: Status) => void): ResponseStream<T>;
}
interface RequestStream<T> {
  write(message: T): RequestStream<T>;
  end(): void;
  cancel(): void;
  on(type: 'end', handler: (status?: Status) => void): RequestStream<T>;
  on(type: 'status', handler: (status: Status) => void): RequestStream<T>;
}
interface BidirectionalStream<ReqT, ResT> {
  write(message: ReqT): BidirectionalStream<ReqT, ResT>;
  end(): void;
  cancel(): void;
  on(type: 'data', handler: (message: ResT) => void): BidirectionalStream<ReqT, ResT>;
  on(type: 'end', handler: (status?: Status) => void): BidirectionalStream<ReqT, ResT>;
  on(type: 'status', handler: (status: Status) => void): BidirectionalStream<ReqT, ResT>;
}

export class LightningClient {
  readonly serviceHost: string;

  constructor(serviceHost: string, options?: grpc.RpcOptions);
  walletBalance(
    requestMessage: lightning_pb.WalletBalanceRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.WalletBalanceResponse|null) => void
  ): UnaryResponse;
  walletBalance(
    requestMessage: lightning_pb.WalletBalanceRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.WalletBalanceResponse|null) => void
  ): UnaryResponse;
  channelBalance(
    requestMessage: lightning_pb.ChannelBalanceRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ChannelBalanceResponse|null) => void
  ): UnaryResponse;
  channelBalance(
    requestMessage: lightning_pb.ChannelBalanceRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ChannelBalanceResponse|null) => void
  ): UnaryResponse;
  getTransactions(
    requestMessage: lightning_pb.GetTransactionsRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.TransactionDetails|null) => void
  ): UnaryResponse;
  getTransactions(
    requestMessage: lightning_pb.GetTransactionsRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.TransactionDetails|null) => void
  ): UnaryResponse;
  estimateFee(
    requestMessage: lightning_pb.EstimateFeeRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.EstimateFeeResponse|null) => void
  ): UnaryResponse;
  estimateFee(
    requestMessage: lightning_pb.EstimateFeeRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.EstimateFeeResponse|null) => void
  ): UnaryResponse;
  sendCoins(
    requestMessage: lightning_pb.SendCoinsRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.SendCoinsResponse|null) => void
  ): UnaryResponse;
  sendCoins(
    requestMessage: lightning_pb.SendCoinsRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.SendCoinsResponse|null) => void
  ): UnaryResponse;
  listUnspent(
    requestMessage: lightning_pb.ListUnspentRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ListUnspentResponse|null) => void
  ): UnaryResponse;
  listUnspent(
    requestMessage: lightning_pb.ListUnspentRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ListUnspentResponse|null) => void
  ): UnaryResponse;
  subscribeTransactions(requestMessage: lightning_pb.GetTransactionsRequest, metadata?: grpc.Metadata): ResponseStream<lightning_pb.Transaction>;
  sendMany(
    requestMessage: lightning_pb.SendManyRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.SendManyResponse|null) => void
  ): UnaryResponse;
  sendMany(
    requestMessage: lightning_pb.SendManyRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.SendManyResponse|null) => void
  ): UnaryResponse;
  newAddress(
    requestMessage: lightning_pb.NewAddressRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.NewAddressResponse|null) => void
  ): UnaryResponse;
  newAddress(
    requestMessage: lightning_pb.NewAddressRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.NewAddressResponse|null) => void
  ): UnaryResponse;
  signMessage(
    requestMessage: lightning_pb.SignMessageRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.SignMessageResponse|null) => void
  ): UnaryResponse;
  signMessage(
    requestMessage: lightning_pb.SignMessageRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.SignMessageResponse|null) => void
  ): UnaryResponse;
  verifyMessage(
    requestMessage: lightning_pb.VerifyMessageRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.VerifyMessageResponse|null) => void
  ): UnaryResponse;
  verifyMessage(
    requestMessage: lightning_pb.VerifyMessageRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.VerifyMessageResponse|null) => void
  ): UnaryResponse;
  connectPeer(
    requestMessage: lightning_pb.ConnectPeerRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ConnectPeerResponse|null) => void
  ): UnaryResponse;
  connectPeer(
    requestMessage: lightning_pb.ConnectPeerRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ConnectPeerResponse|null) => void
  ): UnaryResponse;
  disconnectPeer(
    requestMessage: lightning_pb.DisconnectPeerRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.DisconnectPeerResponse|null) => void
  ): UnaryResponse;
  disconnectPeer(
    requestMessage: lightning_pb.DisconnectPeerRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.DisconnectPeerResponse|null) => void
  ): UnaryResponse;
  listPeers(
    requestMessage: lightning_pb.ListPeersRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ListPeersResponse|null) => void
  ): UnaryResponse;
  listPeers(
    requestMessage: lightning_pb.ListPeersRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ListPeersResponse|null) => void
  ): UnaryResponse;
  subscribePeerEvents(requestMessage: lightning_pb.PeerEventSubscription, metadata?: grpc.Metadata): ResponseStream<lightning_pb.PeerEvent>;
  getInfo(
    requestMessage: lightning_pb.GetInfoRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.GetInfoResponse|null) => void
  ): UnaryResponse;
  getInfo(
    requestMessage: lightning_pb.GetInfoRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.GetInfoResponse|null) => void
  ): UnaryResponse;
  getRecoveryInfo(
    requestMessage: lightning_pb.GetRecoveryInfoRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.GetRecoveryInfoResponse|null) => void
  ): UnaryResponse;
  getRecoveryInfo(
    requestMessage: lightning_pb.GetRecoveryInfoRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.GetRecoveryInfoResponse|null) => void
  ): UnaryResponse;
  pendingChannels(
    requestMessage: lightning_pb.PendingChannelsRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.PendingChannelsResponse|null) => void
  ): UnaryResponse;
  pendingChannels(
    requestMessage: lightning_pb.PendingChannelsRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.PendingChannelsResponse|null) => void
  ): UnaryResponse;
  listChannels(
    requestMessage: lightning_pb.ListChannelsRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ListChannelsResponse|null) => void
  ): UnaryResponse;
  listChannels(
    requestMessage: lightning_pb.ListChannelsRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ListChannelsResponse|null) => void
  ): UnaryResponse;
  subscribeChannelEvents(requestMessage: lightning_pb.ChannelEventSubscription, metadata?: grpc.Metadata): ResponseStream<lightning_pb.ChannelEventUpdate>;
  closedChannels(
    requestMessage: lightning_pb.ClosedChannelsRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ClosedChannelsResponse|null) => void
  ): UnaryResponse;
  closedChannels(
    requestMessage: lightning_pb.ClosedChannelsRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ClosedChannelsResponse|null) => void
  ): UnaryResponse;
  openChannelSync(
    requestMessage: lightning_pb.OpenChannelRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ChannelPoint|null) => void
  ): UnaryResponse;
  openChannelSync(
    requestMessage: lightning_pb.OpenChannelRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ChannelPoint|null) => void
  ): UnaryResponse;
  openChannel(requestMessage: lightning_pb.OpenChannelRequest, metadata?: grpc.Metadata): ResponseStream<lightning_pb.OpenStatusUpdate>;
  batchOpenChannel(
    requestMessage: lightning_pb.BatchOpenChannelRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.BatchOpenChannelResponse|null) => void
  ): UnaryResponse;
  batchOpenChannel(
    requestMessage: lightning_pb.BatchOpenChannelRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.BatchOpenChannelResponse|null) => void
  ): UnaryResponse;
  fundingStateStep(
    requestMessage: lightning_pb.FundingTransitionMsg,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.FundingStateStepResp|null) => void
  ): UnaryResponse;
  fundingStateStep(
    requestMessage: lightning_pb.FundingTransitionMsg,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.FundingStateStepResp|null) => void
  ): UnaryResponse;
  channelAcceptor(metadata?: grpc.Metadata): BidirectionalStream<lightning_pb.ChannelAcceptResponse, lightning_pb.ChannelAcceptRequest>;
  closeChannel(requestMessage: lightning_pb.CloseChannelRequest, metadata?: grpc.Metadata): ResponseStream<lightning_pb.CloseStatusUpdate>;
  abandonChannel(
    requestMessage: lightning_pb.AbandonChannelRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.AbandonChannelResponse|null) => void
  ): UnaryResponse;
  abandonChannel(
    requestMessage: lightning_pb.AbandonChannelRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.AbandonChannelResponse|null) => void
  ): UnaryResponse;
  sendPayment(metadata?: grpc.Metadata): BidirectionalStream<lightning_pb.SendRequest, lightning_pb.SendResponse>;
  sendPaymentSync(
    requestMessage: lightning_pb.SendRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.SendResponse|null) => void
  ): UnaryResponse;
  sendPaymentSync(
    requestMessage: lightning_pb.SendRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.SendResponse|null) => void
  ): UnaryResponse;
  sendToRoute(metadata?: grpc.Metadata): BidirectionalStream<lightning_pb.SendToRouteRequest, lightning_pb.SendResponse>;
  sendToRouteSync(
    requestMessage: lightning_pb.SendToRouteRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.SendResponse|null) => void
  ): UnaryResponse;
  sendToRouteSync(
    requestMessage: lightning_pb.SendToRouteRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.SendResponse|null) => void
  ): UnaryResponse;
  addInvoice(
    requestMessage: lightning_pb.Invoice,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.AddInvoiceResponse|null) => void
  ): UnaryResponse;
  addInvoice(
    requestMessage: lightning_pb.Invoice,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.AddInvoiceResponse|null) => void
  ): UnaryResponse;
  listInvoices(
    requestMessage: lightning_pb.ListInvoiceRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ListInvoiceResponse|null) => void
  ): UnaryResponse;
  listInvoices(
    requestMessage: lightning_pb.ListInvoiceRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ListInvoiceResponse|null) => void
  ): UnaryResponse;
  lookupInvoice(
    requestMessage: lightning_pb.PaymentHash,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.Invoice|null) => void
  ): UnaryResponse;
  lookupInvoice(
    requestMessage: lightning_pb.PaymentHash,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.Invoice|null) => void
  ): UnaryResponse;
  subscribeInvoices(requestMessage: lightning_pb.InvoiceSubscription, metadata?: grpc.Metadata): ResponseStream<lightning_pb.Invoice>;
  decodePayReq(
    requestMessage: lightning_pb.PayReqString,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.PayReq|null) => void
  ): UnaryResponse;
  decodePayReq(
    requestMessage: lightning_pb.PayReqString,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.PayReq|null) => void
  ): UnaryResponse;
  listPayments(
    requestMessage: lightning_pb.ListPaymentsRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ListPaymentsResponse|null) => void
  ): UnaryResponse;
  listPayments(
    requestMessage: lightning_pb.ListPaymentsRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ListPaymentsResponse|null) => void
  ): UnaryResponse;
  deletePayment(
    requestMessage: lightning_pb.DeletePaymentRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.DeletePaymentResponse|null) => void
  ): UnaryResponse;
  deletePayment(
    requestMessage: lightning_pb.DeletePaymentRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.DeletePaymentResponse|null) => void
  ): UnaryResponse;
  deleteAllPayments(
    requestMessage: lightning_pb.DeleteAllPaymentsRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.DeleteAllPaymentsResponse|null) => void
  ): UnaryResponse;
  deleteAllPayments(
    requestMessage: lightning_pb.DeleteAllPaymentsRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.DeleteAllPaymentsResponse|null) => void
  ): UnaryResponse;
  describeGraph(
    requestMessage: lightning_pb.ChannelGraphRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ChannelGraph|null) => void
  ): UnaryResponse;
  describeGraph(
    requestMessage: lightning_pb.ChannelGraphRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ChannelGraph|null) => void
  ): UnaryResponse;
  getNodeMetrics(
    requestMessage: lightning_pb.NodeMetricsRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.NodeMetricsResponse|null) => void
  ): UnaryResponse;
  getNodeMetrics(
    requestMessage: lightning_pb.NodeMetricsRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.NodeMetricsResponse|null) => void
  ): UnaryResponse;
  getChanInfo(
    requestMessage: lightning_pb.ChanInfoRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ChannelEdge|null) => void
  ): UnaryResponse;
  getChanInfo(
    requestMessage: lightning_pb.ChanInfoRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ChannelEdge|null) => void
  ): UnaryResponse;
  getNodeInfo(
    requestMessage: lightning_pb.NodeInfoRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.NodeInfo|null) => void
  ): UnaryResponse;
  getNodeInfo(
    requestMessage: lightning_pb.NodeInfoRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.NodeInfo|null) => void
  ): UnaryResponse;
  queryRoutes(
    requestMessage: lightning_pb.QueryRoutesRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.QueryRoutesResponse|null) => void
  ): UnaryResponse;
  queryRoutes(
    requestMessage: lightning_pb.QueryRoutesRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.QueryRoutesResponse|null) => void
  ): UnaryResponse;
  getNetworkInfo(
    requestMessage: lightning_pb.NetworkInfoRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.NetworkInfo|null) => void
  ): UnaryResponse;
  getNetworkInfo(
    requestMessage: lightning_pb.NetworkInfoRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.NetworkInfo|null) => void
  ): UnaryResponse;
  stopDaemon(
    requestMessage: lightning_pb.StopRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.StopResponse|null) => void
  ): UnaryResponse;
  stopDaemon(
    requestMessage: lightning_pb.StopRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.StopResponse|null) => void
  ): UnaryResponse;
  subscribeChannelGraph(requestMessage: lightning_pb.GraphTopologySubscription, metadata?: grpc.Metadata): ResponseStream<lightning_pb.GraphTopologyUpdate>;
  debugLevel(
    requestMessage: lightning_pb.DebugLevelRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.DebugLevelResponse|null) => void
  ): UnaryResponse;
  debugLevel(
    requestMessage: lightning_pb.DebugLevelRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.DebugLevelResponse|null) => void
  ): UnaryResponse;
  feeReport(
    requestMessage: lightning_pb.FeeReportRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.FeeReportResponse|null) => void
  ): UnaryResponse;
  feeReport(
    requestMessage: lightning_pb.FeeReportRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.FeeReportResponse|null) => void
  ): UnaryResponse;
  updateChannelPolicy(
    requestMessage: lightning_pb.PolicyUpdateRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.PolicyUpdateResponse|null) => void
  ): UnaryResponse;
  updateChannelPolicy(
    requestMessage: lightning_pb.PolicyUpdateRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.PolicyUpdateResponse|null) => void
  ): UnaryResponse;
  forwardingHistory(
    requestMessage: lightning_pb.ForwardingHistoryRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ForwardingHistoryResponse|null) => void
  ): UnaryResponse;
  forwardingHistory(
    requestMessage: lightning_pb.ForwardingHistoryRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ForwardingHistoryResponse|null) => void
  ): UnaryResponse;
  exportChannelBackup(
    requestMessage: lightning_pb.ExportChannelBackupRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ChannelBackup|null) => void
  ): UnaryResponse;
  exportChannelBackup(
    requestMessage: lightning_pb.ExportChannelBackupRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ChannelBackup|null) => void
  ): UnaryResponse;
  exportAllChannelBackups(
    requestMessage: lightning_pb.ChanBackupExportRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ChanBackupSnapshot|null) => void
  ): UnaryResponse;
  exportAllChannelBackups(
    requestMessage: lightning_pb.ChanBackupExportRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ChanBackupSnapshot|null) => void
  ): UnaryResponse;
  verifyChanBackup(
    requestMessage: lightning_pb.ChanBackupSnapshot,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.VerifyChanBackupResponse|null) => void
  ): UnaryResponse;
  verifyChanBackup(
    requestMessage: lightning_pb.ChanBackupSnapshot,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.VerifyChanBackupResponse|null) => void
  ): UnaryResponse;
  restoreChannelBackups(
    requestMessage: lightning_pb.RestoreChanBackupRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.RestoreBackupResponse|null) => void
  ): UnaryResponse;
  restoreChannelBackups(
    requestMessage: lightning_pb.RestoreChanBackupRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.RestoreBackupResponse|null) => void
  ): UnaryResponse;
  subscribeChannelBackups(requestMessage: lightning_pb.ChannelBackupSubscription, metadata?: grpc.Metadata): ResponseStream<lightning_pb.ChanBackupSnapshot>;
  bakeMacaroon(
    requestMessage: lightning_pb.BakeMacaroonRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.BakeMacaroonResponse|null) => void
  ): UnaryResponse;
  bakeMacaroon(
    requestMessage: lightning_pb.BakeMacaroonRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.BakeMacaroonResponse|null) => void
  ): UnaryResponse;
  listMacaroonIDs(
    requestMessage: lightning_pb.ListMacaroonIDsRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ListMacaroonIDsResponse|null) => void
  ): UnaryResponse;
  listMacaroonIDs(
    requestMessage: lightning_pb.ListMacaroonIDsRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ListMacaroonIDsResponse|null) => void
  ): UnaryResponse;
  deleteMacaroonID(
    requestMessage: lightning_pb.DeleteMacaroonIDRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.DeleteMacaroonIDResponse|null) => void
  ): UnaryResponse;
  deleteMacaroonID(
    requestMessage: lightning_pb.DeleteMacaroonIDRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.DeleteMacaroonIDResponse|null) => void
  ): UnaryResponse;
  listPermissions(
    requestMessage: lightning_pb.ListPermissionsRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ListPermissionsResponse|null) => void
  ): UnaryResponse;
  listPermissions(
    requestMessage: lightning_pb.ListPermissionsRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.ListPermissionsResponse|null) => void
  ): UnaryResponse;
  checkMacaroonPermissions(
    requestMessage: lightning_pb.CheckMacPermRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.CheckMacPermResponse|null) => void
  ): UnaryResponse;
  checkMacaroonPermissions(
    requestMessage: lightning_pb.CheckMacPermRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.CheckMacPermResponse|null) => void
  ): UnaryResponse;
  registerRPCMiddleware(metadata?: grpc.Metadata): BidirectionalStream<lightning_pb.RPCMiddlewareResponse, lightning_pb.RPCMiddlewareRequest>;
  sendCustomMessage(
    requestMessage: lightning_pb.SendCustomMessageRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.SendCustomMessageResponse|null) => void
  ): UnaryResponse;
  sendCustomMessage(
    requestMessage: lightning_pb.SendCustomMessageRequest,
    callback: (error: ServiceError|null, responseMessage: lightning_pb.SendCustomMessageResponse|null) => void
  ): UnaryResponse;
  subscribeCustomMessages(requestMessage: lightning_pb.SubscribeCustomMessagesRequest, metadata?: grpc.Metadata): ResponseStream<lightning_pb.CustomMessage>;
}

