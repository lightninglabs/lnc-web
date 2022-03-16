// package: autopilotrpc
// file: autopilotrpc/autopilot.proto

import * as autopilotrpc_autopilot_pb from '../autopilotrpc/autopilot_pb';
import { grpc } from '@improbable-eng/grpc-web';

type AutopilotStatus = {
    readonly methodName: string;
    readonly service: typeof Autopilot;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof autopilotrpc_autopilot_pb.StatusRequest;
    readonly responseType: typeof autopilotrpc_autopilot_pb.StatusResponse;
};

type AutopilotModifyStatus = {
    readonly methodName: string;
    readonly service: typeof Autopilot;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof autopilotrpc_autopilot_pb.ModifyStatusRequest;
    readonly responseType: typeof autopilotrpc_autopilot_pb.ModifyStatusResponse;
};

type AutopilotQueryScores = {
    readonly methodName: string;
    readonly service: typeof Autopilot;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof autopilotrpc_autopilot_pb.QueryScoresRequest;
    readonly responseType: typeof autopilotrpc_autopilot_pb.QueryScoresResponse;
};

type AutopilotSetScores = {
    readonly methodName: string;
    readonly service: typeof Autopilot;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof autopilotrpc_autopilot_pb.SetScoresRequest;
    readonly responseType: typeof autopilotrpc_autopilot_pb.SetScoresResponse;
};

export class Autopilot {
    static readonly serviceName: string;
    static readonly Status: AutopilotStatus;
    static readonly ModifyStatus: AutopilotModifyStatus;
    static readonly QueryScores: AutopilotQueryScores;
    static readonly SetScores: AutopilotSetScores;
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

export class AutopilotClient {
    readonly serviceHost: string;

    constructor(serviceHost: string, options?: grpc.RpcOptions);
    status(
        requestMessage: autopilotrpc_autopilot_pb.StatusRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: autopilotrpc_autopilot_pb.StatusResponse | null
        ) => void
    ): UnaryResponse;
    status(
        requestMessage: autopilotrpc_autopilot_pb.StatusRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: autopilotrpc_autopilot_pb.StatusResponse | null
        ) => void
    ): UnaryResponse;
    modifyStatus(
        requestMessage: autopilotrpc_autopilot_pb.ModifyStatusRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: autopilotrpc_autopilot_pb.ModifyStatusResponse | null
        ) => void
    ): UnaryResponse;
    modifyStatus(
        requestMessage: autopilotrpc_autopilot_pb.ModifyStatusRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: autopilotrpc_autopilot_pb.ModifyStatusResponse | null
        ) => void
    ): UnaryResponse;
    queryScores(
        requestMessage: autopilotrpc_autopilot_pb.QueryScoresRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: autopilotrpc_autopilot_pb.QueryScoresResponse | null
        ) => void
    ): UnaryResponse;
    queryScores(
        requestMessage: autopilotrpc_autopilot_pb.QueryScoresRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: autopilotrpc_autopilot_pb.QueryScoresResponse | null
        ) => void
    ): UnaryResponse;
    setScores(
        requestMessage: autopilotrpc_autopilot_pb.SetScoresRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: autopilotrpc_autopilot_pb.SetScoresResponse | null
        ) => void
    ): UnaryResponse;
    setScores(
        requestMessage: autopilotrpc_autopilot_pb.SetScoresRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: autopilotrpc_autopilot_pb.SetScoresResponse | null
        ) => void
    ): UnaryResponse;
}
