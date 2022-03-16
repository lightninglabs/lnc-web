// package: looprpc
// file: debug.proto

import * as debug_pb from './debug_pb';
import { grpc } from '@improbable-eng/grpc-web';

type DebugForceAutoLoop = {
    readonly methodName: string;
    readonly service: typeof Debug;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof debug_pb.ForceAutoLoopRequest;
    readonly responseType: typeof debug_pb.ForceAutoLoopResponse;
};

export class Debug {
    static readonly serviceName: string;
    static readonly ForceAutoLoop: DebugForceAutoLoop;
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

export class DebugClient {
    readonly serviceHost: string;

    constructor(serviceHost: string, options?: grpc.RpcOptions);
    forceAutoLoop(
        requestMessage: debug_pb.ForceAutoLoopRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: debug_pb.ForceAutoLoopResponse | null
        ) => void
    ): UnaryResponse;
    forceAutoLoop(
        requestMessage: debug_pb.ForceAutoLoopRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: debug_pb.ForceAutoLoopResponse | null
        ) => void
    ): UnaryResponse;
}
