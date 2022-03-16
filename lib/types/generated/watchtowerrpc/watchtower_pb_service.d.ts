// package: watchtowerrpc
// file: watchtowerrpc/watchtower.proto

import * as watchtowerrpc_watchtower_pb from "../watchtowerrpc/watchtower_pb";
import {grpc} from "@improbable-eng/grpc-web";

type WatchtowerGetInfo = {
  readonly methodName: string;
  readonly service: typeof Watchtower;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof watchtowerrpc_watchtower_pb.GetInfoRequest;
  readonly responseType: typeof watchtowerrpc_watchtower_pb.GetInfoResponse;
};

export class Watchtower {
  static readonly serviceName: string;
  static readonly GetInfo: WatchtowerGetInfo;
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

export class WatchtowerClient {
  readonly serviceHost: string;

  constructor(serviceHost: string, options?: grpc.RpcOptions);
  getInfo(
    requestMessage: watchtowerrpc_watchtower_pb.GetInfoRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: watchtowerrpc_watchtower_pb.GetInfoResponse|null) => void
  ): UnaryResponse;
  getInfo(
    requestMessage: watchtowerrpc_watchtower_pb.GetInfoRequest,
    callback: (error: ServiceError|null, responseMessage: watchtowerrpc_watchtower_pb.GetInfoResponse|null) => void
  ): UnaryResponse;
}

