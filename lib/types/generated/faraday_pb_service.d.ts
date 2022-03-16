// package: frdrpc
// file: faraday.proto

import * as faraday_pb from './faraday_pb';
import { grpc } from '@improbable-eng/grpc-web';

type FaradayServerOutlierRecommendations = {
    readonly methodName: string;
    readonly service: typeof FaradayServer;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof faraday_pb.OutlierRecommendationsRequest;
    readonly responseType: typeof faraday_pb.CloseRecommendationsResponse;
};

type FaradayServerThresholdRecommendations = {
    readonly methodName: string;
    readonly service: typeof FaradayServer;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof faraday_pb.ThresholdRecommendationsRequest;
    readonly responseType: typeof faraday_pb.CloseRecommendationsResponse;
};

type FaradayServerRevenueReport = {
    readonly methodName: string;
    readonly service: typeof FaradayServer;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof faraday_pb.RevenueReportRequest;
    readonly responseType: typeof faraday_pb.RevenueReportResponse;
};

type FaradayServerChannelInsights = {
    readonly methodName: string;
    readonly service: typeof FaradayServer;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof faraday_pb.ChannelInsightsRequest;
    readonly responseType: typeof faraday_pb.ChannelInsightsResponse;
};

type FaradayServerExchangeRate = {
    readonly methodName: string;
    readonly service: typeof FaradayServer;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof faraday_pb.ExchangeRateRequest;
    readonly responseType: typeof faraday_pb.ExchangeRateResponse;
};

type FaradayServerNodeAudit = {
    readonly methodName: string;
    readonly service: typeof FaradayServer;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof faraday_pb.NodeAuditRequest;
    readonly responseType: typeof faraday_pb.NodeAuditResponse;
};

type FaradayServerCloseReport = {
    readonly methodName: string;
    readonly service: typeof FaradayServer;
    readonly requestStream: false;
    readonly responseStream: false;
    readonly requestType: typeof faraday_pb.CloseReportRequest;
    readonly responseType: typeof faraday_pb.CloseReportResponse;
};

export class FaradayServer {
    static readonly serviceName: string;
    static readonly OutlierRecommendations: FaradayServerOutlierRecommendations;
    static readonly ThresholdRecommendations: FaradayServerThresholdRecommendations;
    static readonly RevenueReport: FaradayServerRevenueReport;
    static readonly ChannelInsights: FaradayServerChannelInsights;
    static readonly ExchangeRate: FaradayServerExchangeRate;
    static readonly NodeAudit: FaradayServerNodeAudit;
    static readonly CloseReport: FaradayServerCloseReport;
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

export class FaradayServerClient {
    readonly serviceHost: string;

    constructor(serviceHost: string, options?: grpc.RpcOptions);
    outlierRecommendations(
        requestMessage: faraday_pb.OutlierRecommendationsRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: faraday_pb.CloseRecommendationsResponse | null
        ) => void
    ): UnaryResponse;
    outlierRecommendations(
        requestMessage: faraday_pb.OutlierRecommendationsRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: faraday_pb.CloseRecommendationsResponse | null
        ) => void
    ): UnaryResponse;
    thresholdRecommendations(
        requestMessage: faraday_pb.ThresholdRecommendationsRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: faraday_pb.CloseRecommendationsResponse | null
        ) => void
    ): UnaryResponse;
    thresholdRecommendations(
        requestMessage: faraday_pb.ThresholdRecommendationsRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: faraday_pb.CloseRecommendationsResponse | null
        ) => void
    ): UnaryResponse;
    revenueReport(
        requestMessage: faraday_pb.RevenueReportRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: faraday_pb.RevenueReportResponse | null
        ) => void
    ): UnaryResponse;
    revenueReport(
        requestMessage: faraday_pb.RevenueReportRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: faraday_pb.RevenueReportResponse | null
        ) => void
    ): UnaryResponse;
    channelInsights(
        requestMessage: faraday_pb.ChannelInsightsRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: faraday_pb.ChannelInsightsResponse | null
        ) => void
    ): UnaryResponse;
    channelInsights(
        requestMessage: faraday_pb.ChannelInsightsRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: faraday_pb.ChannelInsightsResponse | null
        ) => void
    ): UnaryResponse;
    exchangeRate(
        requestMessage: faraday_pb.ExchangeRateRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: faraday_pb.ExchangeRateResponse | null
        ) => void
    ): UnaryResponse;
    exchangeRate(
        requestMessage: faraday_pb.ExchangeRateRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: faraday_pb.ExchangeRateResponse | null
        ) => void
    ): UnaryResponse;
    nodeAudit(
        requestMessage: faraday_pb.NodeAuditRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: faraday_pb.NodeAuditResponse | null
        ) => void
    ): UnaryResponse;
    nodeAudit(
        requestMessage: faraday_pb.NodeAuditRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: faraday_pb.NodeAuditResponse | null
        ) => void
    ): UnaryResponse;
    closeReport(
        requestMessage: faraday_pb.CloseReportRequest,
        metadata: grpc.Metadata,
        callback: (
            error: ServiceError | null,
            responseMessage: faraday_pb.CloseReportResponse | null
        ) => void
    ): UnaryResponse;
    closeReport(
        requestMessage: faraday_pb.CloseReportRequest,
        callback: (
            error: ServiceError | null,
            responseMessage: faraday_pb.CloseReportResponse | null
        ) => void
    ): UnaryResponse;
}
