// package: signrpc
// file: signrpc/signer.proto

import * as signrpc_signer_pb from "../signrpc/signer_pb";
import {grpc} from "@improbable-eng/grpc-web";

type SignerSignOutputRaw = {
  readonly methodName: string;
  readonly service: typeof Signer;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof signrpc_signer_pb.SignReq;
  readonly responseType: typeof signrpc_signer_pb.SignResp;
};

type SignerComputeInputScript = {
  readonly methodName: string;
  readonly service: typeof Signer;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof signrpc_signer_pb.SignReq;
  readonly responseType: typeof signrpc_signer_pb.InputScriptResp;
};

type SignerSignMessage = {
  readonly methodName: string;
  readonly service: typeof Signer;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof signrpc_signer_pb.SignMessageReq;
  readonly responseType: typeof signrpc_signer_pb.SignMessageResp;
};

type SignerVerifyMessage = {
  readonly methodName: string;
  readonly service: typeof Signer;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof signrpc_signer_pb.VerifyMessageReq;
  readonly responseType: typeof signrpc_signer_pb.VerifyMessageResp;
};

type SignerDeriveSharedKey = {
  readonly methodName: string;
  readonly service: typeof Signer;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof signrpc_signer_pb.SharedKeyRequest;
  readonly responseType: typeof signrpc_signer_pb.SharedKeyResponse;
};

export class Signer {
  static readonly serviceName: string;
  static readonly SignOutputRaw: SignerSignOutputRaw;
  static readonly ComputeInputScript: SignerComputeInputScript;
  static readonly SignMessage: SignerSignMessage;
  static readonly VerifyMessage: SignerVerifyMessage;
  static readonly DeriveSharedKey: SignerDeriveSharedKey;
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

export class SignerClient {
  readonly serviceHost: string;

  constructor(serviceHost: string, options?: grpc.RpcOptions);
  signOutputRaw(
    requestMessage: signrpc_signer_pb.SignReq,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: signrpc_signer_pb.SignResp|null) => void
  ): UnaryResponse;
  signOutputRaw(
    requestMessage: signrpc_signer_pb.SignReq,
    callback: (error: ServiceError|null, responseMessage: signrpc_signer_pb.SignResp|null) => void
  ): UnaryResponse;
  computeInputScript(
    requestMessage: signrpc_signer_pb.SignReq,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: signrpc_signer_pb.InputScriptResp|null) => void
  ): UnaryResponse;
  computeInputScript(
    requestMessage: signrpc_signer_pb.SignReq,
    callback: (error: ServiceError|null, responseMessage: signrpc_signer_pb.InputScriptResp|null) => void
  ): UnaryResponse;
  signMessage(
    requestMessage: signrpc_signer_pb.SignMessageReq,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: signrpc_signer_pb.SignMessageResp|null) => void
  ): UnaryResponse;
  signMessage(
    requestMessage: signrpc_signer_pb.SignMessageReq,
    callback: (error: ServiceError|null, responseMessage: signrpc_signer_pb.SignMessageResp|null) => void
  ): UnaryResponse;
  verifyMessage(
    requestMessage: signrpc_signer_pb.VerifyMessageReq,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: signrpc_signer_pb.VerifyMessageResp|null) => void
  ): UnaryResponse;
  verifyMessage(
    requestMessage: signrpc_signer_pb.VerifyMessageReq,
    callback: (error: ServiceError|null, responseMessage: signrpc_signer_pb.VerifyMessageResp|null) => void
  ): UnaryResponse;
  deriveSharedKey(
    requestMessage: signrpc_signer_pb.SharedKeyRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: signrpc_signer_pb.SharedKeyResponse|null) => void
  ): UnaryResponse;
  deriveSharedKey(
    requestMessage: signrpc_signer_pb.SharedKeyRequest,
    callback: (error: ServiceError|null, responseMessage: signrpc_signer_pb.SharedKeyResponse|null) => void
  ): UnaryResponse;
}

