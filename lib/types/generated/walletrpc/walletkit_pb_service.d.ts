// package: walletrpc
// file: walletrpc/walletkit.proto

import * as walletrpc_walletkit_pb from "../walletrpc/walletkit_pb";
import * as signrpc_signer_pb from "../signrpc/signer_pb";
import {grpc} from "@improbable-eng/grpc-web";

type WalletKitListUnspent = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.ListUnspentRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.ListUnspentResponse;
};

type WalletKitLeaseOutput = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.LeaseOutputRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.LeaseOutputResponse;
};

type WalletKitReleaseOutput = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.ReleaseOutputRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.ReleaseOutputResponse;
};

type WalletKitListLeases = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.ListLeasesRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.ListLeasesResponse;
};

type WalletKitDeriveNextKey = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.KeyReq;
  readonly responseType: typeof signrpc_signer_pb.KeyDescriptor;
};

type WalletKitDeriveKey = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof signrpc_signer_pb.KeyLocator;
  readonly responseType: typeof signrpc_signer_pb.KeyDescriptor;
};

type WalletKitNextAddr = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.AddrRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.AddrResponse;
};

type WalletKitListAccounts = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.ListAccountsRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.ListAccountsResponse;
};

type WalletKitImportAccount = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.ImportAccountRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.ImportAccountResponse;
};

type WalletKitImportPublicKey = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.ImportPublicKeyRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.ImportPublicKeyResponse;
};

type WalletKitPublishTransaction = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.Transaction;
  readonly responseType: typeof walletrpc_walletkit_pb.PublishResponse;
};

type WalletKitSendOutputs = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.SendOutputsRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.SendOutputsResponse;
};

type WalletKitEstimateFee = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.EstimateFeeRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.EstimateFeeResponse;
};

type WalletKitPendingSweeps = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.PendingSweepsRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.PendingSweepsResponse;
};

type WalletKitBumpFee = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.BumpFeeRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.BumpFeeResponse;
};

type WalletKitListSweeps = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.ListSweepsRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.ListSweepsResponse;
};

type WalletKitLabelTransaction = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.LabelTransactionRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.LabelTransactionResponse;
};

type WalletKitFundPsbt = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.FundPsbtRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.FundPsbtResponse;
};

type WalletKitSignPsbt = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.SignPsbtRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.SignPsbtResponse;
};

type WalletKitFinalizePsbt = {
  readonly methodName: string;
  readonly service: typeof WalletKit;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof walletrpc_walletkit_pb.FinalizePsbtRequest;
  readonly responseType: typeof walletrpc_walletkit_pb.FinalizePsbtResponse;
};

export class WalletKit {
  static readonly serviceName: string;
  static readonly ListUnspent: WalletKitListUnspent;
  static readonly LeaseOutput: WalletKitLeaseOutput;
  static readonly ReleaseOutput: WalletKitReleaseOutput;
  static readonly ListLeases: WalletKitListLeases;
  static readonly DeriveNextKey: WalletKitDeriveNextKey;
  static readonly DeriveKey: WalletKitDeriveKey;
  static readonly NextAddr: WalletKitNextAddr;
  static readonly ListAccounts: WalletKitListAccounts;
  static readonly ImportAccount: WalletKitImportAccount;
  static readonly ImportPublicKey: WalletKitImportPublicKey;
  static readonly PublishTransaction: WalletKitPublishTransaction;
  static readonly SendOutputs: WalletKitSendOutputs;
  static readonly EstimateFee: WalletKitEstimateFee;
  static readonly PendingSweeps: WalletKitPendingSweeps;
  static readonly BumpFee: WalletKitBumpFee;
  static readonly ListSweeps: WalletKitListSweeps;
  static readonly LabelTransaction: WalletKitLabelTransaction;
  static readonly FundPsbt: WalletKitFundPsbt;
  static readonly SignPsbt: WalletKitSignPsbt;
  static readonly FinalizePsbt: WalletKitFinalizePsbt;
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

export class WalletKitClient {
  readonly serviceHost: string;

