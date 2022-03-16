// package: lnrpc
// file: walletunlocker.proto

import * as walletunlocker_pb from './walletunlocker_pb';
import { grpc } from '@improbable-eng/grpc-web';

type WalletUnlockerGenSeed = {
    readonly methodName: string;
    readonly service: typeof WalletUnlocker;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof walletunlocker_pb.GenSeedRequest;
    readonly responseType: typeof walletunlocker_pb.GenSeedResponse;
};

type WalletUnlockerInitWallet = {
    readonly methodName: string;
    readonly service: typeof WalletUnlocker;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof walletunlocker_pb.InitWalletRequest;
    readonly responseType: typeof walletunlocker_pb.InitWalletResponse;
};

type WalletUnlockerUnlockWallet = {
    readonly methodName: string;
    readonly service: typeof WalletUnlocker;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof walletunlocker_pb.UnlockWalletRequest;
    readonly responseType: typeof walletunlocker_pb.UnlockWalletResponse;
};

type WalletUnlockerChangePassword = {
    readonly methodName: string;
    readonly service: typeof WalletUnlocker;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof walletunlocker_pb.ChangePasswordRequest;
    readonly responseType: typeof walletunlocker_pb.ChangePasswordResponse;
};

export class WalletUnlocker {
    static readonly serviceName: string;
    static readonly GenSeed: WalletUnlockerGenSeed;
    static readonly InitWallet: WalletUnlockerInitWallet;
    static readonly UnlockWallet: WalletUnlockerUnlockWallet;
    static readonly ChangePassword: WalletUnlockerChangePassword;
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

export class WalletUnlockerClient {
    readonly serviceHost: string;

    constructor(serviceHost: string, options?: grpc.RpcOptions);
    genSeed(
        requestMessage: walletunlocker_pb.GenSeedRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: walletunlocker_pb.GenSeedResponse | null
        ) => void
    ): UnaryResponse;
    genSeed(
        requestMessage: walletunlocker_pb.GenSeedRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: walletunlocker_pb.GenSeedResponse | null
        ) => void
    ): UnaryResponse;
    initWallet(
        requestMessage: walletunlocker_pb.InitWalletRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: walletunlocker_pb.InitWalletResponse | null
        ) => void
    ): UnaryResponse;
    initWallet(
        requestMessage: walletunlocker_pb.InitWalletRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: walletunlocker_pb.InitWalletResponse | null
        ) => void
    ): UnaryResponse;
    unlockWallet(
        requestMessage: walletunlocker_pb.UnlockWalletRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: walletunlocker_pb.UnlockWalletResponse | null
        ) => void
    ): UnaryResponse;
    unlockWallet(
        requestMessage: walletunlocker_pb.UnlockWalletRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: walletunlocker_pb.UnlockWalletResponse | null
        ) => void
    ): UnaryResponse;
    changePassword(
        requestMessage: walletunlocker_pb.ChangePasswordRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: walletunlocker_pb.ChangePasswordResponse | null
        ) => void
    ): UnaryResponse;
    changePassword(
        requestMessage: walletunlocker_pb.ChangePasswordRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: walletunlocker_pb.ChangePasswordResponse | null
        ) => void
    ): UnaryResponse;
}
