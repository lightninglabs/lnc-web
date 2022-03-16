// package: wtclientrpc
// file: wtclientrpc/wtclient.proto

import * as wtclientrpc_wtclient_pb from '../wtclientrpc/wtclient_pb';
import { grpc } from '@improbable-eng/grpc-web';

type WatchtowerClientAddTower = {
    readonly methodName: string;
    readonly service: typeof WatchtowerClient;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof wtclientrpc_wtclient_pb.AddTowerRequest;
    readonly responseType: typeof wtclientrpc_wtclient_pb.AddTowerResponse;
};

type WatchtowerClientRemoveTower = {
    readonly methodName: string;
    readonly service: typeof WatchtowerClient;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof wtclientrpc_wtclient_pb.RemoveTowerRequest;
    readonly responseType: typeof wtclientrpc_wtclient_pb.RemoveTowerResponse;
};

type WatchtowerClientListTowers = {
    readonly methodName: string;
    readonly service: typeof WatchtowerClient;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof wtclientrpc_wtclient_pb.ListTowersRequest;
    readonly responseType: typeof wtclientrpc_wtclient_pb.ListTowersResponse;
};

type WatchtowerClientGetTowerInfo = {
    readonly methodName: string;
    readonly service: typeof WatchtowerClient;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof wtclientrpc_wtclient_pb.GetTowerInfoRequest;
    readonly responseType: typeof wtclientrpc_wtclient_pb.Tower;
};

type WatchtowerClientStats = {
    readonly methodName: string;
    readonly service: typeof WatchtowerClient;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof wtclientrpc_wtclient_pb.StatsRequest;
    readonly responseType: typeof wtclientrpc_wtclient_pb.StatsResponse;
};

type WatchtowerClientPolicy = {
    readonly methodName: string;
    readonly service: typeof WatchtowerClient;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof wtclientrpc_wtclient_pb.PolicyRequest;
    readonly responseType: typeof wtclientrpc_wtclient_pb.PolicyResponse;
};

export class WatchtowerClient {
    static readonly serviceName: string;
    static readonly AddTower: WatchtowerClientAddTower;
    static readonly RemoveTower: WatchtowerClientRemoveTower;
    static readonly ListTowers: WatchtowerClientListTowers;
    static readonly GetTowerInfo: WatchtowerClientGetTowerInfo;
    static readonly Stats: WatchtowerClientStats;
    static readonly Policy: WatchtowerClientPolicy;
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

export class WatchtowerClientClient {
    readonly serviceHost: string;

    constructor(serviceHost: string, options?: grpc.RpcOptions);
    addTower(
        requestMessage: wtclientrpc_wtclient_pb.AddTowerRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: wtclientrpc_wtclient_pb.AddTowerResponse | null
        ) => void
    ): UnaryResponse;
    addTower(
        requestMessage: wtclientrpc_wtclient_pb.AddTowerRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: wtclientrpc_wtclient_pb.AddTowerResponse | null
        ) => void
    ): UnaryResponse;
    removeTower(
        requestMessage: wtclientrpc_wtclient_pb.RemoveTowerRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: wtclientrpc_wtclient_pb.RemoveTowerResponse | null
        ) => void
    ): UnaryResponse;
    removeTower(
        requestMessage: wtclientrpc_wtclient_pb.RemoveTowerRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: wtclientrpc_wtclient_pb.RemoveTowerResponse | null
        ) => void
    ): UnaryResponse;
    listTowers(
        requestMessage: wtclientrpc_wtclient_pb.ListTowersRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: wtclientrpc_wtclient_pb.ListTowersResponse | null
        ) => void
    ): UnaryResponse;
    listTowers(
        requestMessage: wtclientrpc_wtclient_pb.ListTowersRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: wtclientrpc_wtclient_pb.ListTowersResponse | null
        ) => void
    ): UnaryResponse;
    getTowerInfo(
        requestMessage: wtclientrpc_wtclient_pb.GetTowerInfoRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: wtclientrpc_wtclient_pb.Tower | null
        ) => void
    ): UnaryResponse;
    getTowerInfo(
        requestMessage: wtclientrpc_wtclient_pb.GetTowerInfoRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: wtclientrpc_wtclient_pb.Tower | null
        ) => void
    ): UnaryResponse;
    stats(
        requestMessage: wtclientrpc_wtclient_pb.StatsRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: wtclientrpc_wtclient_pb.StatsResponse | null
        ) => void
    ): UnaryResponse;
    stats(
        requestMessage: wtclientrpc_wtclient_pb.StatsRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: wtclientrpc_wtclient_pb.StatsResponse | null
        ) => void
    ): UnaryResponse;
    policy(
        requestMessage: wtclientrpc_wtclient_pb.PolicyRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: wtclientrpc_wtclient_pb.PolicyResponse | null
        ) => void
    ): UnaryResponse;
    policy(
        requestMessage: wtclientrpc_wtclient_pb.PolicyRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: wtclientrpc_wtclient_pb.PolicyResponse | null
        ) => void
    ): UnaryResponse;
}