  constructor(serviceHost: string, options?: grpc.RpcOptions);
  listUnspent(
    requestMessage: walletrpc_walletkit_pb.ListUnspentRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.ListUnspentResponse|null) => void
  ): UnaryResponse;
  listUnspent(
    requestMessage: walletrpc_walletkit_pb.ListUnspentRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.ListUnspentResponse|null) => void
  ): UnaryResponse;
  leaseOutput(
    requestMessage: walletrpc_walletkit_pb.LeaseOutputRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.LeaseOutputResponse|null) => void
  ): UnaryResponse;
  leaseOutput(
    requestMessage: walletrpc_walletkit_pb.LeaseOutputRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.LeaseOutputResponse|null) => void
  ): UnaryResponse;
  releaseOutput(
    requestMessage: walletrpc_walletkit_pb.ReleaseOutputRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.ReleaseOutputResponse|null) => void
  ): UnaryResponse;
  releaseOutput(
    requestMessage: walletrpc_walletkit_pb.ReleaseOutputRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.ReleaseOutputResponse|null) => void
  ): UnaryResponse;
  listLeases(
    requestMessage: walletrpc_walletkit_pb.ListLeasesRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.ListLeasesResponse|null) => void
  ): UnaryResponse;
  listLeases(
    requestMessage: walletrpc_walletkit_pb.ListLeasesRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.ListLeasesResponse|null) => void
  ): UnaryResponse;
  deriveNextKey(
    requestMessage: walletrpc_walletkit_pb.KeyReq,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: signrpc_signer_pb.KeyDescriptor|null) => void
  ): UnaryResponse;
  deriveNextKey(
    requestMessage: walletrpc_walletkit_pb.KeyReq,
    callback: (error: ServiceError|null, responseMessage: signrpc_signer_pb.KeyDescriptor|null) => void
  ): UnaryResponse;
  deriveKey(
    requestMessage: signrpc_signer_pb.KeyLocator,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: signrpc_signer_pb.KeyDescriptor|null) => void
  ): UnaryResponse;
  deriveKey(
    requestMessage: signrpc_signer_pb.KeyLocator,
    callback: (error: ServiceError|null, responseMessage: signrpc_signer_pb.KeyDescriptor|null) => void
  ): UnaryResponse;
  nextAddr(
    requestMessage: walletrpc_walletkit_pb.AddrRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.AddrResponse|null) => void
  ): UnaryResponse;
  nextAddr(
    requestMessage: walletrpc_walletkit_pb.AddrRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.AddrResponse|null) => void
  ): UnaryResponse;
  listAccounts(
    requestMessage: walletrpc_walletkit_pb.ListAccountsRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.ListAccountsResponse|null) => void
  ): UnaryResponse;
  listAccounts(
    requestMessage: walletrpc_walletkit_pb.ListAccountsRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.ListAccountsResponse|null) => void
  ): UnaryResponse;
  importAccount(
    requestMessage: walletrpc_walletkit_pb.ImportAccountRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.ImportAccountResponse|null) => void
  ): UnaryResponse;
  importAccount(
    requestMessage: walletrpc_walletkit_pb.ImportAccountRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.ImportAccountResponse|null) => void
  ): UnaryResponse;
  importPublicKey(
    requestMessage: walletrpc_walletkit_pb.ImportPublicKeyRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.ImportPublicKeyResponse|null) => void
  ): UnaryResponse;
  importPublicKey(
    requestMessage: walletrpc_walletkit_pb.ImportPublicKeyRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.ImportPublicKeyResponse|null) => void
  ): UnaryResponse;
  publishTransaction(
    requestMessage: walletrpc_walletkit_pb.Transaction,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.PublishResponse|null) => void
  ): UnaryResponse;
  publishTransaction(
    requestMessage: walletrpc_walletkit_pb.Transaction,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.PublishResponse|null) => void
  ): UnaryResponse;
  sendOutputs(
    requestMessage: walletrpc_walletkit_pb.SendOutputsRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.SendOutputsResponse|null) => void
  ): UnaryResponse;
  sendOutputs(
    requestMessage: walletrpc_walletkit_pb.SendOutputsRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.SendOutputsResponse|null) => void
  ): UnaryResponse;
  estimateFee(
    requestMessage: walletrpc_walletkit_pb.EstimateFeeRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.EstimateFeeResponse|null) => void
  ): UnaryResponse;
  estimateFee(
    requestMessage: walletrpc_walletkit_pb.EstimateFeeRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.EstimateFeeResponse|null) => void
  ): UnaryResponse;
  pendingSweeps(
    requestMessage: walletrpc_walletkit_pb.PendingSweepsRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.PendingSweepsResponse|null) => void
  ): UnaryResponse;
  pendingSweeps(
    requestMessage: walletrpc_walletkit_pb.PendingSweepsRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.PendingSweepsResponse|null) => void
  ): UnaryResponse;
  bumpFee(
    requestMessage: walletrpc_walletkit_pb.BumpFeeRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.BumpFeeResponse|null) => void
  ): UnaryResponse;
  bumpFee(
    requestMessage: walletrpc_walletkit_pb.BumpFeeRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.BumpFeeResponse|null) => void
  ): UnaryResponse;
  listSweeps(
    requestMessage: walletrpc_walletkit_pb.ListSweepsRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.ListSweepsResponse|null) => void
  ): UnaryResponse;
  listSweeps(
    requestMessage: walletrpc_walletkit_pb.ListSweepsRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.ListSweepsResponse|null) => void
  ): UnaryResponse;
  labelTransaction(
    requestMessage: walletrpc_walletkit_pb.LabelTransactionRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.LabelTransactionResponse|null) => void
  ): UnaryResponse;
  labelTransaction(
    requestMessage: walletrpc_walletkit_pb.LabelTransactionRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.LabelTransactionResponse|null) => void
  ): UnaryResponse;
  fundPsbt(
    requestMessage: walletrpc_walletkit_pb.FundPsbtRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.FundPsbtResponse|null) => void
  ): UnaryResponse;
  fundPsbt(
    requestMessage: walletrpc_walletkit_pb.FundPsbtRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.FundPsbtResponse|null) => void
  ): UnaryResponse;
  signPsbt(
    requestMessage: walletrpc_walletkit_pb.SignPsbtRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.SignPsbtResponse|null) => void
  ): UnaryResponse;
  signPsbt(
    requestMessage: walletrpc_walletkit_pb.SignPsbtRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.SignPsbtResponse|null) => void
  ): UnaryResponse;
  finalizePsbt(
    requestMessage: walletrpc_walletkit_pb.FinalizePsbtRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.FinalizePsbtResponse|null) => void
  ): UnaryResponse;
  finalizePsbt(
    requestMessage: walletrpc_walletkit_pb.FinalizePsbtRequest,
    callback: (error: ServiceError|null, responseMessage: walletrpc_walletkit_pb.FinalizePsbtResponse|null) => void
  ): UnaryResponse;
}

