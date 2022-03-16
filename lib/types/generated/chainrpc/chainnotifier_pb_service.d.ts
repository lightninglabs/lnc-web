// package: chainrpc
// file: chainrpc/chainnotifier.proto

import * as chainrpc_chainnotifier_pb from '../chainrpc/chainnotifier_pb';
import { grpc } from '@improbable-eng/grpc-web';

type ChainNotifierRegisterConfirmationsNtfn = {
    readonly methodName: string;
    readonly service: typeof ChainNotifier;
    readonly requestStream: false;
    readonly responseStream: true;
    readonly requestType: typeof chainrpc_chainnotifier_pb.ConfRequest;
    readonly responseType: typeof chainrpc_chainnotifier_pb.ConfEvent;
};

type ChainNotifierRegisterSpendNtfn = {
    readonly methodName: string;
    readonly service: typeof ChainNotifier;
    readonly requestStream: false;
    readonly responseStream: true;
    readonly requestType: typeof chainrpc_chainnotifier_pb.SpendRequest;
    readonly responseType: typeof chainrpc_chainnotifier_pb.SpendEvent;
};

type ChainNotifierRegisterBlockEpochNtfn = {
    readonly methodName: string;
    readonly service: typeof ChainNotifier;
    readonly requestStream: false;
    readonly responseStream: true;
    readonly requestType: typeof chainrpc_chainnotifier_pb.BlockEpoch;
    readonly responseType: typeof chainrpc_chainnotifier_pb.BlockEpoch;
};

export class ChainNotifier {
    static readonly serviceName: string;
    static readonly RegisterConfirmationsNtfn: ChainNotifierRegisterConfirmationsNtfn;
    static readonly RegisterSpendNtfn: ChainNotifierRegisterSpendNtfn;
    static readonly RegisterBlockEpochNtfn: ChainNotifierRegisterBlockEpochNtfn;
}

export type ServiceError = {
    message: string;
    code: number;
    metadata: grpc.Metadata;
};
export type Status = { details: string; code: number; metadata: grpc.Metadata };

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
    on(
        type: 'data',
        handler: (message: ResT) => void
    ): BidirectionalStream<ReqT, ResT>;
    on(
        type: 'end',
        handler: (status?: Status) => void
    ): BidirectionalStream<ReqT, ResT>;
    on(
        type: 'status',
        handler: (status: Status) => void
    ): BidirectionalStream<ReqT, ResT>;
}

export class ChainNotifierClient {
    readonly serviceHost: string;

    constructor(serviceHost: string, options?: grpc.RpcOptions);
    registerConfirmationsNtfn(
        requestMessage: chainrpc_chainnotifier_pb.ConfRequest,
        metadata?: grpc.Metadata
    ): ResponseStream<chainrpc_chainnotifier_pb.ConfEvent>;
    registerSpendNtfn(
        requestMessage: chainrpc_chainnotifier_pb.SpendRequest,
        metadata?: grpc.Metadata
    ): ResponseStream<chainrpc_chainnotifier_pb.SpendEvent>;
    registerBlockEpochNtfn(
        requestMessage: chainrpc_chainnotifier_pb.BlockEpoch,
        metadata?: grpc.Metadata
    ): ResponseStream<chainrpc_chainnotifier_pb.BlockEpoch>;
}
