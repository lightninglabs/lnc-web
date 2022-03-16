// package: poolrpc
// file: auctioneerrpc/hashmail.proto

import * as auctioneerrpc_hashmail_pb from '../auctioneerrpc/hashmail_pb';
import { grpc } from '@improbable-eng/grpc-web';

type HashMailNewCipherBox = {
    readonly methodName: string;
    readonly service: typeof HashMail;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof auctioneerrpc_hashmail_pb.CipherBoxAuth;
    readonly responseType: typeof auctioneerrpc_hashmail_pb.CipherInitResp;
};

type HashMailDelCipherBox = {
    readonly methodName: string;
    readonly service: typeof HashMail;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof auctioneerrpc_hashmail_pb.CipherBoxAuth;
    readonly responseType: typeof auctioneerrpc_hashmail_pb.DelCipherBoxResp;
};

type HashMailSendStream = {
    readonly methodName: string;
    readonly service: typeof HashMail;
    readonly requestStream: true;
    readonly responseStream: false;
    readonly requestType: typeof auctioneerrpc_hashmail_pb.CipherBox;
    readonly responseType: typeof auctioneerrpc_hashmail_pb.CipherBoxDesc;
};

type HashMailRecvStream = {
    readonly methodName: string;
    readonly service: typeof HashMail;
    readonly requestStream: false;
    readonly responseStream: true;
    readonly requestType: typeof auctioneerrpc_hashmail_pb.CipherBoxDesc;
    readonly responseType: typeof auctioneerrpc_hashmail_pb.CipherBox;
};

export class HashMail {
    static readonly serviceName: string;
    static readonly NewCipherBox: HashMailNewCipherBox;
    static readonly DelCipherBox: HashMailDelCipherBox;
    static readonly SendStream: HashMailSendStream;
    static readonly RecvStream: HashMailRecvStream;
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

export class HashMailClient {
    readonly serviceHost: string;

    constructor(serviceHost: string, options?: grpc.RpcOptions);
    newCipherBox(
        requestMessage: auctioneerrpc_hashmail_pb.CipherBoxAuth,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: auctioneerrpc_hashmail_pb.CipherInitResp | null
        ) => void
    ): UnaryResponse;
    newCipherBox(
        requestMessage: auctioneerrpc_hashmail_pb.CipherBoxAuth,
        callback: (
            error: ServiceError | null,
            responseMessage: auctioneerrpc_hashmail_pb.CipherInitResp | null
        ) => void
    ): UnaryResponse;
    delCipherBox(
        requestMessage: auctioneerrpc_hashmail_pb.CipherBoxAuth,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: auctioneerrpc_hashmail_pb.DelCipherBoxResp | null
        ) => void
    ): UnaryResponse;
    delCipherBox(
        requestMessage: auctioneerrpc_hashmail_pb.CipherBoxAuth,
        callback: (
            error: ServiceError | null,
            responseMessage: auctioneerrpc_hashmail_pb.DelCipherBoxResp | null
        ) => void
    ): UnaryResponse;
    sendStream(
        metadata?: grpc.Metadata
    ): RequestStream<auctioneerrpc_hashmail_pb.CipherBox>;
    recvStream(
        requestMessage: auctioneerrpc_hashmail_pb.CipherBoxDesc,
        metadata?: grpc.Metadata
    ): ResponseStream<auctioneerrpc_hashmail_pb.CipherBox>;
}
